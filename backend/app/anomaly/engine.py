"""
LogSetu — Anomaly Detection Engine
Uses Isolation Forest (with statistical heuristics fallback) over normalized event features
(port, severity, hour of day, failed action status) to flag unusual activity patterns.
"""
from __future__ import annotations

import random
import threading
from datetime import datetime, timezone
from typing import Any

try:
    import numpy as np
    from sklearn.ensemble import IsolationForest
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


class AnomalyDetectorEngine:
    """Detects behavioral anomalies in normalized log streams."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._history: list[dict[str, Any]] = []
        self._model: Any | None = None
        self._training_features: list[list[float]] = []

        # Seed initial 40 dots matching frontend view
        self._seed_demo()

    def _seed_demo(self) -> None:
        demo_flagged = {
            14: {
                "event_type": "WinSec 4625 (Failed Logon)",
                "score": 0.942,
                "contributors": "unusual dst_port (4444) + off-hours login (03:14 UTC)",
                "is_anomaly": True,
            },
            31: {
                "event_type": "AWS IAM CreateAccessKey",
                "score": 0.887,
                "contributors": "unusual geohash (TOR Exit) + root privilege escalation",
                "is_anomaly": True,
            },
        }

        for i in range(40):
            if i in demo_flagged:
                self._history.append({**demo_flagged[i], "index": i})
            else:
                self._history.append({
                    "event_type": "Normal Telemetry",
                    "score": round(random.uniform(0.04, 0.38), 3),
                    "contributors": "nominal traffic baseline",
                    "is_anomaly": False,
                    "index": i,
                })

    def extract_features(self, event_dict: dict[str, Any]) -> list[float]:
        """Extract numeric features for anomaly scoring."""
        hour = float(datetime.now(timezone.utc).hour)
        sev_id = float(event_dict.get("severity_id", 1))
        port = float(event_dict.get("ocsf_fields", {}).get("dst_endpoint.port", 80))
        is_fail = 1.0 if "fail" in event_dict.get("activity_name", "").lower() or "deny" in event_dict.get("status", "").lower() else 0.0
        return [hour, sev_id, port, is_fail]

    def score_event(self, event_dict: dict[str, Any]) -> dict[str, Any]:
        """Score an incoming event for anomalous behavior."""
        feats = self.extract_features(event_dict)

        with self._lock:
            self._training_features.append(feats)
            if len(self._training_features) > 200:
                self._training_features = self._training_features[-200:]

            # Heuristic baseline scoring
            hour, sev_id, port, is_fail = feats
            score = 0.1

            # High risk port
            if port in (4444, 1337, 6667, 31337):
                score += 0.45
            # Severe failure
            if is_fail and sev_id >= 4:
                score += 0.40
            # Off hours (01:00 - 05:00 UTC)
            if 1 <= hour <= 5:
                score += 0.20

            # Sklearn isolation forest refinement if enough samples
            if SKLEARN_AVAILABLE and len(self._training_features) >= 20:
                try:
                    if not self._model or len(self._training_features) % 50 == 0:
                        self._model = IsolationForest(contamination=0.05, random_state=42)
                        self._model.fit(np.array(self._training_features))
                    raw_score = -self._model.score_samples(np.array([feats]))[0]
                    score = min(0.99, max(score, float(raw_score)))
                except (ValueError, TypeError, AttributeError, RuntimeError):
                    pass

            score = min(0.99, round(score, 3))
            is_anomaly = score >= 0.80

            result = {
                "event_type": event_dict.get("activity_name", "Security Event"),
                "score": score,
                "contributors": f"sev={sev_id}, port={int(port)}, hour={int(hour)}",
                "is_anomaly": is_anomaly,
                "index": len(self._history),
            }

            self._history.append(result)
            if len(self._history) > 100:
                self._history = self._history[-40:]

            return result

    def get_stream(self) -> list[dict[str, Any]]:
        """Return the last 40 anomaly detection dots."""
        with self._lock:
            return list(self._history[-40:])

    def get_flagged(self) -> list[dict[str, Any]]:
        """Return only flagged anomalies."""
        with self._lock:
            return [e for e in self._history if e.get("is_anomaly")]


# ── Singleton ────────────────────────────────────────────────────────────────
_engine: AnomalyDetectorEngine | None = None


def get_anomaly_engine() -> AnomalyDetectorEngine:
    global _engine
    if _engine is None:
        _engine = AnomalyDetectorEngine()
    return _engine
