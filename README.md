# LogSetu (लॉगसेतु)

Universal Log Pre-processing Framework — SIH26156, built for NTRO.
Theme: Blockchain & Cybersecurity.

**Start here:**
- `docs/HANDOFF.md` — full project background, every decision made, and why. Paste into any AI assistant for instant context.
- `PROMPT.md` — the build spec to hand to Cursor / Antigravity / an agentic coding tool.

## Structure

```
LogSetu/
├── backend/           FastAPI app — collectors, parsers, normalizer, AI integrator,
│                       drift detector, correlation engine, hash-chain, tiered router
├── frontend/           React + Vite + Tailwind — dashboard, traceability UI,
│                       AI Integrator flow, mocked login/roles, dark/light mode
├── data/sample_logs/   Sample logs (Syslog, CEF, JSON, + one unseen format for demo)
├── docs/HANDOFF.md      Full project handoff document
├── PROMPT.md            Build prompt for AI coding tools
└── docker-compose.yml   Full stack: backend, frontend, redis, opensearch
```

## Quick start (once built out)

```bash
docker compose up --build
# backend:  http://localhost:8000
# frontend: http://localhost:5173
# opensearch: http://localhost:9200
```

## Status

This is a scaffold, not a finished product. Backend has a working FastAPI
entrypoint + module stubs with READMEs describing each component's job.
Frontend has a working Vite+React+Tailwind setup with dark/light mode,
a mocked login/role screen, and routing wired up. Everything else is
built following `PROMPT.md`.
