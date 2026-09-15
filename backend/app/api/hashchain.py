"""
LogSetu — Hash-Chain API Routes
Endpoints for chain verification, tamper simulation, and block inspection.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.hashchain.engine import get_hashchain_engine
from app.storage.raw_store import get_raw_store

router = APIRouter(prefix="/api/hashchain", tags=["Hash Chain"])


@router.get("/blocks")
def list_blocks(count: int = 10):
    """List recent hash-chain blocks (newest first) enriched with log metadata."""
    engine = get_hashchain_engine()
    raw_store = get_raw_store()
    blocks = engine.get_recent_blocks(count)
    enriched = []
    for b in blocks:
        data = b.model_dump(mode="json")
        data["custom_name"] = getattr(b, "custom_name", "") or ""
        if b.events:
            raw_evt = raw_store.get(b.events[0])
            if raw_evt:
                data["raw_event_id"] = raw_evt.event_id
                data["raw_text"] = raw_evt.raw_text
                data["source"] = raw_evt.source
                data["detected_format"] = raw_evt.detected_format.value
                data["content_hash"] = raw_evt.content_hash
                if getattr(raw_evt, "custom_name", ""):
                    data["custom_name"] = raw_evt.custom_name
        enriched.append(data)
    return {
        "total_blocks": engine.total_blocks(),
        "latest_block_id": engine.latest_block_id(),
        "public_key": engine.public_key_hex,
        "blocks": enriched,
    }


@router.get("/blocks/{block_id}")
def get_block(block_id: int):
    """Get a specific block by ID enriched with log metadata."""
    engine = get_hashchain_engine()
    block = engine.get_block(block_id)
    if not block:
        raise HTTPException(status_code=404, detail=f"Block #{block_id} not found.")
    data = block.model_dump(mode="json")
    data["custom_name"] = getattr(block, "custom_name", "") or ""
    if block.events:
        raw_store = get_raw_store()
        raw_evt = raw_store.get(block.events[0])
        if raw_evt:
            data["raw_event_id"] = raw_evt.event_id
            data["raw_text"] = raw_evt.raw_text
            data["source"] = raw_evt.source
            data["detected_format"] = raw_evt.detected_format.value
            data["content_hash"] = raw_evt.content_hash
            if getattr(raw_evt, "custom_name", ""):
                data["custom_name"] = raw_evt.custom_name
    return data


@router.post("/verify")
def verify_chain():
    """Verify entire chain integrity and return result."""
    engine = get_hashchain_engine()
    result = engine.verify_chain()
    return result


from pydantic import BaseModel
from typing import Optional


class TamperPayload(BaseModel):
    block_id: Optional[int] = None
    tamper_raw: bool = True


@router.post("/tamper")
def simulate_tamper(payload: Optional[TamperPayload] = None):
    """Deliberately corrupt a specific block or raw event for generic tamper detection."""
    engine = get_hashchain_engine()
    b_id = payload.block_id if payload else None
    t_raw = payload.tamper_raw if payload else True
    result = engine.simulate_tamper(block_id=b_id, tamper_raw=t_raw)
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Tamper failed"))
    return result


@router.post("/heal")
def heal_chain():
    """Restore the tampered block from backup."""
    engine = get_hashchain_engine()
    result = engine.heal_tamper()
    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Heal failed"))
    return result


@router.get("/checkpoint/latest")
def latest_checkpoint():
    """Get the latest signed checkpoint."""
    engine = get_hashchain_engine()
    cp = engine.get_latest_checkpoint()
    if not cp:
        raise HTTPException(status_code=404, detail="No checkpoints yet.")
    return cp.model_dump(mode="json")
