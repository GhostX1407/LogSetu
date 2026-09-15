"""
LogSetu — Alerting Engine
Webhook dispatch and alert history management.
"""
from __future__ import annotations

import logging
import threading
from datetime import datetime, timezone

import httpx

from app.config import WEBHOOK_URL

logger = logging.getLogger("logsetu.alerting")


class AlertingEngine:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._alerts: list[dict] = []

    def dispatch(self, summary: str, severity: str, source: str) -> dict:
        alert = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "summary": summary,
            "severity": severity,
            "source": source,
        }
        with self._lock:
            self._alerts.append(alert)
            if len(self._alerts) > 500:
                self._alerts = self._alerts[-250:]

        if WEBHOOK_URL:
            try:
                httpx.post(WEBHOOK_URL, json=alert, timeout=3)
            except (httpx.HTTPError, OSError, ValueError) as e:
                logger.warning(f"Webhook dispatch failed: {e}")
        else:
            logger.info(f"[ALERT] {severity.upper()}: {summary} ({source})")

        return alert

    def get_recent(self, count: int = 20) -> list[dict]:
        with self._lock:
            return list(reversed(self._alerts[-count:]))


_engine: AlertingEngine | None = None


def get_alerting_engine() -> AlertingEngine:
    global _engine
    if _engine is None:
        _engine = AlertingEngine()
    return _engine
