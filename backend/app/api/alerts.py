"""
LogSetu — Alerting API Routes
Webhook dispatch and alert history.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.alerting.engine import get_alerting_engine

router = APIRouter(prefix="/api/alerts", tags=["Alerting"])


@router.get("/recent")
def get_recent_alerts(count: int = 20):
    """Get recent alert history."""
    engine = get_alerting_engine()
    alerts = engine.get_recent(count)
    return {
        "count": len(alerts),
        "alerts": alerts,
    }


@router.post("/webhook/test")
def test_webhook():
    """Fire a test alert."""
    engine = get_alerting_engine()
    alert = engine.dispatch(
        summary="Test alert from LogSetu security engine",
        severity="info",
        source="system",
    )
    return {"success": True, "alert": alert, "message": "Test alert dispatched."}
