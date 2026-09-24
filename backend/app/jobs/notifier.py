"""Where reminders go. The default only logs; plug push / email in here."""

from __future__ import annotations

import logging
from typing import Any, Protocol

log = logging.getLogger(__name__)


class Notifier(Protocol):
    async def send(self, user_id: str, title: str, body: str, data: dict[str, Any] | None = None) -> None: ...


class LoggingNotifier:
    async def send(self, user_id: str, title: str, body: str, data: dict[str, Any] | None = None) -> None:
        log.info("notify %s: %s - %s %s", user_id, title, body, data or {})
