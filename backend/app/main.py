from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from .auth import TokenVerifier
from .config import Settings, get_settings
from .jobs.scheduler import build_scheduler
from .ratelimit import limiter
from .routers import admin, events, me, people, reports, venues
from .supabase import SupabaseError

log = logging.getLogger(__name__)

def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    logging.basicConfig(level=settings.log_level.upper())

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        app.state.http = httpx.AsyncClient(timeout=httpx.Timeout(15.0, connect=5.0))
        app.state.scheduler = None
        if settings.jobs_enabled and settings.app_env != "test":
            if settings.supabase_service_role_key:
                app.state.scheduler = build_scheduler(app.state.http, settings)
                app.state.scheduler.start()
                log.info("system jobs started")
            else:
                log.warning("JOBS_ENABLED but SUPABASE_SERVICE_ROLE_KEY is missing; jobs disabled")
        try:
            yield
        finally:
            if app.state.scheduler:
                app.state.scheduler.shutdown(wait=False)
            await app.state.http.aclose()

    app = FastAPI(
        title="Koffito API",
        version="0.1.0",
        lifespan=lifespan,
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None,
        openapi_url=None if settings.is_production else "/openapi.json",
    )
    app.state.settings = settings
    app.state.verifier = TokenVerifier(settings)
    app.state.limiter = limiter

    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
            allow_headers=["Authorization", "Content-Type"],
        )
    app.add_middleware(SlowAPIMiddleware)

    @app.middleware("http")
    async def https_only(request: Request, call_next):  # type: ignore[no-untyped-def]
        # Traffic is HTTPS only. Behind a proxy the original scheme arrives in X-Forwarded-Proto.
        if settings.is_production:
            scheme = request.headers.get("x-forwarded-proto", request.url.scheme).split(",")[0].strip()
            if scheme != "https":
                return JSONResponse(status_code=400, content={"detail": "HTTPS is required."})
        response = await call_next(request)
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers.setdefault("Cache-Control", "no-store")
        return response

    @app.exception_handler(RateLimitExceeded)
    async def rate_limited(request: Request, exc: RateLimitExceeded) -> JSONResponse:
        return JSONResponse(status_code=429, content={"detail": "Slow down a little and try again."})

    @app.exception_handler(SupabaseError)
    async def supabase_failed(request: Request, exc: SupabaseError) -> JSONResponse:
        http = exc.to_http()
        return JSONResponse(status_code=http.status_code, content={"detail": http.detail})

    @app.get("/health", tags=["meta"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(me.router)
    app.include_router(events.router)
    app.include_router(venues.router)
    app.include_router(people.router)
    app.include_router(reports.router)
    app.include_router(admin.router)
    return app


