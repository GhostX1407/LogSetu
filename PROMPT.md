# Build Prompt — LogSetu (SIH26156)

Paste this whole file as your instruction to Cursor / Antigravity / any
agentic coding tool. Read `docs/HANDOFF.md` in this same folder first for
full background — this prompt assumes that context and focuses on
**what to build, in what order, and how it should look and feel.**

---

## What you're building

**LogSetu** — a Universal Log Pre-processing Framework. It ingests logs in
any format (Syslog, CEF, JSON, and one deliberately "unseen" format used
for a live AI-onboarding demo), preserves the original raw log untouched
with a signed hash-chain for tamper-evidence, and produces a normalized,
OCSF-schema version with full click-through traceability back to the raw
original. An AI Integrator proposes field mappings for unfamiliar formats,
gated by a human-approval validation step. A toy correlation engine links
related events across sources and tags them with MITRE ATT&CK IDs. A tiered
router classifies events by value to demonstrate SIEM cost reduction.

This is a hackathon (Smart India Hackathon) submission for NTRO
(India's national technical intelligence agency), themed
"Blockchain & Cybersecurity." The audience is judges with real security
backgrounds — the demo needs to be genuinely functional (not hardcoded),
even if the underlying implementation is intentionally lightweight.

The repo you're working in already has a skeleton structure — respect it,
fill it in, don't restructure unless something is genuinely broken.

---

## Build priority — build in this exact order, and stop to confirm before moving to the next phase if anything is ambiguous

1. **Raw store + hash-chain + signing** (`backend/app/hashchain/`,
   `backend/app/storage/`) — every ingested raw log gets hashed, hashes
   chain to the previous entry, periodic checkpoints get signed with an
   Ed25519 keypair. Expose an endpoint to verify a checkpoint's signature
   and an endpoint that deliberately shows a chain break when a raw log is
   tampered with (for the live demo).
2. **Format detector + parsers** (`backend/app/parsers/`) for Syslog, CEF,
   and JSON, cascading detection, → **normalizer**
   (`backend/app/normalizer/`) mapping into OCSF-shaped normalized events,
   with a per-field `confidence` score and `contains_pii` /
   `data_classification` tags attached during normalization.
3. **Traceability API + UI** — every normalized event carries a
   `raw_event_id` + hash pointer back to its raw source; the frontend needs
   a click-through view showing raw and normalized side by side with
   matching fields highlighted.
4. **AI Integrator** (`backend/app/ai_integrator/`) — given raw sample
   lines from `data/sample_logs/unseen_format_sample.log` (a format with
   no existing parser), call an LLM to propose a field → OCSF mapping.
   **Critical: build the validation gate.** The proposed mapping must be
   run against a held-out sample batch, show a before/after diff with
   per-field confidence, and require explicit human approval (via the
   frontend, Admin role only) before the mapping is considered "live."
   Log every approved mapping with an approver name + timestamp.
5. **Drift detector** (`backend/app/drift_detector/`) — track parse
   success rate per source over a rolling window; if it drops below a
   threshold, flag it and trigger the AI Integrator flow again.
6. **Correlation engine** (`backend/app/correlation/`) — toy version: link
   2 normalized events sharing an IP/user within a configurable time
   window, tag the linked pair with a MITRE ATT&CK technique ID from a
   small hardcoded lookup table (e.g. repeated auth failures →
   T1110 Brute Force).
7. **Tiered router** (`backend/app/routing/`) — classify normalized events
   into Tier 1 (real-time)/Tier 2 (sampled)/Tier 3 (dropped/archived)
   based on severity + source type. Compute and expose an actual
   "% volume reduction" stat comparing raw ingested volume vs. Tier-1
   forwarded volume, using the sample Windows-style noisy log data you
   generate for this — this number needs to show up on the dashboard.
8. **Alerting hook** — a webhook call (can point to a mock endpoint/console
   log for the demo) fired when a Tier-1-severity event or a drift alert
   occurs.
9. **Anomaly detection demo** — a simple isolation-forest model
   (scikit-learn) run over the normalized event stream, flagging outliers
   in the dashboard.

Wire real API routes (`backend/app/api/`) for all of the above as you go —
don't leave the frontend calling mock data by the time you're done with a
phase.

---

## Frontend direction — this is where I want something genuinely distinctive

Do **not** build a generic SaaS admin-dashboard look (white cards, blue
accent, generic icon grid, sidebar + topbar layout you've seen a thousand
times). That reads as templated and forgettable to judges who see dozens of
dashboards a day.

### The core idea: the pipeline itself is the hero UI element

Build a **live, animated node-graph visualization** of the log pipeline as
the centerpiece of the dashboard — not a static architecture diagram, an
actual animated canvas where:
- Nodes represent pipeline stages: Collector → Raw Store → Format
  Detector → Parser → Normalizer → Tiered Router → (SIEM / Anomaly
  Detection / Data Lake)
- When a log is ingested (real or simulated for demo purposes), a small
  animated packet/particle actually travels along the edges from node to
  node in real time, and each node briefly highlights as it processes that
  event
- Clicking a node shows a side panel with what's happening there right now
  (e.g. clicking "Format Detector" shows the last N logs and what format
  each was classified as)

This pattern — a node/workflow canvas as the primary interface — is
genuinely current in 2025–2026 developer-tool design (see: n8n, LangGraph
Studio, Figma's canvas language, Linear's command-palette-driven density)
rather than a borrowed aesthetic. It's also *earned* here, not decorative:
the product's whole value proposition is "this pipeline processes anything
you throw at it," so watching it do that live, node by node, is both the
best demo and the most honest visual metaphor available.

### Visual language
- **Dense, monospace-inflected, terminal/SOC aesthetic** — think Linear /
  Raycast / Bloomberg-terminal, not Notion/generic-SaaS. Use a monospace
  font (JetBrains Mono, already configured in `tailwind.config.js`) for
  data, IDs, hashes, and code-like content; a clean sans (Inter, already
  configured) for UI chrome and prose.
- **Dark mode is the default and the "real" mode** — this is a SOC tool,
  analysts work in dark rooms. Light mode must still look genuinely good
  (not just an inverted-color afterthought), toggled via the theme button
  already wired up in `ThemeContext.jsx`.
- **Sparse, deliberate color** — mostly graphite/indigo neutrals (already
  set up in `tailwind.config.js` as `base`/`panel`), with the accent color
  used *only* for live/active states, CTAs, and alerts — not decoratively.
  A teal "signal" color is available for confidence scores / healthy
  states.
- **Command palette (Cmd+K / Ctrl+K)** for power-user navigation between
  views (Dashboard, Traceability, AI Integrator, Correlation, Settings) —
  another current trend (Linear, Raycast, Vercel) that fits a SOC-analyst
  power-user audience well, and is cheap to add with a small library or a
  hand-rolled modal + fuzzy match.
- **Real-time feel everywhere**, not just the pipeline canvas: live-updating
  counters (events/sec, tier distribution, drift status), subtle pulse
  animations on active nodes, monospace timestamps ticking.

### Pages/views to build
- `/dashboard` — the pipeline canvas (hero), plus live stat strip (events/sec,
  volume reduction %, active drift alerts, hash-chain status)
- `/traceability` — raw↔normalized click-through, field-highlighting
- `/ai-integrator` — the onboarding flow: feed sample logs in, see the
  proposed mapping + confidence, before/after diff, Approve/Edit (Admin
  role only) button
- `/correlation` — linked-incident list with MITRE tags
- Login page and role-gating are already scaffolded in
  `frontend/src/pages/Login.jsx` and `App.jsx` — keep the mocked-auth
  approach (no real backend auth), just make the login screen visually
  match the rest of the app's design language once you've established it,
  and make sure Admin-only UI elements (e.g. "Approve AI Mapping") actually
  check `localStorage.getItem('logsetu-role')`.

### Explicit constraints
- Keep dark/light mode fully functional throughout — every new
  component must respect the `dark:` Tailwind variants, not just the
  pages already scaffolded.
- Don't add real backend authentication, real PII redaction, real threat
  intel feeds, or any of the items explicitly listed as "architecture doc
  only" in `docs/HANDOFF.md` Section 4 — build the flagging/tagging logic
  only, not the full systems behind them.
- Every claim the UI makes (volume-reduction %, confidence scores, drift
  status) should be computed from real logic over the sample data, not
  hardcoded numbers — judges will ask to see different input and it needs
  to respond correctly.

---

## Sample data already in the repo

`data/sample_logs/` contains `syslog_sample.log`, `cef_sample.log`,
`json_sample.log` (known formats, for the core pipeline), and
`unseen_format_sample.log` (a deliberately invented pipe-delimited format
with no existing parser — use this one specifically for the live AI
Integrator onboarding demo). Feel free to generate more synthetic sample
data in the same formats to make the tiered-routing volume-reduction demo
and the correlation demo convincing (e.g. a batch of repeated
Windows-Event-Log-style noisy entries plus a few high-signal auth-failure
entries).

---

## When you're done with each phase

Run it, confirm the relevant API route responds and the relevant frontend
view reflects real data (not a stub), then move to the next phase. Don't
silently skip ahead if something in an earlier phase is still stubbed.
