"""
LogSetu — Universal Log Pre-processing Framework
FastAPI entrypoint. Wires together collectors, raw store, parser router,
normalizer, AI integrator, drift detector, correlation engine and API routes.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    ai,
    alerts,
    anomaly,
    correlation,
    drift,
    events,
    hashchain,
    ingest,
    routing,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("logsetu")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown logic."""
    # ── Startup ──────────────────────────────────────────────────────
    logger.info("LogSetu starting up...")

    # Seed pipeline with sample + synthetic data for demo
    from app.seed import seed_pipeline
    count = seed_pipeline(count=80)
    logger.info(f"Pipeline seeded with {count} events.")

    yield

    # ── Shutdown ─────────────────────────────────────────────────────
    logger.info("LogSetu shutting down.")


app = FastAPI(
    title="LogSetu API",
    description="Universal Log Pre-processing Framework (SIH26156)",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten before any real deployment
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ───────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "LogSetu"}


# ── Mount API Routers ────────────────────────────────────────────────────────
app.include_router(ingest.router)
app.include_router(hashchain.router)
app.include_router(events.router)
app.include_router(ai.router)
app.include_router(drift.router)
app.include_router(correlation.router)
app.include_router(routing.router)
app.include_router(alerts.router)
app.include_router(anomaly.router)
