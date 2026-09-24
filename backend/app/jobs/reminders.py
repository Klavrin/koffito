"""24h and 3h confirmation reminders."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from ..supabase import SupabaseRest
from .notifier import Notifier

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class Stage:
    name: str
    hours: int
    pending_statuses: tuple[str, ...]
    marker_column: str
    title: str
    body: str


STAGES = (
    Stage(
        "24h", 24, ("joined", "matched"), "reminded_24h_at",
        "Coffee talk tomorrow ☕", "Confirm you're still coming so your group can count on you.",
    ),
    Stage(
        "3h", 3, ("joined", "matched", "confirmed_24h"), "reminded_3h_at",
        "Coffee talk in 3 hours", "Last call: tap to confirm and see who's coming.",
    ),
)


def _iso(moment: datetime) -> str:
    return moment.astimezone(timezone.utc).isoformat()


async def run_reminders(db: SupabaseRest, notifier: Notifier, now: datetime | None = None) -> int:
    now = now or datetime.now(timezone.utc)
    sent = 0
    for stage in STAGES:
        sent += await _run_stage(db, notifier, stage, now)
    return sent


async def _run_stage(db: SupabaseRest, notifier: Notifier, stage: Stage, now: datetime) -> int:
    events = await db.select(
        "events",
        {
            "select": "id,event_at,title",
            "status": "in.(open,matched,confirmed)",
            "and": f"(event_at.gt.{_iso(now)},event_at.lte.{_iso(now + timedelta(hours=stage.hours))})",
        },
    )
    if not events:
        return 0
    by_event = {event["id"]: event for event in events}

    participants = await db.select(
        "event_participants",
        {
            "select": "id,user_id,event_id,status",
            "event_id": "in.(" + ",".join(by_event) + ")",
            "status": "in.(" + ",".join(stage.pending_statuses) + ")",
            stage.marker_column: "is.null",
        },
    )
    if not participants:
        return 0

    user_ids = sorted({row["user_id"] for row in participants})
    settings_rows = await db.select(
        "user_settings", {"select": "user_id,reminders_enabled", "user_id": "in.(" + ",".join(user_ids) + ")"}
    )
    wants_reminders = {row["user_id"]: bool(row.get("reminders_enabled", True)) for row in settings_rows or []}

    sent = 0
    for row in participants:
        if wants_reminders.get(row["user_id"], True):
            event = by_event[row["event_id"]]
            await notifier.send(
                row["user_id"],
                stage.title,
                stage.body,
                {"eventId": event["id"], "eventAt": event["event_at"], "stage": stage.name},
            )
            sent += 1
    # Mark everyone (opted-out users included) so the stage never repeats.
    await db.update(
        "event_participants",
        {stage.marker_column: _iso(now)},
        {"id": "in.(" + ",".join(row["id"] for row in participants) + ")"},
        returning=False,
    )
    log.info("%s reminders: %d sent", stage.name, sent)
    return sent


async def run_completion(db: SupabaseRest, now: datetime | None = None, grace_hours: int = 3) -> int:
    """Marks coffee talks as completed once they are safely in the past."""
    now = now or datetime.now(timezone.utc)
    updated = await db.update(
        "events",
        {"status": "completed"},
        {"status": "in.(open,matched,confirmed)", "event_at": f"lt.{_iso(now - timedelta(hours=grace_hours))}"},
    )
    return len(updated or [])
