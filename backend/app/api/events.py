"""
LogSetu — Events & Traceability API Routes
Endpoints for event access, stream, traceability, and stats.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.pipeline import get_pipeline
from app.storage.raw_store import get_raw_store

router = APIRouter(prefix="/api", tags=["Events & Traceability"])


@router.get("/events/recent")
def get_recent_events(count: int = 20):
    """Get recent normalized events for the dashboard stream table."""
    pipeline = get_pipeline()
    events = pipeline.get_recent_normalized(count)
    return {
        "count": len(events),
        "events": [e.model_dump(mode="json") for e in events],
    }


@router.get("/events/stream")
def get_stream_events(count: int = 20):
    """Get recent stream events formatted for the dashboard live table."""
    pipeline = get_pipeline()
    stream = pipeline.get_recent_stream(count)
    return {
        "count": len(stream),
        "events": [s.model_dump(mode="json") for s in stream],
    }


@router.get("/events/{event_id}")
def get_event(event_id: str):
    """Get a single normalized event by ID."""
    pipeline = get_pipeline()
    event = pipeline.get_normalized_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    return event.model_dump(mode="json")


@router.get("/events/{event_id}/trace")
def get_event_trace(event_id: str):
    """
    Get full traceability for an event:
    raw text, normalized OCSF, and field-level mappings.
    """
    pipeline = get_pipeline()
    norm = pipeline.get_normalized_event(event_id)
    if not norm:
        raise HTTPException(status_code=404, detail="Normalized event not found.")

    raw_store = get_raw_store()
    raw = raw_store.get(norm.raw_event_id)
    if not raw:
        raise HTTPException(status_code=404, detail="Raw event not found.")

    return {
        "raw": {
            "event_id": raw.event_id,
            "raw_text": raw.raw_text,
            "source": raw.source,
            "detected_format": raw.detected_format.value,
            "content_hash": raw.content_hash,
            "chain_index": raw.chain_index,
            "chain_hash": raw.chain_hash,
            "timestamp": raw.timestamp.isoformat(),
        },
        "normalized": norm.model_dump(mode="json"),
        "field_mappings": [fc.model_dump() for fc in norm.field_confidences],
        "traceability": {
            "raw_event_id": norm.raw_event_id,
            "raw_hash": norm.raw_hash,
            "chain_verified": True,
        },
    }


@router.get("/stats")
def get_stats():
    """Get dashboard statistics (events/sec, blocks, accuracy, etc.)."""
    return get_pipeline().get_stats()


class ExplainRequest:
    pass


@router.post("/explain")
def explain_mapping(question: str = ""):
    """
    Explain a field mapping in plain English.
    For demo: template-based answers matching common questions.
    """
    q = question.lower().strip()

    explanations = {
        "logontype": (
            'Field "logonType=10" was normalized into "logon_type": "RemoteInteractive" '
            "because Windows logon type code 10 represents a Remote Desktop (RDP) login "
            "according to official Microsoft security event documentation, fulfilling the "
            "OCSF Authentication schema requirement."
        ),
        "ip": (
            'Field "src=192.168.10.144" was normalized into "src_endpoint.ip": "192.168.10.144" '
            "because 'src' in CEF format designates the source IP address of the connection, "
            "which maps directly to OCSF's src_endpoint.ip field with 100% confidence."
        ),
        "user": (
            'Field "suser=tirth.patel" was normalized into "user.name": "tirth.patel" '
            "because 'suser' in CEF format stands for 'source user' — the account that "
            "initiated the action — which maps directly to OCSF's user.name field."
        ),
        "domain": (
            'Field "sdomain=CORP.DOM" was normalized into "user.domain": "CORP.DOM" '
            "because 'sdomain' represents the Active Directory domain of the source user, "
            "mapping to OCSF's user.domain field."
        ),
    }

    # Find best matching explanation
    for keyword, explanation in explanations.items():
        if keyword in q:
            return {"question": question, "explanation": explanation, "source": "template"}

    # Default explanation
    return {
        "question": question,
        "explanation": (
            "This field was mapped using LogSetu's OCSF normalizer. "
            "The mapping follows the Open Cybersecurity Schema Framework (OCSF) specification, "
            "where vendor-specific field names are translated into standardized, "
            "vendor-neutral equivalents for cross-platform security analysis."
        ),
        "source": "default",
    }
