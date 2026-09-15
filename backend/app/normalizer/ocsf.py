"""
LogSetu — OCSF Normalizer
Maps parsed source-specific fields into OCSF event classes.
Attaches per-field confidence scores, PII detection, and data classification.

OCSF Event Classes used:
  1001 = Authentication
  2001 = Security Finding
  3002 = Access Control (Authorization)
  4001 = Network Activity
  4002 = HTTP Activity
  1007 = Process Activity
"""
from __future__ import annotations

import re
from typing import Any

from app.models.events import (
    DataClassification,
    FieldConfidence,
    LogFormat,
    NormalizedEvent,
    Severity,
    Tier,
)

# ── PII Patterns ─────────────────────────────────────────────────────────────
_PII_EMAIL = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
_PII_SSN = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
_PII_CC = re.compile(r"\b(?:\d{4}[-\s]?){3}\d{4}\b")
_PII_PHONE = re.compile(r"\b(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b")
_PII_IP_PRIVATE = re.compile(r"\b(?:10\.\d{1,3}|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}\b")

_PII_PATTERNS = {
    "email": _PII_EMAIL,
    "ssn": _PII_SSN,
    "credit_card": _PII_CC,
    "phone": _PII_PHONE,
}

# ── Severity Mapping ─────────────────────────────────────────────────────────
_SYSLOG_SEV_MAP = {
    0: Severity.CRITICAL,  # Emergency
    1: Severity.CRITICAL,  # Alert
    2: Severity.CRITICAL,  # Critical
    3: Severity.HIGH,      # Error
    4: Severity.MEDIUM,    # Warning
    5: Severity.LOW,       # Notice
    6: Severity.INFO,      # Informational
    7: Severity.INFO,      # Debug
}

_CEF_SEV_MAP = {
    0: Severity.INFO, 1: Severity.INFO, 2: Severity.INFO, 3: Severity.LOW,
    4: Severity.LOW, 5: Severity.MEDIUM, 6: Severity.MEDIUM,
    7: Severity.HIGH, 8: Severity.HIGH, 9: Severity.CRITICAL, 10: Severity.CRITICAL,
}

_SEV_TO_ID = {
    Severity.INFO: 1, Severity.LOW: 2, Severity.MEDIUM: 3,
    Severity.HIGH: 4, Severity.CRITICAL: 5,
}


def normalize(parsed: dict[str, Any], raw_event_id: str, raw_hash: str,
              source_format: LogFormat) -> NormalizedEvent:
    """
    Normalize parsed fields into an OCSF-shaped NormalizedEvent.
    """
    event_type = parsed.get("event_type", "unknown")
    field_confidences: list[FieldConfidence] = []

    # ── Determine OCSF class ────────────────────────────────────────────
    ocsf_fields: dict[str, Any] = {}

    if event_type in ("authentication_success", "authentication_failure"):
        class_uid = 1001
        class_name = "Authentication"
        activity_id = 1 if event_type == "authentication_success" else 2
        activity_name = "Logon" if event_type == "authentication_success" else "Logon Failed"
    elif event_type == "security_finding":
        class_uid = 2001
        class_name = "Security Finding"
        activity_id = 1
        activity_name = "Create"
    elif event_type == "access_control":
        class_uid = 3002
        class_name = "Access Control (Authorization)"
        activity_id = 1
        activity_name = "Authorize"
    elif event_type in ("network_activity", "firewall_deny"):
        class_uid = 4001
        class_name = "Network Activity"
        activity_id = 5 if event_type == "firewall_deny" else 1
        activity_name = "Refuse" if event_type == "firewall_deny" else "Open"
    else:
        class_uid = 0
        class_name = "Base Event"
        activity_id = 0
        activity_name = "Unknown"

    # ── Map fields with confidence ──────────────────────────────────────
    # Timestamp
    ts_raw = parsed.get("timestamp", "")
    if ts_raw:
        ocsf_fields["time"] = ts_raw
        field_confidences.append(FieldConfidence(
            raw_field="timestamp", ocsf_field="time",
            confidence=1.0, method="direct",
        ))

    # Source IP
    src_ip = parsed.get("src_ip", "")
    if src_ip:
        ocsf_fields["src_endpoint.ip"] = src_ip
        field_confidences.append(FieldConfidence(
            raw_field="src_ip", ocsf_field="src_endpoint.ip",
            confidence=1.0, method="direct",
        ))

    # Destination IP
    dst_ip = parsed.get("dst_ip", "")
    if dst_ip:
        ocsf_fields["dst_endpoint.ip"] = dst_ip
        field_confidences.append(FieldConfidence(
            raw_field="dst_ip", ocsf_field="dst_endpoint.ip",
            confidence=1.0, method="direct",
        ))

    # Ports
    for port_field, ocsf_name in [("src_port", "src_endpoint.port"), ("dst_port", "dst_endpoint.port")]:
        if port_field in parsed:
            ocsf_fields[ocsf_name] = parsed[port_field]
            field_confidences.append(FieldConfidence(
                raw_field=port_field, ocsf_field=ocsf_name,
                confidence=1.0, method="direct",
            ))

    # Username
    username = parsed.get("username", parsed.get("src_user", ""))
    if username:
        ocsf_fields["user.name"] = username
        field_confidences.append(FieldConfidence(
            raw_field="username/suser", ocsf_field="user.name",
            confidence=0.999, method="direct",
        ))

    # Domain
    domain = parsed.get("src_domain", "")
    if domain:
        ocsf_fields["user.domain"] = domain
        field_confidences.append(FieldConfidence(
            raw_field="src_domain/sdomain", ocsf_field="user.domain",
            confidence=0.998, method="direct",
        ))

    # Hostname
    hostname = parsed.get("hostname", parsed.get("src_hostname", ""))
    if hostname:
        ocsf_fields["src_endpoint.hostname"] = hostname
        field_confidences.append(FieldConfidence(
            raw_field="hostname/shost", ocsf_field="src_endpoint.hostname",
            confidence=0.996, method="direct",
        ))

    # Protocol
    protocol = parsed.get("protocol", parsed.get("proto", ""))
    if protocol:
        ocsf_fields["connection_info.protocol_name"] = protocol.upper()
        field_confidences.append(FieldConfidence(
            raw_field="protocol/proto", ocsf_field="connection_info.protocol_name",
            confidence=0.95, method="regex",
        ))

    # Action / Disposition
    action = parsed.get("action", parsed.get("action_result", ""))
    if action:
        disposition_map = {
            "allow": ("Allowed", 1),
            "deny": ("Blocked", 2),
            "failure": ("Failed", 2),
            "success": ("Allowed", 1),
            "permit": ("Allowed", 1),
            "drop": ("Dropped", 4),
        }
        disp = disposition_map.get(action.lower(), (action, 0))
        ocsf_fields["disposition"] = disp[0]
        ocsf_fields["disposition_id"] = disp[1]
        field_confidences.append(FieldConfidence(
            raw_field="action/act", ocsf_field="disposition",
            confidence=0.965, method="regex",
        ))

    # Logon Type (Windows-specific)
    logon_type = parsed.get("logon_type", "")
    if logon_type:
        lt_map = {
            "2": "Interactive", "3": "Network", "4": "Batch",
            "5": "Service", "7": "Unlock", "8": "NetworkCleartext",
            "9": "NewCredentials", "10": "RemoteInteractive",
            "11": "CachedInteractive",
        }
        lt_val = logon_type.split()[0] if logon_type else ""
        mapped = lt_map.get(lt_val, logon_type)
        ocsf_fields["logon_type"] = mapped
        field_confidences.append(FieldConfidence(
            raw_field="logonType", ocsf_field="logon_type",
            confidence=0.994, method="direct",
        ))

    # CEF-specific: vendor, product, signature_id, name
    for f in ("vendor", "product", "signature_id", "name"):
        if f in parsed:
            ocsf_key = f"metadata.{f}" if f in ("vendor", "product") else f
            ocsf_fields[ocsf_key] = parsed[f]

    # Service
    if "service" in parsed:
        ocsf_fields["service.name"] = parsed["service"]

    # Reason
    if "reason" in parsed:
        ocsf_fields["status_detail"] = parsed["reason"]

    # Category (threat)
    category = parsed.get("category", "")
    cs1_label = parsed.get("custom_string_1_label", "")
    cs1 = parsed.get("custom_string_1", "")
    if category:
        ocsf_fields["category_name"] = category
    if cs1_label and cs1:
        ocsf_fields[f"custom.{cs1_label}"] = cs1

    # Message
    message = parsed.get("message", parsed.get("name", activity_name))

    # App name
    app_name = parsed.get("app_name", "")
    if app_name:
        ocsf_fields["app_name"] = app_name

    # ── Severity ────────────────────────────────────────────────────────
    severity = _resolve_severity(parsed, event_type)

    # ── PII Detection ───────────────────────────────────────────────────
    raw_text_for_pii = str(parsed)
    pii_fields: list[str] = []
    contains_pii = False

    for pii_type, pattern in _PII_PATTERNS.items():
        if pattern.search(raw_text_for_pii):
            contains_pii = True
            pii_fields.append(pii_type)

    # Usernames are quasi-PII
    if username:
        contains_pii = True
        if "username" not in pii_fields:
            pii_fields.append("username")

    # ── Data Classification ─────────────────────────────────────────────
    data_classification = _classify_data(parsed, event_type)

    # ── Tiered Routing ──────────────────────────────────────────────────
    tier = _classify_tier(severity, event_type)

    # ── Confidence ──────────────────────────────────────────────────────
    if field_confidences:
        overall_confidence = sum(fc.confidence for fc in field_confidences) / len(field_confidences)
    else:
        overall_confidence = 0.5

    # ── Hash traceability ───────────────────────────────────────────────
    ocsf_fields["ledger.parent_hash"] = raw_hash[:10] + "..." + raw_hash[-4:]
    ocsf_fields["ledger.raw_event_id"] = raw_event_id

    return NormalizedEvent(
        raw_event_id=raw_event_id,
        raw_hash=raw_hash,
        class_uid=class_uid,
        class_name=class_name,
        activity_id=activity_id,
        activity_name=activity_name,
        severity=severity,
        severity_id=_SEV_TO_ID.get(severity, 1),
        status=str(ocsf_fields.get("disposition", "")),
        message=str(message),
        source_name=parsed.get("hostname", parsed.get("service", "")),
        source_format=source_format,
        ocsf_fields=ocsf_fields,
        field_confidences=field_confidences,
        overall_confidence=round(overall_confidence, 4),
        contains_pii=contains_pii,
        pii_fields=pii_fields,
        data_classification=data_classification,
        tier=tier,
    )


def _resolve_severity(parsed: dict[str, Any], event_type: str) -> Severity:
    """Determine severity from parsed fields."""
    # Explicit severity number (syslog or CEF)
    sev_num = parsed.get("severity_num")
    parser = parsed.get("_parser", "")

    if sev_num is not None:
        if parser == "syslog":
            return _SYSLOG_SEV_MAP.get(sev_num, Severity.INFO)
        elif parser == "cef":
            return _CEF_SEV_MAP.get(sev_num, Severity.MEDIUM)

    # String severity
    sev_str = str(parsed.get("severity_str", "")).lower()
    if sev_str:
        str_map = {"info": Severity.INFO, "low": Severity.LOW, "warn": Severity.MEDIUM,
                    "warning": Severity.MEDIUM, "medium": Severity.MEDIUM,
                    "high": Severity.HIGH, "critical": Severity.CRITICAL,
                    "error": Severity.HIGH, "alert": Severity.CRITICAL}
        if sev_str in str_map:
            return str_map[sev_str]

    # Infer from event type
    type_sev = {
        "authentication_failure": Severity.MEDIUM,
        "security_finding": Severity.HIGH,
        "firewall_deny": Severity.MEDIUM,
    }
    return type_sev.get(event_type, Severity.INFO)


def _classify_data(parsed: dict[str, Any], event_type: str) -> DataClassification:
    """Infer data classification from source/content."""
    # Auth events involving admin or privileged accounts → Restricted
    username = str(parsed.get("username", parsed.get("src_user", ""))).lower()
    if username in ("root", "admin", "administrator", "svc_admin"):
        return DataClassification.RESTRICTED

    # Security findings → Restricted
    if event_type == "security_finding":
        return DataClassification.RESTRICTED

    # Events from domain controllers or critical infra → Restricted
    hostname = str(parsed.get("hostname", "")).lower()
    if any(kw in hostname for kw in ("dc", "domain", "controller", "prod")):
        return DataClassification.RESTRICTED

    return DataClassification.UNCLASSIFIED


def _classify_tier(severity: Severity, event_type: str) -> Tier:
    """Classify event into routing tier."""
    if severity in (Severity.HIGH, Severity.CRITICAL):
        return Tier.TIER1_REALTIME
    if event_type in ("authentication_failure", "security_finding"):
        return Tier.TIER1_REALTIME
    if severity == Severity.MEDIUM:
        return Tier.TIER2_SAMPLED
    return Tier.TIER3_ARCHIVED
