"""
LogSetu — Ingestion API Routes
Endpoints for ingesting raw logs into the pipeline.
"""
from __future__ import annotations

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.pipeline import get_pipeline

router = APIRouter(prefix="/api/ingest", tags=["Ingestion"])


class IngestRequest(BaseModel):
    raw_text: str
    source: str = ""
    custom_name: str = ""


class IngestResponse(BaseModel):
    raw_event_id: str
    normalized_event_id: str
    detected_format: str
    chain_block_id: int
    content_hash: str
    custom_name: str = ""


class BatchIngestRequest(BaseModel):
    lines: list[str]
    source: str = ""
    custom_name: str = ""


@router.post("", response_model=IngestResponse)
def ingest_single(req: IngestRequest):
    """Ingest a single raw log line through the full pipeline."""
    try:
        raw, norm = get_pipeline().ingest(req.raw_text, source=req.source, custom_name=req.custom_name)
        return IngestResponse(
            raw_event_id=raw.event_id,
            normalized_event_id=norm.event_id,
            detected_format=raw.detected_format.value,
            chain_block_id=raw.chain_index,
            content_hash=raw.content_hash,
            custom_name=getattr(raw, "custom_name", "") or req.custom_name,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/batch")
def ingest_batch(req: BatchIngestRequest):
    """Ingest multiple raw log lines."""
    results = get_pipeline().ingest_batch(req.lines, source=req.source)
    return {
        "ingested": len(results),
        "events": [
            {
                "raw_event_id": r.event_id,
                "normalized_event_id": n.event_id,
                "detected_format": r.detected_format.value,
            }
            for r, n in results
        ],
    }


@router.post("/file")
async def ingest_file(
    file: UploadFile = File(...),  # noqa: B008
    source: str = Form(default=""),
    custom_name: str = Form(default=""),
):
    """Upload and ingest a log file (for the AI Wizard dropzone)."""
    content = await file.read()
    text = content.decode("utf-8", errors="replace")
    lines = [line for line in text.splitlines() if line.strip()]

    if not lines:
        raise HTTPException(status_code=400, detail="File is empty or contains no valid log lines.")

    effective_name = custom_name.strip() or file.filename or "Uploaded File"
    results = get_pipeline().ingest_batch(lines, source=source or file.filename or "uploaded_file")
    return {
        "filename": file.filename,
        "total_lines": len(lines),
        "ingested": len(results),
        "events": [
            {
                "raw_event_id": r.event_id,
                "normalized_event_id": n.event_id,
                "detected_format": r.detected_format.value,
            }
            for r, n in results
        ],
    }
