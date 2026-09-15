"""
LogSetu — JSON Log Parser
Parses JSON-formatted log lines into structured fields.
"""
from __future__ import annotations

import json
from typing import Any


def parse_json_log(raw_text: str) -> dict[str, Any]:
    """
    Parse a JSON log line into structured fields.
    Handles nested objects by flattening with dot notation.
    """
    text = raw_text.strip()
    result: dict[str, Any] = {"_parser": "json"}

    try:
        data = json.loads(text)
    except (json.JSONDecodeError, ValueError):
        result["message"] = text
        result["event_type"] = "unparsed_json"
        return result

    if not isinstance(data, dict):
        result["message"] = text
        result["event_type"] = "unparsed_json"
        return result

    # Flatten nested objects
    flat = _flatten(data)
    result.update(flat)

    # Normalize common field names
    field_aliases = {
        "timestamp": "timestamp",
        "time": "timestamp",
        "ts": "timestamp",
        "@timestamp": "timestamp",
        "source_ip": "src_ip",
        "sourceIPAddress": "src_ip",
        "src": "src_ip",
        "destination_ip": "dst_ip",
        "dest_ip": "dst_ip",
        "dst": "dst_ip",
        "user": "username",
        "userName": "username",
        "user_name": "username",
        "userIdentity.userName": "username",
        "event": "event_name",
        "eventName": "event_name",
        "eventType": "event_name",
        "action": "action",
        "result": "action_result",
        "status": "action_result",
        "outcome": "action_result",
        "service": "service",
        "reason": "reason",
        "severity": "severity_str",
    }

    for alias, canonical in field_aliases.items():
        if alias in result and canonical not in result:
            result[canonical] = result[alias]

    # Determine event type
    event_name = str(result.get("event_name", "")).lower()
    action_result = str(result.get("action_result", "")).lower()

    if "login" in event_name or "logon" in event_name or "auth" in event_name:
        if "fail" in event_name or "fail" in action_result:
            result["event_type"] = "authentication_failure"
        else:
            result["event_type"] = "authentication_success"
    elif "access" in event_name or "assume" in event_name:
        result["event_type"] = "access_control"
    elif "create" in event_name or "delete" in event_name or "modify" in event_name:
        result["event_type"] = "account_change"
    else:
        result["event_type"] = "generic_json"

    return result


def _flatten(d: dict, parent_key: str = "", sep: str = ".") -> dict[str, Any]:
    """Flatten a nested dict using dot notation."""
    items: list[tuple[str, Any]] = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(_flatten(v, new_key, sep).items())
        elif isinstance(v, list):
            # Store lists as-is
            items.append((new_key, v))
        else:
            items.append((new_key, v))
    return dict(items)
