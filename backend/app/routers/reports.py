from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Request, status

from ..deps import CurrentUserDep, UserDb
from ..ratelimit import limiter
from ..schemas import ReportCreate
from ..supabase import SupabaseError

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def create_report(request: Request, body: ReportCreate, user: CurrentUserDep, db: UserDb) -> dict[str, Any]:
    row = {
        "reporter_id": user.id,  # from the token, never from the body
        "reported_user_id": str(body.reportedUserId) if body.reportedUserId else None,
        "event_id": str(body.eventId) if body.eventId else None,
        "reason": body.reason,
        "details": body.details,
    }
    try:
        created = await db.insert("reports", row)
    except SupabaseError as exc:
        raise exc.to_http() from exc
    record = created[0] if isinstance(created, list) and created else {}
    return {"id": record.get("id"), "status": record.get("status", "open")}
