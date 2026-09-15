"""
LogSetu — Immutable Raw Log Storage
Write-once, content-addressed storage for raw log events.
Every raw event is persisted to disk with its hash for forensic proof.
"""
from __future__ import annotations

import json
import logging
import threading
from datetime import datetime, timezone

from app.config import RAW_STORE_DIR
from app.hashchain.engine import HashChainEngine
from app.models.events import RawEvent

logger = logging.getLogger("logsetu.raw_store")


class RawStore:
    """
    In-memory + on-disk raw event store.
    Events are indexed by event_id for O(1) lookup.
    On-disk layout: data/raw_store/{event_id}.json
    """

    def __init__(self, hashchain: HashChainEngine) -> None:
        self._lock = threading.Lock()
        self._events: dict[str, RawEvent] = {}  # event_id -> RawEvent
        self._event_order: list[str] = []         # chronological order
        self._hashchain = hashchain

    def store(self, raw_text: str, source: str = "", detected_format: str = "unknown", description: str = "", custom_name: str = "") -> RawEvent:
        """
        Store a raw log event immutably.
        Computes content hash, appends to hash chain, persists to disk.
        Returns the stored RawEvent.
        """
        from app.models.events import LogFormat

        content_hash = self._hashchain.content_hash(raw_text)

        # Create the raw event
        event = RawEvent(
            raw_text=raw_text,
            source=source,
            detected_format=LogFormat(detected_format) if detected_format in LogFormat.__members__.values() else LogFormat.UNKNOWN,
            content_hash=content_hash,
            custom_name=custom_name or "",
            timestamp=datetime.now(timezone.utc),
        )

        # Append to hash chain
        block = self._hashchain.append(
            raw_text=raw_text,
            event_id=event.event_id,
            description=description or f"{source} ({detected_format})",
            custom_name=custom_name or "",
        )
        event.chain_index = block.block_id
        event.chain_hash = block.block_hash

        with self._lock:
            self._events[event.event_id] = event
            self._event_order.append(event.event_id)

        # Persist to disk (fire-and-forget for speed)
        self._persist(event)

        return event

    def get(self, event_id: str) -> RawEvent | None:
        """Retrieve a raw event by ID."""
        with self._lock:
            return self._events.get(event_id)

    def get_recent(self, count: int = 20) -> list[RawEvent]:
        """Get the N most recent raw events (newest first)."""
        with self._lock:
            ids = self._event_order[-count:]
            return [self._events[eid] for eid in reversed(ids) if eid in self._events]

    def total_count(self) -> int:
        with self._lock:
            return len(self._events)

    def _persist(self, event: RawEvent) -> None:
        """Write event to disk as JSON."""
        try:
            path = RAW_STORE_DIR / f"{event.event_id}.json"
            data = event.model_dump(mode="json")
            path.write_text(json.dumps(data, indent=2, default=str), encoding="utf-8")
        except (OSError, ValueError, TypeError) as e:
            # Don't crash ingestion on disk write failure
            logger.warning(f"Failed to persist event {event.event_id}: {e}")


# ── Singleton ────────────────────────────────────────────────────────────────
_store: RawStore | None = None


def get_raw_store() -> RawStore:
    """Get or create the global raw store singleton."""
    global _store
    if _store is None:
        from app.hashchain.engine import get_hashchain_engine
        _store = RawStore(get_hashchain_engine())
    return _store
