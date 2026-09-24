from __future__ import annotations

import time
from typing import Any

import httpx
import jwt
import pytest
import pytest_asyncio

from app.config import Settings
from app.main import create_app

SUPABASE_URL = "https://example.supabase.co"
JWT_SECRET = "test-jwt-secret-that-is-long-enough-0123456789"
BACKEND_KEY = "backend-key"
ANON_KEY = "anon-key"
USER_ID = "11111111-1111-4111-8111-111111111111"


@pytest.fixture
def settings() -> Settings:
    return Settings(
        supabase_url=SUPABASE_URL,
        supabase_anon_key=ANON_KEY,
        supabase_service_role_key="service-key",
        supabase_jwt_secret=JWT_SECRET,
        koffito_backend_key=BACKEND_KEY,
        app_env="test",
        jobs_enabled=False,
        rate_limit_default="1000/minute",
    )


@pytest.fixture
def app(settings: Settings):
    application = create_app(settings)
    # Fresh limiter storage per test so limits don't leak between tests.
    application.state.limiter.reset()
    return application


@pytest_asyncio.fixture
async def client(app) -> httpx.AsyncClient:  # type: ignore[no-untyped-def]
    async with app.router.lifespan_context(app):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as http:
            yield http


def make_token(
    sub: str = USER_ID,
    *,
    secret: str = JWT_SECRET,
    aud: str = "authenticated",
    role: str = "authenticated",
    issuer: str = f"{SUPABASE_URL}/auth/v1",
    expires_in: int = 3600,
    email: str = "ada@example.com",
    extra: dict[str, Any] | None = None,
) -> str:
    now = int(time.time())
    claims: dict[str, Any] = {
        "sub": sub,
        "aud": aud,
        "role": role,
        "iss": issuer,
        "iat": now,
        "exp": now + expires_in,
        "email": email,
    }
    claims.update(extra or {})
    return jwt.encode(claims, secret, algorithm="HS256")


def auth(token: str | None = None) -> dict[str, str]:
    return {"Authorization": f"Bearer {token or make_token()}"}
