from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status

from ..deps import AdminUser, UserDb
from ..ratelimit import limiter
from ..schemas import EventCreate, ReportStatusUpdate
from ..supabase import SupabaseError

router = APIRouter(prefix="/admin", tags=["admin"])

REASON_LABELS = {
    "no-show": "Didn't show up",
    "rude": "Rude or disrespectful",
    "unsafe": "Made me feel unsafe",
    "fake": "Fake profile",
    "other": "Something else",
}


def shape_report(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row["id"],
        "reason": row["reason"],
        "reasonLabel": REASON_LABELS.get(row["reason"], row["reason"]),
        "details": row["details"],
        "status": row["status"],
        "reportedBy": row.get("reported_by") or "Someone",
        "reportedUserName": row.get("reported_user_name"),
        "eventId": row.get("event_id"),
        "createdAt": row["created_at"],
        "updatedAt": row.get("updated_at"),
    }


@router.get("/reports")
@limiter.limit("60/minute")
async def list_reports(request: Request, admin: AdminUser, db: UserDb) -> list[dict[str, Any]]:
    try:
        rows = await db.select("admin_reports", {"select": "*", "order": "created_at.desc"})
    except SupabaseError as exc:
        raise exc.to_http() from exc
    return [shape_report(row) for row in rows or []]


@router.patch("/reports/{report_id}")
@limiter.limit("60/minute")
async def update_report(request: Request, report_id: UUID, body: ReportStatusUpdate, admin: AdminUser, db: UserDb) -> dict[str, Any]:
    try:
        updated = await db.update(
            "reports",
            {"status": body.status, "handled_by": admin.id},
            {"id": f"eq.{report_id}"},
        )
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
        rows = await db.select("admin_reports", {"select": "*", "id": f"eq.{report_id}"})
    except SupabaseError as exc:
        raise exc.to_http() from exc
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found.")
    return shape_report(rows[0])


@router.get("/venues")
@limiter.limit("60/minute")
async def list_venues(request: Request, admin: AdminUser, db: UserDb) -> list[dict[str, Any]]:
    try:
        rows = await db.select(
            "venues",
            {
                "select": "id,name,description,photo_url,address,website,phone,maps_url,rating,popular_times,capacity,is_active",
                "is_active": "eq.true",
                "order": "name.asc",
            },
        )
    except SupabaseError as exc:
        raise exc.to_http() from exc
    return [
        {
            "id": row["id"],
            "name": row["name"],
            "description": row.get("description") or "",
            "photo": row.get("photo_url"),
            "address": row.get("address") or "",
            "website": row.get("website"),
            "phone": row.get("phone"),
            "mapsUrl": row.get("maps_url"),
            "rating": row.get("rating"),
            "popularTimes": row.get("popular_times") or [],
            "capacity": row.get("capacity"),
        }
        for row in rows or []
    ]


@router.post("/events", status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
async def create_event(request: Request, body: EventCreate, admin: AdminUser, db: UserDb) -> dict[str, Any]:
    try:
        event_id = await db.rpc(
            "create_event",
            {
                "p_event_at": body.eventAt.isoformat(),
                "p_target_group_size": body.targetGroupSize,
                "p_default_venue_id": str(body.defaultVenueId) if body.defaultVenueId else None,
                "p_location_hidden": body.locationHidden,
                "p_capacity": body.capacity,
                "p_title": body.title,
                "p_status": "open",
            },
        )
    except SupabaseError as exc:
        raise exc.to_http() from exc
    return {"id": event_id}
