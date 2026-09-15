"""
LogSetu — Correlation API Routes
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.correlation.engine import get_correlation_engine

router = APIRouter(prefix="/api/correlation", tags=["Correlation"])


@router.get("/incidents")
def list_incidents():
    """List all correlated incidents with MITRE ATT&CK tags."""
    engine = get_correlation_engine()
    incidents = engine.get_incidents()
    return {
        "total": len(incidents),
        "incidents": [i.model_dump(mode="json") for i in incidents],
    }


@router.get("/incidents/{incident_id}")
def get_incident(incident_id: str):
    """Get a single incident detail."""
    engine = get_correlation_engine()
    incident = engine.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found.")
    return incident.model_dump(mode="json")
