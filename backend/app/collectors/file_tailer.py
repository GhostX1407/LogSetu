"""
LogSetu — File Tailer Collector
Follows / ingests a local log file line by line into the pipeline.
"""
from __future__ import annotations

import asyncio
from pathlib import Path

from app.pipeline import get_pipeline


class FileTailerCollector:
    def __init__(self, filepath: str | Path, source_name: str = "") -> None:
        self.filepath = Path(filepath)
        self.source_name = source_name or self.filepath.name
        self.pipeline = get_pipeline()
        self._running = False
        self._task: asyncio.Task | None = None

    def _read_lines(self) -> list[str]:
        if not self.filepath.exists():
            return []
        with open(self.filepath, "r", encoding="utf-8", errors="replace") as file_handle:
            return [line.strip() for line in file_handle if line.strip()]

    async def ingest_entire_file(self) -> int:
        """Read all lines currently in file and ingest."""
        lines = await asyncio.to_thread(self._read_lines)
        if lines:
            self.pipeline.ingest_batch(lines, source=self.source_name)
        return len(lines)
