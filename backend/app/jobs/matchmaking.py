"""Groups the people who joined a coffee talk, shortly before the café is revealed."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from statistics import mean

from ..config import Settings
from ..supabase import SupabaseRest
from .embeddings import EMBEDDING_VERSION, cosine_distance, parse_vector, survey_embedding

log = logging.getLogger(__name__)

MAX_GROUP_SIZE = 8


@dataclass
class Member:
    user_id: str
    embedding: list[float]
    languages: frozenset[str] = field(default_factory=frozenset)
    joined_at: str = ""


@dataclass
class Group:
    members: list[Member]

    @property
    def languages(self) -> frozenset[str] | None:
        """Languages every member with a known language shares; None = no constraint yet."""
        common: frozenset[str] | None = None
        for member in self.members:
            if not member.languages:
                continue
            common = member.languages if common is None else common & member.languages
        return common

    def accepts(self, candidate: Member) -> bool:
        if not candidate.languages:
            return True
        common = self.languages
        return common is None or bool(common & candidate.languages)

    def distance_to(self, candidate: Member) -> float:
        return mean(cosine_distance(member.embedding, candidate.embedding) for member in self.members)

    def avg_distance(self) -> float | None:
        pairs = [
            cosine_distance(a.embedding, b.embedding)
            for i, a in enumerate(self.members)
            for b in self.members[i + 1 :]
        ]
        return mean(pairs) if pairs else None


def build_groups(members: list[Member], size: int) -> list[Group]:
    """Greedy nearest-neighbour grouping; leftovers join the closest group with room."""
    size = max(2, min(size, MAX_GROUP_SIZE))
    remaining = sorted(members, key=lambda m: m.joined_at)
    groups: list[Group] = []

    while remaining:
        group = Group([remaining.pop(0)])
        while len(group.members) < size and remaining:
            candidates = [m for m in remaining if group.accepts(m)]
            if not candidates:
                break
            best = min(candidates, key=group.distance_to)
            group.members.append(best)
            remaining.remove(best)
        groups.append(group)

    # A group of one is not a coffee talk: fold it into the closest group that has room.
    for lonely in [g for g in groups if len(g.members) == 1]:
        member = lonely.members[0]
        homes = [g for g in groups if g is not lonely and len(g.members) < MAX_GROUP_SIZE and g.accepts(member)]
        if homes:
            min(homes, key=lambda g: g.distance_to(member)).members.append(member)
            groups.remove(lonely)

    return [g for g in groups if len(g.members) >= 2]


def _iso(moment: datetime) -> str:
    return moment.astimezone(timezone.utc).isoformat()


def _in_list(values: list[str]) -> str:
    return "in.(" + ",".join(values) + ")"


async def run_matchmaking(db: SupabaseRest, settings: Settings, now: datetime | None = None) -> int:
    now = now or datetime.now(timezone.utc)
    horizon = now + timedelta(hours=settings.match_lead_hours)
    events = await db.select(
        "events",
        {
            "select": "id,event_at,target_group_size",
            "status": "eq.open",
            "and": f"(event_at.gt.{_iso(now)},event_at.lte.{_iso(horizon)})",
        },
    )
    matched_events = 0
    for event in events or []:
        if await _match_event(db, event):
            matched_events += 1
    return matched_events


async def _match_event(db: SupabaseRest, event: dict) -> bool:
    event_id = event["id"]
    participants = await db.select(
        "event_participants",
        {
            "select": "user_id,joined_at",
            "event_id": f"eq.{event_id}",
            "status": "eq.joined",
            "group_id": "is.null",
            "order": "joined_at.asc",
        },
    )
    user_ids = [row["user_id"] for row in participants or []]
    if len(user_ids) < 2:
        log.info("event %s: %d participant(s), nothing to match yet", event_id, len(user_ids))
        return False

    surveys = await db.select(
        "surveys",
        {"select": "user_id,survey_data,embedding,embedding_version", "user_id": _in_list(user_ids)},
    )
    embeddings: dict[str, list[float]] = {}
    for survey in surveys or []:
        vector = parse_vector(survey.get("embedding"))
        if vector is None or survey.get("embedding_version") != EMBEDDING_VERSION:
            vector = survey_embedding(survey.get("survey_data") or {})
            await db.update(
                "surveys",
                {"embedding": vector, "embedding_version": EMBEDDING_VERSION},
                {"user_id": f"eq.{survey['user_id']}"},
                returning=False,
            )
        embeddings[survey["user_id"]] = vector

    languages: dict[str, set[str]] = {}
    for row in await db.select("profile_languages", {"select": "user_id,language", "user_id": _in_list(user_ids)}) or []:
        languages.setdefault(row["user_id"], set()).add(row["language"])

    members = [
        Member(
            user_id=row["user_id"],
            embedding=embeddings.get(row["user_id"], survey_embedding({})),
            languages=frozenset(languages.get(row["user_id"], set())),
            joined_at=row.get("joined_at") or "",
        )
        for row in participants
    ]
    groups = build_groups(members, int(event.get("target_group_size") or 4))
    if not groups:
        return False

    for group in groups:
        created = await db.insert("groups", {"event_id": event_id, "avg_distance": group.avg_distance()})
        group_id = created[0]["id"]
        await db.update(
            "event_participants",
            {"group_id": group_id, "status": "matched"},
            {"event_id": f"eq.{event_id}", "user_id": _in_list([m.user_id for m in group.members])},
            returning=False,
        )
    await db.update("events", {"status": "matched"}, {"id": f"eq.{event_id}"}, returning=False)
    log.info("event %s: %d group(s) formed", event_id, len(groups))
    return True
