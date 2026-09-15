"""
LogSetu — AI Integrator API Routes
"""
from __future__ import annotations

from typing import Any
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.ai_integrator.engine import get_ai_engine

router = APIRouter(prefix="/api/ai", tags=["AI Integrator"])


class AnalyzeRequest(BaseModel):
    sample_lines: list[str]
    source_name: str = ""
    mode: str = "auto"


class ApproveRequest(BaseModel):
    approver: str = "admin"


class ExplainRequest(BaseModel):
    raw_log: str = ""
    source_name: str = ""
    proposal: dict[str, Any] | None = None
    mode: str = "cloud"


class QARequest(BaseModel):
    query: str = ""
    raw_log: str = ""
    source_name: str = ""
    proposal: dict[str, Any] | None = None
    allow_web_search: bool = True
    mode: str = "cloud"


@router.post("/explain")
async def explain_active_log(req: ExplainRequest):
    """Generate genuine plain-English AI explanation of active log and its OCSF transformations."""
    from app.ai_integrator.explainer import explain_log
    return explain_log(req.raw_log, req.proposal, req.source_name, mode=req.mode)


@router.post("/qa")
async def ask_log_qa(req: QARequest):
    """Answer analyst questions using active log context + live DuckDuckGo web search."""
    from app.ai_integrator.explainer import answer_qa_query
    return answer_qa_query(
        query=req.query,
        raw_log=req.raw_log,
        proposal=req.proposal,
        source_name=req.source_name,
        allow_web_search=(req.allow_web_search and req.mode != "local"),
        mode=req.mode,
    )


@router.post("/analyze")
async def analyze_sample(req: AnalyzeRequest):
    """Submit sample lines for AI analysis. Returns a mapping proposal."""
    if not req.sample_lines:
        raise HTTPException(status_code=400, detail="No sample lines provided.")

    engine = get_ai_engine()
    proposal = await engine.analyze_sample(req.sample_lines, req.source_name, mode=req.mode)
    return proposal.model_dump(mode="json")


@router.post("/analyze/file")
async def analyze_file(
    file: UploadFile = File(...),  # noqa: B008
    source_name: str = Form(default=""),
    mode: str = Form(default="auto"),
):
    """Upload a log file for AI analysis."""
    content = await file.read()
    text = content.decode("utf-8", errors="replace")
    lines = [line.strip() for line in text.splitlines() if line.strip()]

    if not lines:
        raise HTTPException(status_code=400, detail="File is empty.")

    engine = get_ai_engine()
    proposal = await engine.analyze_sample(lines, source_name or file.filename or "uploaded", mode=mode)
    return proposal.model_dump(mode="json")


@router.get("/proposal/{proposal_id}")
def get_proposal(proposal_id: str):
    """Get a mapping proposal by ID."""
    engine = get_ai_engine()
    proposal = engine.get_proposal(proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found.")
    return proposal.model_dump(mode="json")


@router.post("/approve/{proposal_id}")
def approve_proposal(proposal_id: str, req: ApproveRequest):
    """Admin approves a mapping proposal (validation gate)."""
    engine = get_ai_engine()
    proposal = engine.approve(proposal_id, approver=req.approver)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found.")
    return proposal.model_dump(mode="json")


@router.post("/reject/{proposal_id}")
def reject_proposal(proposal_id: str):
    """Reject a mapping proposal."""
    engine = get_ai_engine()
    proposal = engine.reject(proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found.")
    return proposal.model_dump(mode="json")


@router.get("/mappings")
def list_mappings():
    """List all mapping proposals (pending, approved, rejected)."""
    engine = get_ai_engine()
    proposals = engine.list_proposals()
    return {
        "total": len(proposals),
        "proposals": [p.model_dump(mode="json") for p in proposals],
    }


@router.get("/mappings/approved")
def list_approved():
    """List only approved mappings."""
    engine = get_ai_engine()
    approved = engine.list_approved()
    return {
        "total": len(approved),
        "mappings": [m.model_dump(mode="json") for m in approved],
    }
