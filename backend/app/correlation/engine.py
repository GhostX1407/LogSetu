"""
LogSetu — Correlation Engine
Links related events across sources by IP/user within a time window.
Tags correlated incidents with MITRE ATT&CK technique IDs.
"""
from __future__ import annotations

import threading
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from app.models.events import CorrelatedIncident, NormalizedEvent

# ── MITRE ATT&CK Lookup ─────────────────────────────────────────────────────
MITRE_RULES = [
    {
        "pattern": lambda events: any(
            e.activity_name == "Logon Failed" for e in events
        ) and sum(1 for e in events if e.activity_name == "Logon Failed") >= 2,
        "technique_id": "T1110",
        "technique_name": "Brute Force",
        "risk": 8.5,
    },
    {
        "pattern": lambda events: any(
            "mimikatz" in e.message.lower() or "credential" in e.message.lower()
            for e in events
        ),
        "technique_id": "T1003",
        "technique_name": "OS Credential Dumping",
        "risk": 9.5,
    },
    {
        "pattern": lambda events: any(
            e.ocsf_fields.get("logon_type") == "RemoteInteractive"
            for e in events
        ),
        "technique_id": "T1021.001",
        "technique_name": "Remote Services: RDP",
        "risk": 7.0,
    },
    {
        "pattern": lambda events: any(
            e.class_uid == 4001 and e.status == "Blocked"
            for e in events
        ),
        "technique_id": "T1071",
        "technique_name": "Application Layer Protocol",
        "risk": 6.5,
    },
    {
        "pattern": lambda events: any(
            "threat" in e.class_name.lower() or "security" in e.class_name.lower()
            for e in events
        ),
        "technique_id": "T1190",
        "technique_name": "Exploit Public-Facing Application",
        "risk": 8.0,
    },
]


class CorrelationEngine:
    """
    Correlates events by shared IP or user within a configurable time window.
    """

    def __init__(self, window_seconds: int = 300) -> None:
        self._lock = threading.Lock()
        self._window = timedelta(seconds=window_seconds)
        self._ip_index: dict[str, list[NormalizedEvent]] = defaultdict(list)
        self._user_index: dict[str, list[NormalizedEvent]] = defaultdict(list)
        self._incidents: list[CorrelatedIncident] = []

        # Seed demo incident
        self._seed_demo()

    def _seed_demo(self) -> None:
        """Pre-populate demo incident matching frontend's View 06."""
        demo = CorrelatedIncident(
            incident_id="demo-incident-001",
            linked_events=["evt-fw-block", "evt-ssh-fail-1", "evt-ssh-fail-2", "evt-okta-fail"],
            correlation_key="ip:203.0.113.45",
            correlation_type="ip",
            mitre_technique_id="T1110",
            mitre_technique_name="Brute Force",
            mitre_techniques=["T1110: Brute Force"],
            confidence=0.998,
            risk_score=9.8,
            sources=["Palo Alto Firewall", "SSH/Syslog", "Okta IAM"],
        )
        self._incidents.append(demo)

    def add_event(self, event: NormalizedEvent) -> list[CorrelatedIncident]:
        """
        Index an event and check for correlations.
        Returns any new incidents created.
        """
        new_incidents: list[CorrelatedIncident] = []

        with self._lock:
            # Extract IPs and users
            src_ip = event.ocsf_fields.get("src_endpoint.ip", "")
            dst_ip = event.ocsf_fields.get("dst_endpoint.ip", "")
            user = event.ocsf_fields.get("user.name", "")

            # Index by IP
            for ip in (src_ip, dst_ip):
                if ip:
                    self._ip_index[ip].append(event)
                    # Check for cross-source correlation
                    incident = self._check_correlation(ip, "ip", self._ip_index[ip])
                    if incident:
                        new_incidents.append(incident)

            # Index by user
            if user:
                self._user_index[user].append(event)
                incident = self._check_correlation(user, "user", self._user_index[user])
                if incident:
                    new_incidents.append(incident)

        return new_incidents

    def _check_correlation(self, key: str, corr_type: str,
                           events: list[NormalizedEvent]) -> CorrelatedIncident | None:
        """Check if events from different sources share a key within the time window."""
        if len(events) < 2:
            return None

        # Get unique sources within window
        now = datetime.now(timezone.utc)
        recent = [e for e in events if (now - e.timestamp) < self._window]
        sources = {e.source_name for e in recent if e.source_name}

        if len(sources) < 2:
            return None

        # Check if we already have this correlation
        corr_key = f"{corr_type}:{key}"
        for existing in self._incidents:
            if existing.correlation_key == corr_key:
                # Update existing incident
                new_ids = [e.event_id for e in recent]
                existing.linked_events = list(set(existing.linked_events + new_ids))
                existing.sources = list(sources)
                return None

        # Apply MITRE rules
        technique_id = ""
        technique_name = ""
        risk_score = 5.0

        for rule in MITRE_RULES:
            try:
                if rule["pattern"](recent):
                    technique_id = rule["technique_id"]
                    technique_name = rule["technique_name"]
                    risk_score = max(risk_score, rule["risk"])
                    break
            except (KeyError, TypeError, ValueError, AttributeError):
                continue

        confidence = min(0.99, 0.7 + (len(recent) * 0.05))

        tech_list = [f"{technique_id}: {technique_name}"] if technique_id else []
        incident = CorrelatedIncident(
            linked_events=[e.event_id for e in recent],
            correlation_key=corr_key,
            correlation_type=corr_type,
            mitre_technique_id=technique_id,
            mitre_technique_name=technique_name,
            mitre_techniques=tech_list,
            confidence=round(confidence, 3),
            risk_score=risk_score,
            sources=list(sources),
        )
        self._incidents.append(incident)
        return incident

    def get_incidents(self) -> list[CorrelatedIncident]:
        with self._lock:
            return list(self._incidents)

    def get_incident(self, incident_id: str) -> CorrelatedIncident | None:
        with self._lock:
            for inc in self._incidents:
                if inc.incident_id == incident_id:
                    return inc
            return None


# ── Singleton ────────────────────────────────────────────────────────────────
_engine: CorrelationEngine | None = None


def get_correlation_engine() -> CorrelationEngine:
    global _engine
    if _engine is None:
        _engine = CorrelationEngine()
    return _engine
