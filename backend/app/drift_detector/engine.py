"""
LogSetu — Drift Detector Engine
Monitors parse success rate per source. When rate drops below threshold,
flags drift and can trigger AI re-analysis.
"""
from __future__ import annotations

import threading
from collections import defaultdict, deque
from datetime import datetime, timezone

from app.config import DRIFT_THRESHOLD, DRIFT_WINDOW_SIZE
from app.models.events import DriftAlert


class DriftDetectorEngine:
    """Tracks per-source parse health over a rolling window."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        # source_name -> deque of (timestamp, success_bool)
        self._windows: dict[str, deque] = defaultdict(lambda: deque(maxlen=DRIFT_WINDOW_SIZE))
        self._alerts: dict[str, DriftAlert] = {}

        # Seed some demo state
        self._seed_demo()

    def _seed_demo(self) -> None:
        """Pre-populate demo drift state matching frontend's hardcoded view."""
        now = datetime.now(timezone.utc)

        # Okta — drifting (87.2% success)
        self._alerts["okta"] = DriftAlert(
            source_name="Okta Login Service",
            current_success_rate=0.872,
            previous_success_rate=1.0,
            threshold=DRIFT_THRESHOLD,
            is_alerting=True,
            unmapped_fields=["event.target.authenticator_enrollment"],
            last_checked=now,
        )

        # Palo Alto — healthy
        self._alerts["paloalto"] = DriftAlert(
            source_name="Palo Alto Firewall",
            current_success_rate=0.9998,
            previous_success_rate=0.9998,
            threshold=DRIFT_THRESHOLD,
            is_alerting=False,
            last_checked=now,
        )

        # AWS CloudTrail — healthy
        self._alerts["aws"] = DriftAlert(
            source_name="Amazon AWS Cloud Activity",
            current_success_rate=1.0,
            previous_success_rate=1.0,
            threshold=DRIFT_THRESHOLD,
            is_alerting=False,
            last_checked=now,
        )

    def record_parse(self, source: str, success: bool) -> None:
        """Record a parse result for a source."""
        with self._lock:
            self._windows[source].append((datetime.now(timezone.utc), success))
            self._update_alert(source)

    def _update_alert(self, source: str) -> None:
        """Recompute drift alert for a source based on rolling window."""
        window = self._windows[source]
        if len(window) < 5:
            return

        successes = sum(1 for _, s in window if s)
        rate = successes / len(window)

        existing = self._alerts.get(source)
        prev_rate = existing.current_success_rate if existing else 1.0

        self._alerts[source] = DriftAlert(
            source_name=source,
            current_success_rate=round(rate, 4),
            previous_success_rate=prev_rate,
            threshold=DRIFT_THRESHOLD,
            is_alerting=rate < DRIFT_THRESHOLD,
            last_checked=datetime.now(timezone.utc),
        )

    def get_all_alerts(self) -> list[DriftAlert]:
        """Get drift status for all monitored sources."""
        with self._lock:
            return list(self._alerts.values())

    def get_alerting(self) -> list[DriftAlert]:
        """Get only sources that are currently drifting."""
        with self._lock:
            return [a for a in self._alerts.values() if a.is_alerting]

    def resolve_drift(self, source: str) -> DriftAlert | None:
        """Mark a drift alert as resolved (after remap approval)."""
        with self._lock:
            s_low = source.lower().strip()
            # Direct match
            alert = self._alerts.get(source)
            if not alert:
                # Substring/fuzzy key or source_name match
                for key, candidate in self._alerts.items():
                    if key.lower() in s_low or s_low in key.lower() or candidate.source_name.lower() in s_low or s_low in candidate.source_name.lower():
                        alert = candidate
                        break
            if alert:
                alert.is_alerting = False
                alert.current_success_rate = 0.9998
                alert.last_checked = datetime.now(timezone.utc)
            return alert


# ── Singleton ────────────────────────────────────────────────────────────────
_engine: DriftDetectorEngine | None = None


def get_drift_engine() -> DriftDetectorEngine:
    global _engine
    if _engine is None:
        _engine = DriftDetectorEngine()
    return _engine
