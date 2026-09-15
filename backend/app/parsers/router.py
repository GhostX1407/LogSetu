"""
LogSetu — Parser Router
Central hub: detect format → select parser → return parsed dict.
"""
from __future__ import annotations

from typing import Any

from app.models.events import LogFormat
from app.parsers.cef_parser import parse_cef
from app.parsers.detector import detect_format
from app.parsers.json_parser import parse_json_log
from app.parsers.syslog_parser import parse_syslog


def parse_log(raw_text: str) -> tuple[LogFormat, dict[str, Any]]:
    """
    Detect format and parse a raw log line.
    Returns (detected_format, parsed_fields_dict).
    """
    fmt = detect_format(raw_text)

    if fmt == LogFormat.JSON:
        return fmt, parse_json_log(raw_text)

    if fmt == LogFormat.CEF:
        return fmt, parse_cef(raw_text)

    if fmt == LogFormat.SYSLOG:
        return fmt, parse_syslog(raw_text)

    # XML, LEEF, or UNKNOWN — basic key-value fallback
    return fmt, _parse_fallback(raw_text)


def _parse_fallback(raw_text: str) -> dict[str, Any]:
    """
    Fallback parser: try to extract key=value pairs from unknown formats.
    Also handles pipe-delimited formats like our unseen_format_sample.log.
    """
    import re
    text = raw_text.strip()
    result: dict[str, Any] = {"_parser": "fallback", "event_type": "unknown"}

    # Try pipe-delimited: ||KEY||key=value||key=value||
    if "||" in text:
        segments = [s.strip() for s in text.split("||") if s.strip()]
        for seg in segments:
            if "=" in seg:
                key, _, value = seg.partition("=")
                result[key.strip().lower()] = value.strip()
            elif not result.get("format_marker"):
                result["format_marker"] = seg

        # Normalize well-known fields from pipe-delimited
        if "host" in result:
            result["hostname"] = result["host"]
        if "sev" in result:
            result["severity_str"] = result["sev"]
        if "msg" in result:
            result["message"] = result["msg"]
            result["event_type"] = result["msg"]
        if "origin" in result:
            # Parse "IP->IP:PORT" pattern
            origin = result["origin"]
            arrow_match = re.match(r"([\d.]+)->([\d.]+):(\d+)", origin)
            if arrow_match:
                result["src_ip"] = arrow_match.group(1)
                result["dst_ip"] = arrow_match.group(2)
                result["dst_port"] = int(arrow_match.group(3))
        if "ts" in result:
            result["timestamp"] = result["ts"]

        return result

    # Generic key=value extraction
    kv_pattern = re.compile(r"(\w+)\s*=\s*(?:\"([^\"]*)\"|(\S+))")
    for match in kv_pattern.finditer(text):
        key = match.group(1).lower()
        value = match.group(2) if match.group(2) is not None else match.group(3)
        result[key] = value

    if len(result) <= 2:  # Only _parser and event_type
        result["message"] = text

    return result
