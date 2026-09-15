"""
LogSetu — Anomaly Detection API Routes
Isolation Forest model over normalized event features.
"""
from __future__ import annotations

import random

from fastapi import APIRouter

router = APIRouter(prefix="/api/anomaly", tags=["Anomaly Detection"])

# In-memory anomaly history (populated by pipeline)
_anomaly_events: list[dict] = []

# Pre-seeded demo anomalies matching frontend's anomaly strip
_DEMO_ANOMALIES = [
    {
        "event_type": "WinSec 4625 (Failed Logon)",
        "score": 0.942,
        "contributors": "unusual dst_port (4444) + off-hours login (03:14 UTC)",
        "is_anomaly": True,
    },
    {
        "event_type": "AWS IAM CreateAccessKey",
        "score": 0.887,
        "contributors": "unusual geohash (TOR Exit) + root privilege escalation",
        "is_anomaly": True,
    },
    {
        "event_type": "K8s Privileged Pod Exec",
        "score": 0.965,
        "contributors": "service_account: cluster-admin + interactive bash",
        "is_anomaly": True,
    },
    {
        "event_type": "CrowdStrike Suspicious CobaltStrike",
        "score": 0.978,
        "contributors": "beaconing interval (1500ms) + unnamed pipe",
        "is_anomaly": True,
    },
]

# Initialize with 40 dots (matching frontend)
for i in range(40):
    if i == 14:
        _anomaly_events.append({**_DEMO_ANOMALIES[0], "index": i})
    elif i == 31:
        _anomaly_events.append({**_DEMO_ANOMALIES[1], "index": i})
    else:
        _anomaly_events.append({"is_anomaly": False, "score": round(random.uniform(0.05, 0.45), 3), "index": i})


@router.get("/stream")
def get_anomaly_stream():
    """Get the rolling anomaly detection dot stream (40 events)."""
    return {
        "count": len(_anomaly_events),
        "events": _anomaly_events[-40:],
    }


@router.get("/flagged")
def get_flagged_anomalies():
    """Get only flagged anomalies."""
    flagged = [e for e in _anomaly_events if e.get("is_anomaly")]
    return {
        "count": len(flagged),
        "anomalies": flagged,
    }
