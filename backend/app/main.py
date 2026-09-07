"""
LogSetu — Universal Log Pre-processing Framework
FastAPI entrypoint. Wires together collectors, raw store, parser router,
normalizer, AI integrator, drift detector, correlation engine and API routes.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="LogSetu API",
    description="Universal Log Pre-processing Framework (SIH26156)",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten before any real deployment
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "LogSetu"}


# TODO: include routers once built, e.g.
# from app.api import events, ingest, ai_integrator, traceability, auth
# app.include_router(events.router, prefix="/api/events")
