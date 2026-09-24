"""Thin async wrapper around the Supabase Data API (PostgREST).

Two flavours:
- `user_client(token)`: `apikey` = publishable key, bearer = the user's own JWT,
  plus the backend header that unlocks the Data API. RLS applies.
- `service_client()`: service role key; bypasses RLS. System jobs only.
"""

from __future__ import annotations

import logging
from typing import Any, Mapping

import httpx
from fastapi import HTTPException, Request, status

from .config import Settings, get_settings

log = logging.getLogger(__name__)

BACKEND_HEADER = "X-Koffito-Backend-Key"

# plpgsql `raise exception '<code>'` messages mapped to HTTP responses.
DOMAIN_ERRORS: dict[str, tuple[int, str]] = {
    "not_authenticated": (401, "You need to be signed in."),
    "not_admin": (403, "Admins only."),
    "survey_incomplete": (409, "Finish your survey before joining a coffee talk."),
    "event_not_open": (409, "This coffee talk is no longer open."),
    "time_conflict": (409, "You already have a coffee talk around that time."),
    "event_full": (409, "This coffee talk is full."),
    "nothing_to_cancel": (409, "There is nothing to cancel."),
    "nothing_to_confirm": (409, "There is nothing to confirm for this coffee talk."),
    "event_not_confirmable": (409, "This coffee talk can't be confirmed anymore."),
    "invalid_stage": (400, "Unknown confirmation stage."),
    "not_revealed_yet": (409, "The café hasn't been revealed yet."),
    "event_in_the_past": (400, "Pick a time in the future."),
    "unknown_language": (400, "Unknown language."),
    "is_admin_is_read_only": (403, "That field is read-only."),
}


class SupabaseError(Exception):
    def __init__(self, status_code: int, code: str | None, message: str, details: Any = None) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details

    def to_http(self) -> HTTPException:
        if self.message in DOMAIN_ERRORS:
            http_status, detail = DOMAIN_ERRORS[self.message]
            return HTTPException(status_code=http_status, detail=detail)
        if self.code == "42501" or self.status_code in (401, 403):
            return HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can't do that.")
        if self.code == "PGRST116" or self.status_code == 404:
            return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")
        if self.code in ("23505",):
            return HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already exists.")
        if self.code in ("23514", "22P02", "23503", "22007", "22008"):
            return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid data.")
        log.error("Supabase error %s %s: %s %s", self.status_code, self.code, self.message, self.details)
        return HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="The coffee machine hiccupped. Try again.")


class SupabaseRest:
    def __init__(self, http: httpx.AsyncClient, rest_url: str, headers: Mapping[str, str]) -> None:
        self._http = http
        self._rest_url = rest_url
        self._headers = dict(headers)

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: Mapping[str, str] | None = None,
        json: Any = None,
        prefer: str | None = None,
    ) -> Any:
        headers = dict(self._headers)
        if prefer:
            headers["Prefer"] = prefer
        response = await self._http.request(
            method, f"{self._rest_url}/{path}", params=params, json=json, headers=headers
        )
        if response.status_code >= 400:
            body: Any
            try:
                body = response.json()
            except ValueError:
                body = {"message": response.text}
            raise SupabaseError(
                response.status_code,
                body.get("code") if isinstance(body, dict) else None,
                (body.get("message") if isinstance(body, dict) else str(body)) or "request failed",
                body.get("details") if isinstance(body, dict) else None,
            )
        if response.status_code == 204 or not response.content:
            return None
        return response.json()

    async def rpc(self, name: str, params: Mapping[str, Any] | None = None) -> Any:
        return await self._request("POST", f"rpc/{name}", json=dict(params or {}))

    async def select(self, table: str, params: Mapping[str, str], *, single: bool = False) -> Any:
        prefer = "return=representation"
        headers_extra = {}
        if single:
            headers_extra["Accept"] = "application/vnd.pgrst.object+json"
        client = self._with_headers(headers_extra)
        return await client._request("GET", table, params=params, prefer=prefer)

    async def insert(self, table: str, rows: Any, *, returning: bool = True) -> Any:
        prefer = "return=representation" if returning else "return=minimal"
        return await self._request("POST", table, json=rows, prefer=prefer)

    async def upsert(self, table: str, rows: Any, *, on_conflict: str, returning: bool = True) -> Any:
        prefer = "resolution=merge-duplicates," + ("return=representation" if returning else "return=minimal")
        return await self._request("POST", table, params={"on_conflict": on_conflict}, json=rows, prefer=prefer)

    async def update(self, table: str, values: Mapping[str, Any], filters: Mapping[str, str], *, returning: bool = True) -> Any:
        prefer = "return=representation" if returning else "return=minimal"
        return await self._request("PATCH", table, params=filters, json=dict(values), prefer=prefer)

    def _with_headers(self, extra: Mapping[str, str]) -> "SupabaseRest":
        if not extra:
            return self
        merged = dict(self._headers)
        merged.update(extra)
        return SupabaseRest(self._http, self._rest_url, merged)


def _base_headers(settings: Settings, api_key: str, bearer: str) -> dict[str, str]:
    return {
        "apikey": api_key,
        "Authorization": f"Bearer {bearer}",
        BACKEND_HEADER: settings.koffito_backend_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def user_client(http: httpx.AsyncClient, settings: Settings, token: str) -> SupabaseRest:
    """Acts as the signed-in user: RLS decides what they can see and change."""
    return SupabaseRest(http, settings.rest_url, _base_headers(settings, settings.supabase_anon_key, token))


def service_client(http: httpx.AsyncClient, settings: Settings) -> SupabaseRest:
    """Bypasses RLS. Only for system jobs; never for a user request."""
    if not settings.supabase_service_role_key:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is not configured")
    key = settings.supabase_service_role_key
    return SupabaseRest(http, settings.rest_url, _base_headers(settings, key, key))


def get_http(request: Request) -> httpx.AsyncClient:
    return request.app.state.http


def get_user_db(request: Request, token: str) -> SupabaseRest:
    settings: Settings = getattr(request.app.state, "settings", None) or get_settings()
    return user_client(get_http(request), settings, token)
