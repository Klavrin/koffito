from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, Request, status

from .auth import CurrentUser, get_current_user
from .config import Settings, get_settings
from .supabase import SupabaseError, SupabaseRest, get_user_db


def settings_dep(request: Request) -> Settings:
    return getattr(request.app.state, "settings", None) or get_settings()


SettingsDep = Annotated[Settings, Depends(settings_dep)]
CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]


def user_db(request: Request, user: CurrentUserDep) -> SupabaseRest:
    """Supabase client acting as the caller (their own token, RLS applies)."""
    return get_user_db(request, user.token)


UserDb = Annotated[SupabaseRest, Depends(user_db)]


async def require_admin(user: CurrentUserDep, db: UserDb) -> CurrentUser:
    """Admin routes additionally check `profiles.is_admin` (RLS lets a user read their own row)."""
    try:
        row = await db.select("profiles", {"select": "is_admin", "id": f"eq.{user.id}"}, single=True)
    except SupabaseError as exc:
        raise exc.to_http() from exc
    if not row or not row.get("is_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admins only.")
    return user


AdminUser = Annotated[CurrentUser, Depends(require_admin)]
