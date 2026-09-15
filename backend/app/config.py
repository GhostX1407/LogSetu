"""
LogSetu — Central Configuration
Reads from environment variables with sensible defaults for local development.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env (backend/.env or project root .env)
load_dotenv()
_backend_env = Path(__file__).resolve().parent.parent / ".env"
if _backend_env.exists():
    load_dotenv(_backend_env)

# ── Paths ────────────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent  # backend/
DATA_DIR = PROJECT_ROOT / "data"
SAMPLE_LOGS_DIR = DATA_DIR / "sample_logs"
RAW_STORE_DIR = DATA_DIR / "raw_store"
KEYS_DIR = DATA_DIR / "keys"
APPROVED_MAPPINGS_DIR = DATA_DIR / "approved_mappings"

# Ensure critical directories exist
for d in (RAW_STORE_DIR, KEYS_DIR, APPROVED_MAPPINGS_DIR):
    d.mkdir(parents=True, exist_ok=True)

# ── External Services ────────────────────────────────────────────────────────
REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
OPENSEARCH_URL: str = os.getenv("OPENSEARCH_URL", "http://localhost:9200")

# ── AI Integrator ────────────────────────────────────────────────────────────
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-20b")
ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
AI_MODEL: str = os.getenv("AI_MODEL", GEMINI_MODEL)
AI_ENABLED: bool = bool(GEMINI_API_KEY or GROQ_API_KEY or ANTHROPIC_API_KEY or OPENAI_API_KEY)

# ── Hash-chain ───────────────────────────────────────────────────────────────
CHECKPOINT_INTERVAL: int = int(os.getenv("CHECKPOINT_INTERVAL", "10"))
# Number of events between signed checkpoints (configurable per compliance policy)

# ── Drift Detection ─────────────────────────────────────────────────────────
DRIFT_WINDOW_SIZE: int = int(os.getenv("DRIFT_WINDOW_SIZE", "100"))
DRIFT_THRESHOLD: float = float(os.getenv("DRIFT_THRESHOLD", "0.90"))

# ── Tiered Routing ───────────────────────────────────────────────────────────
TIER1_SEVERITY_THRESHOLD: str = os.getenv("TIER1_SEVERITY", "high")
# Events at or above this severity go to real-time path

# ── Alerting ─────────────────────────────────────────────────────────────────
WEBHOOK_URL: str = os.getenv("WEBHOOK_URL", "")
# If empty, alerts are logged to console only

# ── Feature Flags ────────────────────────────────────────────────────────────
OPENSEARCH_ENABLED: bool = os.getenv("OPENSEARCH_ENABLED", "false").lower() == "true"
REDIS_ENABLED: bool = os.getenv("REDIS_ENABLED", "false").lower() == "true"

# ── Anomaly Detection ────────────────────────────────────────────────────────
ANOMALY_THRESHOLD: float = float(os.getenv("ANOMALY_THRESHOLD", "0.85"))
ANOMALY_TRAINING_SIZE: int = int(os.getenv("ANOMALY_TRAINING_SIZE", "50"))
