"""
LogSetu — Cascading Format Detector
Detects the format of a raw log line by trying parsers in order:
JSON → XML → CEF → LEEF → Syslog RFC5424/3164 → Unknown
"""
from __future__ import annotations

import json
import re

from app.models.events import LogFormat

# Precompiled patterns
_CEF_PREFIX = re.compile(r"^CEF:\d+\|")
_LEEF_PREFIX = re.compile(r"^LEEF:\d+\.\d+\|")
_SYSLOG_5424 = re.compile(r"^<\d{1,3}>\d\s+\d{4}-\d{2}-\d{2}T")
_SYSLOG_3164 = re.compile(r"^<\d{1,3}>(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s")


def detect_format(raw_text: str) -> LogFormat:
    """
    Detect the log format of a raw text string.
    Returns a LogFormat enum value.
    """
    text = raw_text.strip()
    if not text:
        return LogFormat.UNKNOWN

    # 1. JSON — try parse
    if text.startswith(("{", "[")):
        try:
            json.loads(text)
            return LogFormat.JSON
        except (json.JSONDecodeError, ValueError):
            pass

    # 2. XML — starts with <? or < followed by alpha
    is_xml_prefix = text.startswith("<?xml") or (text.startswith("<") and text.startswith("<") != text.startswith("</"))
    if is_xml_prefix and re.search(r"<\w+[\s>].*</\w+>", text, re.DOTALL):
        return LogFormat.XML

    # 3. CEF — starts with "CEF:N|"
    if _CEF_PREFIX.match(text):
        return LogFormat.CEF

    # 4. LEEF — starts with "LEEF:N.N|"
    if _LEEF_PREFIX.match(text):
        return LogFormat.LEEF

    # 5. Syslog RFC 5424 — "<PRI>VERSION TIMESTAMP"
    if _SYSLOG_5424.match(text):
        return LogFormat.SYSLOG

    # 6. Syslog RFC 3164 — "<PRI>MONTH"
    if _SYSLOG_3164.match(text):
        return LogFormat.SYSLOG

    # 7. Fallback
    return LogFormat.UNKNOWN
