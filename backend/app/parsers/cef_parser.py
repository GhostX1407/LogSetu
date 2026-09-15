"""
LogSetu — CEF (Common Event Format) Parser
Parses CEF:Version|Vendor|Product|DeviceVersion|SignatureID|Name|Severity|Extensions
"""
from __future__ import annotations

import re
from typing import Any

# CEF header: CEF:Version|Vendor|Product|DeviceVersion|SignatureID|Name|Severity|Extensions
_CEF_HEADER = re.compile(
    r"^CEF:(?P<version>\d+)\|"
    r"(?P<vendor>[^|]*)\|"
    r"(?P<product>[^|]*)\|"
    r"(?P<device_version>[^|]*)\|"
    r"(?P<signature_id>[^|]*)\|"
    r"(?P<name>[^|]*)\|"
    r"(?P<severity>[^|]*)\|"
    r"(?P<extensions>.*)"
)

# CEF extensions are key=value pairs separated by spaces
# Keys can contain letters, numbers, and underscores
# Values can contain anything until the next key=
_CEF_EXT = re.compile(r"(\w+)=((?:[^ ]| (?!\w+=))*)")


def parse_cef(raw_text: str) -> dict[str, Any]:
    """
    Parse a CEF log line into structured fields.
    Returns a flat dict of extracted fields.
    """
    text = raw_text.strip()
    result: dict[str, Any] = {"_parser": "cef"}

    m = _CEF_HEADER.match(text)
    if not m:
        result["message"] = text
        result["event_type"] = "unparsed_cef"
        return result

    result["cef_version"] = int(m.group("version"))
    result["vendor"] = m.group("vendor")
    result["product"] = m.group("product")
    result["device_version"] = m.group("device_version")
    result["signature_id"] = m.group("signature_id")
    result["name"] = m.group("name")

    # Parse severity — can be string or number
    sev_str = m.group("severity").strip()
    try:
        result["severity_num"] = int(sev_str)
    except ValueError:
        result["severity_str"] = sev_str
        # Map common string severities
        sev_map = {"low": 3, "medium": 5, "high": 7, "critical": 9, "very-high": 8}
        result["severity_num"] = sev_map.get(sev_str.lower(), 5)

    # Parse extensions
    extensions_str = m.group("extensions").strip()
    extensions: dict[str, str] = {}
    for ext_match in _CEF_EXT.finditer(extensions_str):
        key = ext_match.group(1)
        value = ext_match.group(2).strip()
        extensions[key] = value

    result["extensions"] = extensions

    # Promote well-known CEF extension keys to top-level
    well_known = {
        "src": "src_ip",
        "dst": "dst_ip",
        "spt": "src_port",
        "dpt": "dst_port",
        "act": "action",
        "cat": "category",
        "msg": "message",
        "rt": "timestamp",
        "suser": "src_user",
        "duser": "dst_user",
        "shost": "src_hostname",
        "dhost": "dst_hostname",
        "proto": "protocol",
        "cs1": "custom_string_1",
        "cs1Label": "custom_string_1_label",
        "cs2": "custom_string_2",
        "cs2Label": "custom_string_2_label",
        "deviceExternalId": "device_external_id",
        "suid": "src_user_id",
        "sdomain": "src_domain",
        "logonGuid": "logon_guid",
        "logonType": "logon_type",
    }

    for cef_key, normalized_key in well_known.items():
        if cef_key in extensions:
            val = extensions[cef_key]
            result[cef_key] = val
            # Try int conversion for ports
            if normalized_key in ("src_port", "dst_port"):
                try:
                    result[normalized_key] = int(val)
                except ValueError:
                    result[normalized_key] = val
            else:
                result[normalized_key] = val

    # Determine event type
    sig = result.get("signature_id", "")
    sig_lower = sig.lower()
    name_lower = result.get("name", "").lower()
    if "threat" in sig_lower or "threat" in name_lower:
        result["event_type"] = "security_finding"
    elif sig == "4624" or "logged on" in name_lower or "logon" in name_lower:
        result["event_type"] = "authentication_success"
    elif sig == "4625" or "logon failure" in name_lower:
        result["event_type"] = "authentication_failure"
    elif "url" in name_lower:
        result["event_type"] = "network_activity"
    else:
        result["event_type"] = "generic_cef"

    return result
