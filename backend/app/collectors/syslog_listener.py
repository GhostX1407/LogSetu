"""
LogSetu — Syslog UDP Collector
Listens on UDP (default 5140 for unprivileged dev) and pushes received raw datagrams
directly into the pipeline without pre-processing.
"""
from __future__ import annotations

import asyncio
import logging

from app.pipeline import get_pipeline

logger = logging.getLogger("logsetu.collectors.syslog")


class SyslogUDPProtocol(asyncio.DatagramProtocol):
    def __init__(self) -> None:
        super().__init__()
        self.pipeline = get_pipeline()

    def connection_made(self, transport: asyncio.DatagramTransport) -> None:
        self.transport = transport

    def datagram_received(self, data: bytes, addr: tuple[str, int]) -> None:
        try:
            raw_text = data.decode("utf-8", errors="replace").strip()
            if raw_text:
                self.pipeline.ingest(raw_text, source=f"udp://{addr[0]}:{addr[1]}")
        except (UnicodeDecodeError, ValueError, RuntimeError) as e:
            logger.warning(f"Error handling syslog datagram from {addr}: {e}")


class SyslogCollector:
    def __init__(self, host: str = "0.0.0.0", port: int = 5140) -> None:
        self.host = host
        self.port = port
        self.transport: asyncio.DatagramTransport | None = None

    async def start(self) -> None:
        loop = asyncio.get_running_loop()
        self.transport, _ = await loop.create_datagram_endpoint(
            lambda: SyslogUDPProtocol(),
            local_addr=(self.host, self.port),
        )
        logger.info(f"Syslog UDP listener active on {self.host}:{self.port}")

    def stop(self) -> None:
        if self.transport:
            self.transport.close()
            self.transport = None
            logger.info("Syslog UDP listener stopped.")
