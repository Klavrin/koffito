from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status

from ..deps import CurrentUserDep, UserDb
from ..ratelimit import limiter
from ..schemas import AttendanceRequest, ConfirmRequest, RatingRequest
from ..supabase import SupabaseError

router = APIRouter(prefix="/events", tags=["events"])


def shape_my_event(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "eventAt": row["event_at"],
        "revealAt": row["reveal_at"],
        "status": row["status"],
        "participantStatus": row.get("participant_status"),
        "joined": bool(row.get("joined")),
        "blind": bool(row.get("blind")),
        "locationHidden": bool(row.get("location_hidden")),
        "revealOpened": bool(row.get("reveal_opened")),
        "maxParticipants": int(row.get("max_participants") or 0),
        "spotsLeft": None,
        "cafe": row.get("cafe"),
        "participants": row.get("participants") or [],
        "attended": row.get("attended"),
        "attendanceNote": row.get("attendance_note"),
        "myRating": row.get("my_rating"),
        "myComment": row.get("my_comment"),
    }


def shape_open_event(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "eventAt": row["event_at"],
        "revealAt": None,
        "status": "pending",
        "participantStatus": None,
        "joined": bool(row.get("joined")),
        "blind": True,
        "locationHidden": True,
        "revealOpened": False,
        "maxParticipants": int(row.get("max_participants") or 0),
        "spotsLeft": int(row.get("spots_left") or 0),
        "cafe": None,
        "participants": [],
        "attended": None,
        "attendanceNote": None,
        "myRating": None,
        "myComment": None,
    }


async def _my_events(db: UserDb) -> list[dict[str, Any]]:
    rows = await db.rpc("get_my_events")
    return [shape_my_event(row) for row in rows or []]


async def _open_events(db: UserDb) -> list[dict[str, Any]]:
    rows = await db.rpc("get_open_events")
    return [shape_open_event(row) for row in rows or []]


@router.get("")
@limiter.limit("60/minute")
async def list_my_events(request: Request, user: CurrentUserDep, db: UserDb) -> list[dict[str, Any]]:
    try:
        return await _my_events(db)
    except SupabaseError as exc:
        raise exc.to_http() from exc


@router.get("/open")
@limiter.limit("60/minute")
async def list_open_events(request: Request, user: CurrentUserDep, db: UserDb) -> list[dict[str, Any]]:
    try:
        return await _open_events(db)
    except SupabaseError as exc:
        raise exc.to_http() from exc


@router.get("/{event_id}")
@limiter.limit("60/minute")
async def get_event(request: Request, event_id: UUID, user: CurrentUserDep, db: UserDb) -> dict[str, Any]:
    wanted = str(event_id)
    try:
        for event in await _my_events(db):
            if event["id"] == wanted:
                return event
        for event in await _open_events(db):
            if event["id"] == wanted:
                return event
    except SupabaseError as exc:
        raise exc.to_http() from exc
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="We lost this coffee talk.")


async def _rpc_then_event(db: UserDb, name: str, params: dict[str, Any], event_id: UUID, request: Request, user: CurrentUserDep) -> dict[str, Any]:
    try:
        await db.rpc(name, params)
    except SupabaseError as exc:
        raise exc.to_http() from exc
    return await get_event(request, event_id, user, db)


@router.post("/{event_id}/join")
@limiter.limit("20/minute")
async def join_event(request: Request, event_id: UUID, user: CurrentUserDep, db: UserDb) -> dict[str, Any]:
    return await _rpc_then_event(db, "join_event", {"p_event_id": str(event_id)}, event_id, request, user)


@router.post("/{event_id}/leave")
@limiter.limit("20/minute")
async def leave_event(request: Request, event_id: UUID, user: CurrentUserDep, db: UserDb) -> dict[str, Any]:
    return await _rpc_then_event(db, "leave_event", {"p_event_id": str(event_id)}, event_id, request, user)


@router.post("/{event_id}/confirm")
@limiter.limit("20/minute")
async def confirm_event(request: Request, event_id: UUID, body: ConfirmRequest, user: CurrentUserDep, db: UserDb) -> dict[str, Any]:
    return await _rpc_then_event(
        db, "confirm_event", {"p_event_id": str(event_id), "p_stage": body.stage}, event_id, request, user
    )


@router.post("/{event_id}/reveal")
@limiter.limit("20/minute")
async def open_reveal(request: Request, event_id: UUID, user: CurrentUserDep, db: UserDb) -> dict[str, Any]:
    return await _rpc_then_event(db, "open_reveal", {"p_event_id": str(event_id)}, event_id, request, user)


@router.post("/{event_id}/attendance")
@limiter.limit("20/minute")
async def report_attendance(request: Request, event_id: UUID, body: AttendanceRequest, user: CurrentUserDep, db: UserDb) -> dict[str, Any]:
    return await _rpc_then_event(
        db,
        "report_attendance",
        {"p_event_id": str(event_id), "p_happened": body.happened, "p_note": body.note},
        event_id,
        request,
        user,
    )


@router.put("/{event_id}/rating")
@limiter.limit("20/minute")
async def rate_event(request: Request, event_id: UUID, body: RatingRequest, user: CurrentUserDep, db: UserDb) -> dict[str, Any]:
    try:
        # user_id is the verified token subject; RLS (`attended_event`) decides if a rating is allowed.
        await db.upsert(
            "event_ratings",
            {"event_id": str(event_id), "user_id": user.id, "rating": body.rating, "comment": body.comment},
            on_conflict="event_id,user_id",
            returning=False,
        )
    except SupabaseError as exc:
        raise exc.to_http() from exc
    return await get_event(request, event_id, user, db)
