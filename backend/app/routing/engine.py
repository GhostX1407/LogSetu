"""
LogSetu — Tiered Routing Engine
Classifies normalized events into storage and processing tiers:
  Tier 1: Real-time processing & hot SIEM storage (High/Critical, Security Findings, Auth Failures)
  Tier 2: Sampled / aggregated processing (Medium/Low network traffic, standard audits)
  Tier 3: Cold archival storage (Verbose debug, routine heartbeats, low-risk telemetry)

Computes volume reduction % to demonstrate SIEM ingestion cost savings.
"""
from __future__ import annotations

import threading

from app.models.events import NormalizedEvent, RoutingStats, Severity, Tier


class TieredRoutingEngine:
    """Classifies events and calculates volume reduction."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._total = 0
        self._tier1_count = 0
        self._tier2_count = 0
        self._tier3_count = 0

    def classify(self, event: NormalizedEvent) -> Tier:
        """Classify a normalized event into Tier 1, 2, or 3."""
        # Tier 1: Security findings, authentication failures, high/critical severities
        if event.severity in (Severity.HIGH, Severity.CRITICAL) or event.class_uid in (1001, 2001) or event.is_anomaly:
            tier = Tier.TIER1_REALTIME
        # Tier 3: Routine debug or base events
        elif event.severity == Severity.INFO and event.class_uid == 0:
            tier = Tier.TIER3_ARCHIVED
        # Tier 2: Standard network activity and others
        else:
            tier = Tier.TIER2_SAMPLED

        with self._lock:
            self._total += 1
            if tier == Tier.TIER1_REALTIME:
                self._tier1_count += 1
            elif tier == Tier.TIER2_SAMPLED:
                self._tier2_count += 1
            else:
                self._tier3_count += 1

        return tier

    def get_stats(self) -> RoutingStats:
        """Return computed routing statistics."""
        with self._lock:
            total = max(1, self._total)
            reduction = ((total - self._tier1_count) / total) * 100
            return RoutingStats(
                total_events=self._total,
                tier1_count=self._tier1_count,
                tier2_count=self._tier2_count,
                tier3_count=self._tier3_count,
                volume_reduction_pct=round(reduction, 2),
                tier1_events_per_sec=round(self._tier1_count / 10.0, 1),
                tier3_events_per_min=round(self._tier3_count * 6.0, 0),
            )


# ── Singleton ────────────────────────────────────────────────────────────────
_engine: TieredRoutingEngine | None = None


def get_routing_engine() -> TieredRoutingEngine:
    global _engine
    if _engine is None:
        _engine = TieredRoutingEngine()
    return _engine
