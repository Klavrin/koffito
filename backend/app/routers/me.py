from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException, Request, status

from ..deps import CurrentUserDep, UserDb
from ..ratelimit import limiter
from ..schemas import GENDER_FROM_DB, ProfileUpdate, SettingsUpdate, SurveyUpdate
from ..supabase import SupabaseError

router = APIRouter(prefix="/me", tags=["me"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def shape_profile(raw: dict[str, Any], email: str | None) -> dict[str, Any]:
    stats = raw.get("stats") or {}
    settings = raw.get("settings") or {}
    return {
        "id": raw.get("id"),
        "email": email,
        "firstName": raw.get("name") or "",
        "avatar": raw.get("emoji"),
        "gender": GENDER_FROM_DB.get(raw.get("gender") or "", None),
        "age": raw.get("age"),
        "occupation": raw.get("occupation"),
        "favoriteCoffee": raw.get("favoriteCoffee"),
        "languages": raw.get("languages") or [],
        "survey": raw.get("survey") or {},
        "onboarded": bool(raw.get("onboarded")),
        "isAdmin": bool(raw.get("isAdmin")),
        "stats": {
            "coffeeTalks": int(stats.get("coffeeTalks") or 0),
            "cafesVisited": int(stats.get("cafesVisited") or 0),
            "peopleMet": int(stats.get("peopleMet") or 0),
        },
        "settings": {
            "notificationsEnabled": bool(settings.get("notificationsEnabled", True)),
            "remindersEnabled": bool(settings.get("remindersEnabled", True)),
        },
    }


async def load_me(db: UserDb, user: CurrentUserDep) -> dict[str, Any]:
    try:
        raw = await db.rpc("get_me")
    except SupabaseError as exc:
        raise exc.to_http() from exc
    if not raw:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found.")
    return shape_profile(raw, user.email)


@router.get("")
@limiter.limit("60/minute")
async def get_me(request: Request, user: CurrentUserDep, db: UserDb) -> dict[str, Any]:
    return await load_me(db, user)


@router.patch("")
@limiter.limit("30/minute")
async def update_me(request: Request, body: ProfileUpdate, user: CurrentUserDep, db: UserDb) -> dict[str, Any]:
    row = body.to_profile_row(date.today())
    try:
        if row:
            await db.update("profiles", row, {"id": f"eq.{user.id}"}, returning=False)
        if body.languages is not None:
            await db.rpc("set_my_languages", {"p_languages": body.languages})
    except SupabaseError as exc:
        raise exc.to_http() from exc
    return await load_me(db, user)


@router.put("/survey")
@limiter.limit("30/minute")
async def put_survey(request: Request, body: SurveyUpdate, user: CurrentUserDep, db: UserDb) -> dict[str, Any]:
    now = _now()
    try:
        # user_id comes from the verified token; RLS also enforces it.
        await db.upsert(
            "surveys",
            {"user_id": user.id, "survey_data": body.answers, "completed_at": now},
            on_conflict="user_id",
            returning=False,
        )
        await db.update(
            "profiles",
            {"onboarded_at": now},
            {"id": f"eq.{user.id}", "onboarded_at": "is.null"},
            returning=False,
        )
    except SupabaseError as exc:
        raise exc.to_http() from exc
    return await load_me(db, user)


@router.patch("/settings")
@limiter.limit("30/minute")
async def update_settings(request: Request, body: SettingsUpdate, user: CurrentUserDep, db: UserDb) -> dict[str, Any]:
    values: dict[str, Any] = {}
    if body.notificationsEnabled is not None:
        values["notifications_enabled"] = body.notificationsEnabled
    if body.remindersEnabled is not None:
        values["reminders_enabled"] = body.remindersEnabled
    if values:
        try:
            await db.update("user_settings", values, {"user_id": f"eq.{user.id}"}, returning=False)
        except SupabaseError as exc:
            raise exc.to_http() from exc
    return await load_me(db, user)
