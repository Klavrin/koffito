from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status

from ..deps import CurrentUserDep, UserDb
from ..ratelimit import limiter
from ..schemas import GENDER_FROM_DB
from ..supabase import SupabaseError

router = APIRouter(prefix="/people", tags=["people"])


@router.get("/{user_id}")
@limiter.limit("60/minute")
async def get_person(request: Request, user_id: UUID, user: CurrentUserDep, db: UserDb) -> dict[str, Any]:
    try:
        raw = await db.rpc("get_public_profile", {"p_user_id": str(user_id)})
    except SupabaseError as exc:
        raise exc.to_http() from exc
    if not raw:
        # Either unknown, or not someone the caller has shared a revealed group with.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="We couldn't find this person.")
    stats = raw.get("stats") or {}
    return {
        "id": raw.get("id"),
        "name": raw.get("name") or "",
        "avatar": raw.get("emoji"),
        "gender": GENDER_FROM_DB.get(raw.get("gender") or "", None),
        "age": raw.get("age"),
        "occupation": raw.get("occupation"),
        "favoriteCoffee": raw.get("favoriteCoffee"),
        "languages": raw.get("languages") or [],
        "survey": raw.get("survey") or {},
        "stats": {
            "coffeeTalks": int(stats.get("coffeeTalks") or 0),
            "cafesVisited": int(stats.get("cafesVisited") or 0),
            "peopleMet": int(stats.get("peopleMet") or 0),
        },
    }
