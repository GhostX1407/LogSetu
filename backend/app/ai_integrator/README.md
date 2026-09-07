# AI Integrator
Given raw sample logs from an unseen source, proposes a field mapping to OCSF
(or the configured target schema) using an LLM. Every proposed mapping goes
through a validation gate: run against a held-out sample batch, show
before/after + per-field confidence, human approves/edits, then it goes live.
Hosted model used for demo speed; local/offline model path documented
for air-gapped deployments.
