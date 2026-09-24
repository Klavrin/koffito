"""Gives every matched group a café."""

from __future__ import annotations

import logging
from collections import Counter

from ..supabase import SupabaseRest

log = logging.getLogger(__name__)


async def run_venue_assignment(db: SupabaseRest) -> int:
    groups = await db.select(
        "groups",
        {"select": "id,event_id,events(event_at,default_venue_id)", "venue_id": "is.null"},
    )
    if not groups:
        return 0

    venues = await db.select("venues", {"select": "id,capacity", "is_active": "eq.true"})
    venue_ids = [venue["id"] for venue in venues or []]
    if not venue_ids:
        log.warning("no active venues; %d group(s) stay without a café", len(groups))
        return 0

    assigned = 0
    for group in groups:
        event = group.get("events") or {}
        venue_id = event.get("default_venue_id")
        if not venue_id:
            # Spread groups of the same event across cafés: least-used venue for that event first.
            taken = await db.select("groups", {"select": "venue_id", "event_id": f"eq.{group['event_id']}", "venue_id": "not.is.null"})
            load = Counter(row["venue_id"] for row in taken or [])
            venue_id = min(venue_ids, key=lambda vid: (load.get(vid, 0), venue_ids.index(vid)))
        await db.update("groups", {"venue_id": venue_id}, {"id": f"eq.{group['id']}"}, returning=False)
        assigned += 1
    return assigned
