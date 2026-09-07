# LogSetu — Full Project Handoff Document

**Project name:** LogSetu (लॉगसेतु — "log bridge")
**Problem Statement:** SIH26156 — Universal Log Pre-processing Framework (ULPF)
**Sponsor:** National Technical Research Organisation (NTRO)
**Theme:** Blockchain & Cybersecurity
**Deadline:** 20 Sept 2026
**Team:** 1–2 people currently, vibecoding with AI tools (Cursor / Antigravity / Claude)

> **Purpose of this document:** paste this entire file into any AI assistant
> (Claude, GPT, Cursor, Antigravity, etc.) and it will have full context on
> the problem, the architecture, every feature decision made, why each
> decision was made, and what's explicitly in/out of scope. Nothing here
> should need to be re-explained.

---

## 1. The problem, in plain language

Every network device (firewalls, servers, cloud apps, IAM, EDR, IoT) writes
logs in its own format — Syslog, JSON, XML, CEF, LEEF, proprietary. Security
teams need all these logs unified for monitoring, threat hunting, and
compliance, but today someone has to hand-write a custom parser for every
vendor/format before a SIEM can use the data. This doesn't scale to billions
of events/day across hundreds of sources.

**Goal:** Build a framework that ingests *any* log from *any* device/format,
keeps the original untouched (forensic proof), and also produces a
standardized, lossless, ML/SIEM-ready version — with full traceability
between the two, easy onboarding of new sources, and deployability in
air-gapped, containerized environments.

### Official requirement list (a–k)
a) Preserve complete raw event data without loss
b) Extract/parse source-specific attributes
c) Normalize fields into a common event taxonomy
d) Maintain traceability between normalized and original events
e) Plug-and-play onboarding of new log sources
f) Unified visibility across enterprise environments
g) Efficient SIEM and Data Lake integration
h) AI/ML-ready security and operational analytics
i) Reduced parser development effort
j) Deployable in an air-gapped network
k) Packageable in a container for platform independence

### Who's asking, and why it matters
NTRO is India's technical intelligence agency — roughly India's equivalent
of the NSA for signals/cyber intelligence. When NTRO sponsors something,
it's infrastructure meant to support India's national cybersecurity
monitoring capability — large government networks, critical infrastructure
(power grids, banks, defense networks). This is a serious, security-conscious
sponsor — correctness and defensibility matter more than flashy UI polish
for its own sake (though the UI should still be excellent — see Section 6).

India's critical infrastructure runs on a mix of foreign and Indian
hardware/software, all logging differently. A true indigenous SIEM/monitoring
capability (reducing dependency on foreign tools like Splunk/QRadar) needs
this "universal translator" layer first. There's an explicit
**Atmanirbhar Bharat (self-reliant India)** angle: this is foundational
infrastructure for India's own security tooling ecosystem, and it requires
**air-gapped deployment** — a hallmark of Indian defense/government networks.

---

## 2. Core architecture

```
[Log Sources: Syslog/JSON/XML/CEF/LEEF/proprietary]
        ↓
[Collector Layer] — syslog listener, file tail, API poller, cloud-native log pull
        ↓
[Raw Store] — immutable, hash-chained, write-once (object store + DB pointer)
        ↓
[Format Detector] — cascading detection: JSON → XML → CEF/LEEF header → Syslog RFC3164/5424 → fallback KV
        ↓
[Parser Router] → [Plugin Parsers] (config-driven YAML mapping OR AI-proposed mapping)
        ↓
[Normalizer] → common taxonomy (OCSF default; pluggable ECS/custom)
        ↓
[Enriched Normalized Event] ←traceability link (raw_event_id + hash)→ [Raw Store]
        ↓
[Tiered Router] — high-value → real-time path; low-value → batched/sampled path
        ↓
   ┌────────────┬──────────────┬────────────────┐
[SIEM/OpenSearch] [Data Lake/Parquet-MinIO] [ML/Anomaly Detection]
```

**Cross-cutting layers (always-on services, not pipeline steps):**
- AI Integrator (onboarding assistant)
- Drift Detector (continuous monitoring)
- Correlation Engine (cross-source entity matching)
- Observability/Health layer (pipeline self-monitoring)

---

## 3. Chosen tech stack (lightweight-first, upgradeable)

Decided deliberately for a 1–2 person team building in ~20 days. Every
piece can be swapped for the "heavier" industry-standard version later if
time/team size allows (noted below), but should **not** be over-built now.

| Layer | Chosen (default) | Heavier upgrade if time allows |
|---|---|---|
| Queue/buffer | Redis Streams | Kafka / Redpanda |
| Raw store | Local filesystem / SQLite + hash-chain logic | Object store (MinIO) |
| Search/SIEM layer | OpenSearch (single container) | keep as-is, it's already the real thing |
| Data lake tier | Local Parquet files (design-only demo) | Parquet on MinIO |
| Normalization schema | OCSF (default), pluggable ECS/custom | — |
| AI Integrator | Hosted LLM (Claude) for demo | Local/offline model path — **documented, not built** |
| Deployment | Docker Compose | — |
| Backend | Python (FastAPI) | — |
| Frontend | React (Vite) + Tailwind | — |

**Reasoning:** 3 containers (backend, Redis, OpenSearch) instead of 6+ keeps
the whole stack demoable and debuggable solo. OpenSearch is kept because it's
a single container, has a good UI out of the box, and "we output to
OpenSearch" is a strong, recognizable claim to judges.

---

## 4. Feature list — FINAL, locked

### Must build & demo live (MVP)
1. Raw store + hash-chain, **with cryptographic signing on periodic
   checkpoints** (Ed25519/RSA sign+verify) — proves authenticity externally
   with just a public key, not just internal consistency. *(Added late in
   planning — cheap on top of hash-chaining, meaningfully deepens the
   "Blockchain" theme justification.)*
2. Parsers for 2–3 real formats (Syslog, CEF, JSON) → OCSF normalization
3. AI Integrator onboarding a genuinely new/unseen format **live** —
   including a **human-in-the-loop validation gate**: AI proposes mapping →
   runs against a held-out sample batch → shows before/after + per-field
   confidence → human approves/edits → only then goes live. *(This directly
   answers the real industry critique that AI-generated parsers/regex can
   work on a training sample but silently fail on production edge cases —
   see Section 7 for sourcing.)*
4. Raw↔normalized traceability UI with click-through, field-highlighting
5. Docker Compose full stack, demoed with network disabled (air-gapped proof)

### Should build, partial demo acceptable
6. Drift detection triggering a re-mapping
7. Confidence/quality scoring per field (also feeds the validation gate above)
8. Cross-source correlation engine — toy version, 2 sources correlating on
   IP/user within a time window (e.g. firewall block + IAM failed login),
   **tagged with a MITRE ATT&CK technique ID** from a small lookup table
   *(cheap, disproportionate credibility signal to security-literate judges)*
9. Tiered/cost-aware routing — **reframed explicitly as a "cost reduction
   engine"** with a real number attached (see Section 7): classify a known
   noisy source (e.g. Windows Event Log or firewall allow-logs) into
   Tier 1/2/3, put an actual "% volume reduction, % detection coverage
   retained" figure on the pitch slide
10. Basic anomaly detection demo on normalized data (isolation forest)
11. **Sensitive-field / PII tagging** — regex-based flag (`contains_pii: true`)
    on fields that look like PII during normalization. Cheap (~30 min),
    feeds the compliance narrative.
12. **Data classification tagging** — `data_classification:
    Unclassified/Restricted/Secret` inferred from source type/content
    patterns. Very cheap, but a specific, government-context detail that
    signals deep understanding of NTRO's actual operating context — no
    generic SDPP vendor pitch would think to include this.
13. **Real-time alerting hook** — webhook/Slack/email notification when a
    Tier-1-severity event fires or drift crosses a threshold. Turns
    "we detect anomalies" (passive) into "we detect and act" (active).

### Architecture doc + design only — explicitly NOT built, stated as such
- Bring-your-own-schema pluggability (beyond OCSF/ECS toggle)
- Explainable normalization / NL compliance querying
- Multi-tenancy
- Schema versioning
- Deduplication/replay-safety
- Time normalization (mention explicitly; basic UTC conversion only)
- Real threat intel enrichment (STIX/TAXII)
- Real redaction/encryption infrastructure (only the PII *flag*, not actual redaction)
- Real backend authentication (see Section 6 — login is mocked deliberately)

**Deliberate stopping point:** the team explicitly decided NOT to keep
adding new subsystems past this list. Any new feature idea from here goes
into "future work" on the architecture doc, not into the build. The
remaining risk at this stage is under-execution on the existing list, not
under-scoping.

---

## 5. Naming

**Chosen name: LogSetu (लॉगसेतु)** — "log bridge."

Rationale: "Setu" (bridge) is a well-established, judge-recognizable Indian
govtech naming pattern (cf. Aarogya Setu). "LogSetu" is instantly
understandable — it's the bridge between raw and normalized logs, and
between every vendor's format and one common language — without needing a
slide to explain the name. It's also a compound rather than a single
borrowed word, which read as more "product-like" for a logo/slide treatment.

Other names seriously considered (kept here for reference / rebranding if
needed): Anuvad (अनुवाद, "translation" — the most literal alternative),
SarvaBhasha Setu (सर्वभाषा सेतु, "universal-language bridge"), Sakshya
(साक्ष्य, "evidence" — leaned hardest into the forensic/blockchain angle),
Kavach (कवच, "shield" — rejected as slightly overused in Indian govtech
pitches), Netra/SarvaNetra (नेत्र/सर्वनेत्र, "eye/all-seeing eye" — unified
visibility angle).

---

## 6. Frontend & UX decisions

- **Dark mode / light mode toggle is required.** Implemented via a
  `ThemeContext` + Tailwind `darkMode: 'class'`, persisted to
  `localStorage`. Default theme: dark (fits SOC/security-tool aesthetic).
- **Login page: included, but explicitly mocked.** Reasoning: for a
  security/SOC-facing tool, the *absence* of a login screen reads as a gap
  to security-literate judges — an "unauthenticated SIEM" undercuts the
  product's own credibility on a cybersecurity theme. Real backend
  auth (JWT, password hashing, OAuth) is **deliberately out of scope** —
  it's real security-product engineering that doesn't move any judging
  criterion for a hackathon demo. Instead: a genuinely polished login
  screen with 2–3 hardcoded/mocked roles (**Analyst / Admin / Auditor**)
  stored in `localStorage`, used only to gate a couple of UI elements
  (e.g. the "Approve AI Mapping" button is Admin-only). This reads as
  "this team thought about production concerns" at near-zero cost.
- **Frontend visual direction — "unique, trending, not generic hackathon
  UI":** see PROMPT.md Section on Frontend Direction for the full spec
  handed to the AI coding tool. Summary of the decision: lean into a
  **live, animated node-graph pipeline visualization** (raw log entering
  one end, flowing through detector → parser → normalizer → store nodes,
  animating in real time) as the hero UI element, in a dense
  monospace/terminal-adjacent aesthetic (Linear/Raycast/Bloomberg-terminal
  inspired) rather than generic SaaS-dashboard cards. This is genuinely
  trending in 2025–2026 dev-tool UI (node/workflow-canvas interfaces like
  n8n, LangGraph Studio, Figma's canvas language) and is *directly*
  relevant to this specific product rather than a generic aesthetic choice
  — the pipeline **is** the product, so visualizing it live is both
  differentiated and honest.

---

## 7. Business / industry grounding (for pitch narrative, "Impact" scoring)

Researched during planning — use these points directly in the pitch, they
are not hypothetical claims:

- This product category has a name in the industry: **Security Data
  Pipeline Platforms (SDPP)**. It is not a hypothetical hackathon concept —
  it's a real, funded category. Market leader Cribl does $200M+ ARR in
  exactly this space; the broader enterprise data management market is
  projected at $265.7B by 2030.
- **Why OCSF / vendor-neutral schema matters:** before OCSF, normalization
  meant adopting a vendor's proprietary schema (Splunk's CIM, Elastic's ECS,
  Microsoft's ASIM) — this created vendor lock-in, since migrating meant
  rewriting every parser, detection rule, and dashboard. LogSetu's
  pluggable-schema approach is the industry's own stated solution to this,
  not an invented differentiator.
- **Why air-gapped/on-prem is not a checkbox but the actual value
  proposition:** industry analysis explicitly states the buyer profile
  for this whole category — companies spending $200K–$2M/year on SIEM
  licensing — is FSI, healthcare, critical infrastructure, and government,
  which remain substantially on-premises for the data that matters most
  (endpoint telemetry, network flows, auth logs, OT device events). NTRO is
  exactly this buyer profile. Pitch line: *"we're not adding air-gapped as
  an afterthought — it's the reason this product exists for our actual
  customer, and it's the one thing international SaaS-based competitors in
  this category structurally cannot offer."*
- **Why the human-in-the-loop validation gate matters (technical
  defensibility):** industry sources explicitly flag that normalization and
  parsing being *deterministic vs. probabilistic* is a major open concern —
  if a pipeline extracts a field using an AI-generated regex that works on
  a training sample but fails on a production edge case, detection quietly
  breaks. LogSetu's validation gate (confidence scores + human approval
  before a mapping goes live) is presented as the direct, named answer to
  this exact, real industry objection.
- **Cost-reduction numbers to use on the pitch slide (tiered routing):**
  organizations that audit and filter high-velocity, low-value log sources
  typically cut SIEM ingestion volume by 30–50% without meaningful loss of
  detection coverage; some report 40–70% reductions. A concrete, well-known
  example: the Windows Security Event Log is roughly 60–70% noise at
  default settings, and filtering to a small set of high-signal event IDs
  (authentication, account changes, process creation) retains nearly all
  detection value. **Action:** pick one real noisy log type, demo the
  tiered router classifying it, and put an actual percentage figure on the
  slide.

---

## 8. SIH judging criteria (what this scope decisions are optimized for)

Consistent across sources on SIH internal + national rounds:
**Problem Understanding & Impact (~25%), Innovation & Technical Excellence
(~30%), Feasibility/Practicability/Sustainability, User Experience, scale of
impact, potential for future work.** For 2026 specifically: judges expect
visible AI integration, and explicitly want a **live demo that works with
any input, not a hardcoded/rehearsed-only demo** — hardcoded demos "get
caught."

Mapping of LogSetu's feature set to these criteria:
- **Innovation & Technical Excellence (30%, largest weight):** AI
  Integrator + validation gate, hash-chain + signing, MITRE-tagged
  correlation
- **Problem Understanding & Impact:** quantified cost-reduction (tiered
  routing), PII/classification tagging, air-gapped-as-value-prop narrative
- **Feasibility/Practicability:** deliberately scoped feature list
  (Section 4), lightweight stack (Section 3), explicit "future work" list
  rather than overclaiming
- **User Experience:** dark/light mode, mocked-but-polished login/roles,
  live pipeline visualization

---

## 9. 20-day build order (sequential layers, works for 1–2 people)

1. Raw store + hash chain (+ signing) — self-contained, no dependencies
2. Parser for Syslog → OCSF normalization — proves the pipeline end-to-end
3. Traceability UI (raw↔normalized click-through) — makes the demo look real
4. AI Integrator (hosted model) + validation gate — onboard an unseen 4th
   format live; document local-model swap path in the architecture doc
5. Hash-chain tamper demo (break it live, show detection)
6. Drift detection + toy correlation (MITRE-tagged) + confidence scoring +
   PII/classification tagging + tiered routing with real numbers +
   alerting hook — whatever time remains, roughly in this priority order

Steps 1–5 alone constitute a strong, complete submission on their own.

---

## 10. Deliverables checklist (per SIH requirements)

- [ ] Source code (GitHub repo)
- [ ] README with setup instructions (Docker Compose up, sample data, demo script)
- [ ] Architecture document (max 2 pages)
- [ ] Demo video (max 2 min) — script: raw log in → AI Integrator onboards
      unknown format → confidence scores shown → human approves →
      normalized output → traceability click-through → tamper the raw log,
      show hash-chain break → anomaly detected on normalized stream
- [ ] Technical presentation (max 5 slides): 1) Problem, 2) Architecture,
      3) AI Integrator + Drift Detection, 4) Hash-chain/Correlation
      differentiators, 5) Deployment (air-gapped/container) + cost-reduction
      impact stat

---

## 11. Pitch narrative (one-liner + elevator version)

**One-liner:** *"We don't just normalize logs — we quantify how well we
normalized them, prove they haven't been tampered with, and use AI to make
onboarding a new log source a 2-minute task instead of a 2-week one — all
while running fully air-gapped in a container, because that's what a
national security deployment actually requires."*

**Positioning line:** *"We're building India's own security data pipeline
platform — the category Cribl built a $200M+ business on — but for the one
buyer profile (government, critical infrastructure) that international
SaaS-based tools structurally can't serve, because they're not air-gapped."*
