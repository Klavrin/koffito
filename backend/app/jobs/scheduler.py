"""System jobs: run with the service role key, never with a user token."""

from __future__ import annotations

import logging

import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from ..config import Settings
from ..supabase import service_client
from .matchmaking import run_matchmaking
from .notifier import LoggingNotifier, Notifier
from .reminders import run_completion, run_reminders
from .venues import run_venue_assignment

log = logging.getLogger(__name__)


def build_scheduler(http: httpx.AsyncClient, settings: Settings, notifier: Notifier | None = None) -> AsyncIOScheduler:
    notifier = notifier or LoggingNotifier()
    scheduler = AsyncIOScheduler(timezone="UTC")

    async def matchmaking() -> None:
        await _guard("matchmaking", run_matchmaking(service_client(http, settings), settings))

    async def venues() -> None:
        await _guard("venue assignment", run_venue_assignment(service_client(http, settings)))

    async def reminders() -> None:
        await _guard("reminders", run_reminders(service_client(http, settings), notifier))

    async def completion() -> None:
        await _guard("completion", run_completion(service_client(http, settings)))

    scheduler.add_job(matchmaking, "interval", minutes=10, id="matchmaking", max_instances=1, coalesce=True)
    scheduler.add_job(venues, "interval", minutes=10, id="venues", max_instances=1, coalesce=True)
    scheduler.add_job(reminders, "interval", minutes=5, id="reminders", max_instances=1, coalesce=True)
    scheduler.add_job(completion, "interval", minutes=15, id="completion", max_instances=1, coalesce=True)
    return scheduler


async def _guard(name: str, coroutine) -> None:  # type: ignore[no-untyped-def]
    try:
        result = await coroutine
        log.debug("%s finished: %s", name, result)
    except Exception:  # noqa: BLE001 - a failing job must not kill the scheduler
        log.exception("%s failed", name)
