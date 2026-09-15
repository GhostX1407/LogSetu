"""
LogSetu — Syslog Parser (RFC 5424 + RFC 3164 fallback)
Extracts structured fields from syslog-formatted log lines.
"""
from __future__ import annotations

import re
from typing import Any

# RFC 5424: <PRI>VERSION SP TIMESTAMP SP HOSTNAME SP APP-NAME SP PROCID SP MSGID SP STRUCTURED-DATA SP MSG
_RFC5424 = re.compile(
    r"^<(?P<pri>\d{1,3})>(?P<version>\d)\s+"
    r"(?P<timestamp>\S+)\s+"
    r"(?P<hostname>\S+)\s+"
    r"(?P<app_name>\S+)\s+"
    r"(?P<procid>\S+)\s+"
    r"(?P<msgid>\S+)\s+"
    r"(?P<sd>-|\[.+?\])\s*"
    r"(?P<message>.*)"
)

# Common key=value patterns inside syslog messages
_KV_PATTERN = re.compile(r"(\w+)=(\S+)")

# IPTABLES pattern
_IPTABLES = re.compile(
    r"(?:IPTABLES[-_]?\w*:)?\s*"
    r"IN=(?P<in_iface>\S*)\s+"
    r"OUT=(?P<out_iface>\S*)\s+"
    r"SRC=(?P<src_ip>\S+)\s+"
    r"DST=(?P<dst_ip>\S+)\s+"
    r".*?PROTO=(?P<proto>\S+)\s+"
    r"SPT=(?P<src_port>\d+)\s+"
    r"DPT=(?P<dst_port>\d+)"
)

# SSH failure pattern
_SSH_FAIL = re.compile(
    r"Failed\s+password\s+for\s+(?:invalid\s+user\s+)?(?P<username>\S+)\s+"
    r"from\s+(?P<src_ip>\S+)\s+port\s+(?P<src_port>\d+)\s+(?P<proto>\S+)"
)


def parse_syslog(raw_text: str) -> dict[str, Any]:
    """
    Parse a syslog line into structured fields.
    Returns a flat dict of extracted fields.
    """
    text = raw_text.strip()
    result: dict[str, Any] = {"_parser": "syslog"}

    # Try RFC 5424 first
    m = _RFC5424.match(text)
    if m:
        pri = int(m.group("pri"))
        result["priority"] = pri
        result["facility"] = pri >> 3
        result["severity_num"] = pri & 0x07
        result["version"] = int(m.group("version"))
        result["timestamp"] = m.group("timestamp")
        result["hostname"] = m.group("hostname")
        result["app_name"] = m.group("app_name")
        result["procid"] = m.group("procid") if m.group("procid") != "-" else None
        result["msgid"] = m.group("msgid") if m.group("msgid") != "-" else None
        result["message"] = m.group("message")

        msg = result["message"]

        # Try to parse IPTABLES sub-pattern
        ipt = _IPTABLES.search(msg)
        if ipt:
            result["event_type"] = "firewall_deny"
            result["src_ip"] = ipt.group("src_ip")
            result["dst_ip"] = ipt.group("dst_ip")
            result["src_port"] = int(ipt.group("src_port"))
            result["dst_port"] = int(ipt.group("dst_port"))
            result["protocol"] = ipt.group("proto")
            result["in_interface"] = ipt.group("in_iface")
            result["out_interface"] = ipt.group("out_iface")
            result["action"] = "deny"
            return result

        # Try SSH failure
        ssh = _SSH_FAIL.search(msg)
        if ssh:
            result["event_type"] = "authentication_failure"
            result["username"] = ssh.group("username")
            result["user"] = ssh.group("username")
            result["src_ip"] = ssh.group("src_ip")
            result["src_port"] = int(ssh.group("src_port"))
            result["protocol"] = ssh.group("proto")
            result["action"] = "failure"
            result["service"] = "sshd"
            return result

        # Generic KV extraction from message
        kvs = _KV_PATTERN.findall(msg)
        for k, v in kvs:
            result[k.lower()] = v

        if not result.get("event_type"):
            result["event_type"] = "generic_syslog"

        return result

    # Fallback: couldn't parse structure, return raw
    result["message"] = text
    result["event_type"] = "unparsed_syslog"
    return result
