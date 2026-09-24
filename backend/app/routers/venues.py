from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Request

from ..deps import CurrentUserDep, UserDb
from ..ratelimit import limiter
from ..supabase import SupabaseError

router = APIRouter(prefix="/venues", tags=["venues"])


@router.get("/visited")
@limiter.limit("60/minute")
async def visited_venues(request: Request, user: CurrentUserDep, db: UserDb) -> list[dict[str, Any]]:
    try:
        rows = await db.rpc("get_my_visited_venues")
    except SupabaseError as exc:
        raise exc.to_http() from exc
    return [row for row in rows or [] if row]
