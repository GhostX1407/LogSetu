# AI Integrator
Given raw sample logs from an unseen source, proposes a field mapping to OCSF
using an LLM or local deterministic rule engine. Every proposed mapping goes
through a validation gate: run against a held-out sample batch, show
before/after schema diffs and per-field confidence, requiring explicit human approval
before activation. Supports both cloud hosted LLMs and air-gapped local execution.
