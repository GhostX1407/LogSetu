"""
LogSetu — Pydantic models for all core data structures.
These models define the data contracts between backend modules and the API layer.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field

# ── Enums ────────────────────────────────────────────────────────────────────

class LogFormat(str, Enum):
    JSON = "json"
    XML = "xml"
    CEF = "cef"
    LEEF = "leef"
    SYSLOG = "syslog"
    UNKNOWN = "unknown"


class Severity(str, Enum):
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class DataClassification(str, Enum):
    UNCLASSIFIED = "Unclassified"
    RESTRICTED = "Restricted"
    SECRET = "Secret"


class Tier(str, Enum):
    TIER1_REALTIME = "tier1"
    TIER2_SAMPLED = "tier2"
    TIER3_ARCHIVED = "tier3"


class MappingStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ChainStatus(str, Enum):
    SEALED = "sealed"
    TAMPERED = "tampered"
    RESTORED = "restored"


# ── Raw Events ───────────────────────────────────────────────────────────────

class RawEvent(BaseModel):
    """An immutable raw log entry as received from the source."""
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    raw_text: str
    source: str = ""              # e.g. "fw01.branch.local", "okta"
    detected_format: LogFormat = LogFormat.UNKNOWN
    content_hash: str = ""        # SHA-256 of raw_text
    chain_index: int = -1         # position in the hash chain
    chain_hash: str = ""          # H(prev_hash || content_hash)
    custom_name: str = ""         # User-provided custom label / incident name


# ── Normalized Events (OCSF-shaped) ─────────────────────────────────────────

class FieldConfidence(BaseModel):
    """Per-field confidence for a normalized mapping."""
    raw_field: str
    ocsf_field: str
    confidence: float = 1.0       # 0.0 – 1.0
    method: str = "direct"        # direct | regex | inferred | ai


class NormalizedEvent(BaseModel):
    """An OCSF-shaped normalized event with traceability pointers."""
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    raw_event_id: str             # FK to RawEvent.event_id
    raw_hash: str                 # SHA-256 of original raw text
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # OCSF core fields
    class_uid: int = 0            # OCSF event class (1001=Auth, 4001=Network, etc.)
    class_name: str = ""
    activity_id: int = 0
    activity_name: str = ""
    severity: Severity = Severity.INFO
    severity_id: int = 1          # OCSF severity_id (1=Info, 2=Low, ... 5=Critical)
    status: str = ""
    status_id: int = 0
    message: str = ""

    # Source info
    source_name: str = ""
    source_format: LogFormat = LogFormat.UNKNOWN

    # Enriched OCSF fields (flat for simplicity)
    ocsf_fields: dict[str, Any] = Field(default_factory=dict)

    # Confidence & tagging
    field_confidences: list[FieldConfidence] = Field(default_factory=list)
    overall_confidence: float = 1.0
    contains_pii: bool = False
    pii_fields: list[str] = Field(default_factory=list)
    data_classification: DataClassification = DataClassification.UNCLASSIFIED

    # Routing
    tier: Tier = Tier.TIER1_REALTIME

    # Anomaly
    anomaly_score: float = 0.0
    is_anomaly: bool = False


# ── Hash-Chain Blocks ────────────────────────────────────────────────────────

class HashBlock(BaseModel):
    """A block in the tamper-evident hash chain."""
    block_id: int
    block_hash: str
    previous_hash: str
    event_count: int = 1
    events: list[str] = Field(default_factory=list)  # list of event_ids
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: ChainStatus = ChainStatus.SEALED
    description: str = ""
    custom_name: str = ""         # User-provided custom label / incident name

    # Checkpoint signing (only on periodic checkpoints)
    is_checkpoint: bool = False
    signature: str = ""           # Ed25519 signature hex
    public_key: str = ""


# ── Stream Event (for live dashboard) ────────────────────────────────────────

class StreamEvent(BaseModel):
    """What the frontend live-stream table expects."""
    time: str                     # UTC formatted HH:MM:SS.mmm
    source: str
    format: str                   # CEF, Syslog, JSON, etc.
    event_code: str = "—"
    activity_type: str            # OCSF class name + id
    severity: Severity = Severity.INFO
    tamper_status: str = "BLOCK OK"
    event_id: str = ""
    raw_event_id: str = ""


# ── AI Integrator ────────────────────────────────────────────────────────────

class FieldMapping(BaseModel):
    """A single field mapping proposed by AI or configured manually."""
    raw_field: str
    ocsf_field: str
    confidence: float = 0.0
    method: str = "ai"
    sample_raw_value: str = ""
    sample_ocsf_value: str = ""
    transformation: str = "direct"
    is_mapped: bool = True


class MappingProposal(BaseModel):
    """A complete AI-proposed mapping for an unknown log format."""
    proposal_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_name: str = ""
    detected_format: str = ""
    sample_lines: list[str] = Field(default_factory=list)
    field_mappings: list[FieldMapping] = Field(default_factory=list)
    overall_confidence: float = 0.0
    status: MappingStatus = MappingStatus.PENDING
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_by: str = ""
    approved_at: datetime | None = None
    ocsf_event: dict[str, Any] = Field(default_factory=dict)
    clean_json: str = ""
    fields_preserved: float = 100.0
    data_loss: float = 0.0
    mapped_count: int = 0
    unmapped_count: int = 0
    total_fields: int = 0
    schema_version: str = "OCSF v1.1.0"
    ai_mode: str = "cloud"
    model_engine: str = "Cloud-AI"

    model_config = {"protected_namespaces": ()}


# ── Drift Detection ──────────────────────────────────────────────────────────

class DriftAlert(BaseModel):
    """A drift alert for a log source whose format changed."""
    source_name: str
    current_success_rate: float
    previous_success_rate: float = 1.0
    threshold: float = 0.90
    is_alerting: bool = False
    unmapped_fields: list[str] = Field(default_factory=list)
    last_checked: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    remap_proposal_id: str = ""


# ── Correlation ──────────────────────────────────────────────────────────────

class CorrelatedIncident(BaseModel):
    """A cluster of correlated events across sources."""
    incident_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    linked_events: list[str] = Field(default_factory=list)  # event_ids
    correlation_key: str = ""     # e.g. "ip:203.0.113.45"
    correlation_type: str = ""    # "ip" | "user" | "ip+user"
    mitre_technique_id: str = ""  # e.g. "T1110"
    mitre_technique_name: str = ""  # e.g. "Brute Force"
    mitre_techniques: list[str] = Field(default_factory=list)  # e.g. ["T1110: Brute Force"]
    confidence: float = 0.0
    risk_score: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    sources: list[str] = Field(default_factory=list)


# ── Routing Stats ────────────────────────────────────────────────────────────

class RoutingStats(BaseModel):
    """Stats for the tiered routing cost-reduction engine."""
    total_events: int = 0
    tier1_count: int = 0
    tier2_count: int = 0
    tier3_count: int = 0
    volume_reduction_pct: float = 0.0
    tier1_events_per_sec: float = 0.0
    tier3_events_per_min: float = 0.0


# ── Dashboard Stats ──────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    """Aggregated stats for the overview dashboard."""
    events_per_sec: float = 0.0
    total_processed: int = 0
    total_blocks: int = 0
    parse_success_rate: float = 1.0
    normalization_accuracy: float = 1.0
    volume_reduction_pct: float = 0.0
    active_drift_alerts: int = 0
    chain_integrity: str = "VERIFIED"
    anomalies_detected: int = 0
    threats_detected: int = 0
