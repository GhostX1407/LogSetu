"""
LogSetu — Demo Data Seeder
Generates synthetic log batches from the 4 sample formats to pre-populate
the pipeline for a compelling live demo.
"""
from __future__ import annotations

import logging
import random

from app.config import SAMPLE_LOGS_DIR

logger = logging.getLogger("logsetu.seed")

# Extended sample templates for each format
SYSLOG_TEMPLATES = [
    '<34>1 2026-09-07T{h}:{m}:{s}.{ms}Z fw01.branch.local sshd {pid} ID47 - Failed password for invalid user {user} from {ip} port {port} ssh2',
    '<134>1 2026-09-07T{h}:{m}:{s}.{ms}Z fw01.branch.local kernel - - - IPTABLES-DENY: IN=eth0 OUT= SRC={ip} DST=10.0.0.5 PROTO=TCP SPT={port} DPT=22',
    '<14>1 2026-09-07T{h}:{m}:{s}.{ms}Z web-proxy-01 squid {pid} - - TCP_DENIED/403 {bytes} CONNECT {ip}:443 {user} HIER_NONE/- -',
    '<86>1 2026-09-07T{h}:{m}:{s}.{ms}Z dc01.corp.local sshd {pid} ID48 - Accepted publickey for {user} from {ip} port {port} ssh2',
]

CEF_TEMPLATES = [
    'CEF:0|PaloAltoNetworks|PAN-OS|10.1|THREAT|url|3|src={ip} dst=10.0.0.12 spt=443 dpt={port} act=deny cat=Suspicious-URL cs1=malware-c2 cs1Label=ThreatCategory',
    'CEF:0|Microsoft|WindowsSecurity|10|4624|Logon Success|1|src={ip} suser={user} sdomain=CORP.DOM logonType=10 shost=WKSTN-FIN-08 logonGuid={{1A2B3C4D-5E6F}}',
    'CEF:0|CrowdStrike|FalconHost|6.48|Detection|Suspicious Process|9|src={ip} act=detected msg=mimikatz.exe detected cs1=T1003 cs1Label=MitreTechnique',
    'CEF:0|CiscoSystems|ASA|9.16|106023|ACL Deny|5|src={ip} dst=10.0.{octet}.{octet} spt={port} dpt=443 act=deny proto=TCP',
]

JSON_TEMPLATES = [
    '{{"timestamp":"2026-09-07T{h}:{m}:{s}Z","source_ip":"{ip}","user":"{user}","event":"failed_login","service":"okta","result":"failure","reason":"invalid_credentials"}}',
    '{{"timestamp":"2026-09-07T{h}:{m}:{s}Z","source_ip":"{ip}","user":"{user}","event":"AssumeRole","service":"aws_iam","result":"success","reason":"SecurityAudit role assumed"}}',
    '{{"timestamp":"2026-09-07T{h}:{m}:{s}Z","source_ip":"{ip}","user":"{user}","event":"api_call","service":"kubernetes","result":"denied","reason":"RBAC authorization failed for exec in privileged pod"}}',
    '{{"timestamp":"2026-09-07T{h}:{m}:{s}Z","source_ip":"{ip}","user":"{user}","event":"file_access","service":"sharepoint","result":"success","reason":"Downloaded 14 financial documents"}}',
]

UNSEEN_TEMPLATES = [
    '||EVT||ts={dd}-09-2026_{h}:{m}:{s}||host=iot-gw-{gw}||sev=WARN||msg=unauthorized_probe||origin={ip}->10.0.{octet}.{octet}:{port}||',
    '||EVT||ts={dd}-09-2026_{h}:{m}:{s}||host=iot-gw-{gw}||sev=CRITICAL||msg=firmware_tamper_attempt||origin={ip}->10.0.{octet}.{octet}:{port}||',
    '||EVT||ts={dd}-09-2026_{h}:{m}:{s}||host=sensor-{gw}||sev=INFO||msg=heartbeat_ok||origin=10.0.{octet}.{octet}->10.0.0.1:{port}||',
]

ATTACKER_IPS = ["203.0.113.45", "198.51.100.42", "203.0.113.100"]
INTERNAL_IPS = ["10.0.0.5", "10.0.1.20", "192.168.10.144", "10.0.2.9"]
USERNAMES = ["admin", "tirth.patel", "svc_ledger", "root", "j.smith", "finance_bot"]


def _rand_params() -> dict:
    return {
        "h": f"{random.randint(0, 23):02d}",
        "m": f"{random.randint(0, 59):02d}",
        "s": f"{random.randint(0, 59):02d}",
        "ms": f"{random.randint(0, 999):03d}",
        "pid": str(random.randint(1000, 9999)),
        "port": str(random.randint(30000, 65535)),
        "bytes": str(random.randint(200, 50000)),
        "ip": random.choice(ATTACKER_IPS),
        "user": random.choice(USERNAMES),
        "octet": str(random.randint(1, 254)),
        "dd": f"{random.randint(5, 9):02d}",
        "gw": f"{random.randint(1, 8):02d}",
    }


def generate_synthetic_logs(count: int = 100) -> list[tuple[str, str]]:
    """
    Generate `count` synthetic log lines with varied formats.
    Returns list of (log_line, source_name) tuples.
    """
    all_templates = (
        [(t, "Syslog-FW01") for t in SYSLOG_TEMPLATES]
        + [(t, "PaloAlto-CEF") for t in CEF_TEMPLATES]
        + [(t, "JSON-CloudService") for t in JSON_TEMPLATES]
        + [(t, "IoT-PipeFormat") for t in UNSEEN_TEMPLATES]
    )

    results = []
    for _ in range(count):
        template, source = random.choice(all_templates)
        params = _rand_params()
        try:
            line = template.format(**params)
            results.append((line, source))
        except (KeyError, IndexError):
            pass

    return results


def load_sample_logs() -> list[tuple[str, str]]:
    """Load the original sample log files."""
    samples = []
    file_sources = {
        "syslog_sample.log": "SyslogSample",
        "cef_sample.log": "CEFSample",
        "json_sample.log": "JSONSample",
        "unseen_format_sample.log": "UnseenFormatSample",
    }

    for filename, source in file_sources.items():
        path = SAMPLE_LOGS_DIR / filename
        if path.exists():
            text = path.read_text(encoding="utf-8", errors="replace")
            for line in text.splitlines():
                line = line.strip()
                if line:
                    samples.append((line, source))

    return samples


def seed_pipeline(count: int = 80) -> int:
    """
    Seed the pipeline with sample + synthetic logs.
    Returns the number of events successfully ingested.
    """
    from app.pipeline import get_pipeline

    pipeline = get_pipeline()

    # First, ingest the real sample logs
    samples = load_sample_logs()
    for line, source in samples:
        try:
            pipeline.ingest(line, source=source)
        except (ValueError, KeyError, TypeError, RuntimeError) as e:
            logger.debug("Seed sample line error: %s", e)

    # Then generate synthetic data
    synthetic = generate_synthetic_logs(count)
    for line, source in synthetic:
        try:
            pipeline.ingest(line, source=source)
        except (ValueError, KeyError, TypeError, RuntimeError) as e:
            logger.debug("Seed synthetic line error: %s", e)

    return len(samples) + len(synthetic)
