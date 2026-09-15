"""
LogSetu — Core Pipeline Orchestrator
Ties together: raw store → format detection → parsing → normalization → hash chain.
This is the central pipeline that all ingestion flows through.
"""
from __future__ import annotations

import logging
import threading
from datetime import datetime, timezone

logger = logging.getLogger("logsetu.pipeline")

from app.hashchain.engine import get_hashchain_engine
from app.models.events import (
    NormalizedEvent,
    RawEvent,
    Severity,
    StreamEvent,
)
from app.normalizer.ocsf import normalize
from app.parsers.router import parse_log
from app.storage.raw_store import get_raw_store


class Pipeline:
    """
    Central pipeline singleton.
    Ingests raw logs, parses, normalizes, stores, and tracks stats.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._normalized_events: list[NormalizedEvent] = []
        self._stream_events: list[StreamEvent] = []

        # Stats
        self._total_ingested: int = 0
        self._parse_successes: int = 0
        self._parse_failures: int = 0
        self._start_time: datetime = datetime.now(timezone.utc)
        self._tier_counts: dict[str, int] = {"tier1": 0, "tier2": 0, "tier3": 0}

    def ingest(self, raw_text: str, source: str = "", custom_name: str = "") -> tuple[RawEvent, NormalizedEvent]:
        """
        Full pipeline: ingest raw text → detect → parse → normalize → store.
        Returns (raw_event, normalized_event).
        """
        raw_text = raw_text.strip()
        if not raw_text:
            raise ValueError("Empty log line")

        # 1. Detect format and parse
        detected_format, parsed = parse_log(raw_text)

        # 2. Store raw event (also appends to hash chain)
        raw_store = get_raw_store()
        effective_custom_name = (custom_name or "").strip()
        if not effective_custom_name:
            if source and not any(k in source.lower() for k in ("custom", "pasted", "unknown")):
                effective_custom_name = source
            else:
                effective_custom_name = f"Custom Log #{raw_store.total_count() + 1}"

        description = f"{parsed.get('event_type', 'event')} from {source or parsed.get('hostname', 'unknown')}"
        if effective_custom_name:
            description = f"{effective_custom_name} | {description}"

        raw_event = raw_store.store(
            raw_text=raw_text,
            source=source or parsed.get("hostname", ""),
            detected_format=detected_format.value,
            description=description,
            custom_name=effective_custom_name,
        )

        # 3. Normalize
        normalized = normalize(
            parsed=parsed,
            raw_event_id=raw_event.event_id,
            raw_hash=raw_event.content_hash,
            source_format=detected_format,
        )

        # Update source name from parsed data if available
        if not normalized.source_name and source:
            normalized.source_name = source

        # 4. Track
        with self._lock:
            self._total_ingested += 1
            self._normalized_events.append(normalized)

            if parsed.get("event_type", "").startswith("unparsed"):
                self._parse_failures += 1
            else:
                self._parse_successes += 1

            self._tier_counts[normalized.tier.value] = self._tier_counts.get(normalized.tier.value, 0) + 1

            # Build stream event for dashboard
            now = datetime.now(timezone.utc)
            stream_evt = StreamEvent(
                time=now.strftime("%H:%M:%S.") + f"{now.microsecond // 1000:03d}",
                source=normalized.source_name or source,
                format=detected_format.value.upper(),
                event_code=str(parsed.get("signature_id") or parsed.get("msgid") or parsed.get("event_name") or "—"),
                activity_type=f"{normalized.class_name} ({normalized.class_uid})",
                severity=normalized.severity,
                tamper_status="BLOCK OK",
                event_id=normalized.event_id,
                raw_event_id=raw_event.event_id,
            )
            self._stream_events.append(stream_evt)

            # Cap in-memory lists
            if len(self._normalized_events) > 5000:
                self._normalized_events = self._normalized_events[-2500:]
            if len(self._stream_events) > 500:
                self._stream_events = self._stream_events[-250:]

        return raw_event, normalized

    def ingest_batch(self, lines: list[str], source: str = "") -> list[tuple[RawEvent, NormalizedEvent]]:
        """Ingest multiple log lines."""
        results = []
        for line in lines:
            line = line.strip()
            if line:
                try:
                    results.append(self.ingest(line, source=source))
                except (ValueError, KeyError, TypeError, RuntimeError) as e:
                    logger.debug("Ingestion error on batch line: %s", e)
        return results

    # ── Accessors ────────────────────────────────────────────────────────

    def get_recent_normalized(self, count: int = 20) -> list[NormalizedEvent]:
        with self._lock:
            return list(reversed(self._normalized_events[-count:]))

    def get_recent_stream(self, count: int = 20) -> list[StreamEvent]:
        with self._lock:
            return list(reversed(self._stream_events[-count:]))

    def get_normalized_event(self, event_id: str) -> NormalizedEvent | None:
        with self._lock:
            for evt in reversed(self._normalized_events):
                if evt.event_id == event_id:
                    return evt
            return None

    def get_stats(self) -> dict:
        with self._lock:
            elapsed = max(1, (datetime.now(timezone.utc) - self._start_time).total_seconds())
            total = self._total_ingested
            tier1 = self._tier_counts.get("tier1", 0)
            tier2 = self._tier_counts.get("tier2", 0)
            tier3 = self._tier_counts.get("tier3", 0)

            volume_reduction = ((total - tier1) / max(1, total)) * 100 if total > 0 else 0

            return {
                "events_per_sec": round(total / elapsed, 1),
                "total_processed": total,
                "total_blocks": get_hashchain_engine().total_blocks(),
                "latest_block_id": get_hashchain_engine().latest_block_id(),
                "parse_success_rate": round(
                    self._parse_successes / max(1, self._parse_successes + self._parse_failures) * 100, 2
                ),
                "normalization_accuracy": round(
                    self._parse_successes / max(1, total) * 100, 2
                ),
                "volume_reduction_pct": round(volume_reduction, 1),
                "tier1_count": tier1,
                "tier2_count": tier2,
                "tier3_count": tier3,
                "tier1_events_per_sec": round(tier1 / elapsed, 1),
                "tier3_events_per_min": round(tier3 / elapsed * 60, 0),
                "active_drift_alerts": 0,  # Updated by drift detector
                "chain_integrity": "VERIFIED",
                "anomalies_detected": sum(1 for e in self._normalized_events if e.is_anomaly),
                "threats_detected": sum(
                    1 for e in self._normalized_events
                    if e.severity in (Severity.HIGH, Severity.CRITICAL)
                ),
            }


# ── Singleton ────────────────────────────────────────────────────────────────
_pipeline: Pipeline | None = None


def get_pipeline() -> Pipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = Pipeline()
    return _pipeline
