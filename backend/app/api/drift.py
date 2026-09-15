"""
LogSetu — Drift Detection API Routes
"""
from __future__ import annotations

from fastapi import APIRouter

from app.drift_detector.engine import get_drift_engine

router = APIRouter(prefix="/api/drift", tags=["Drift Detection"])


@router.get("/status")
def get_drift_status():
    """Get drift status for all monitored sources."""
    engine = get_drift_engine()
    alerts = engine.get_all_alerts()
    return {
        "total_sources": len(alerts),
        "alerting_count": sum(1 for a in alerts if a.is_alerting),
        "sources": [a.model_dump(mode="json") for a in alerts],
    }


@router.get("/alerting")
def get_alerting():
    """Get only sources with active drift alerts."""
    engine = get_drift_engine()
    alerts = engine.get_alerting()
    return {
        "count": len(alerts),
        "alerts": [a.model_dump(mode="json") for a in alerts],
    }


@router.post("/remap/approve/{source}")
def approve_remap(source: str):
    """Approve AI re-mapping for a drifted source (resolves the alert)."""
    engine = get_drift_engine()
    alert = engine.resolve_drift(source)
    if alert:
        return {"success": True, "source": alert.model_dump(mode="json")}
    return {"success": False, "error": f"Source '{source}' not found."}
