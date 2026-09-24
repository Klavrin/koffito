from __future__ import annotations

import respx
from httpx import Response

from .conftest import ANON_KEY, BACKEND_KEY, SUPABASE_URL, USER_ID, auth, make_token

ME_PAYLOAD = {
    "id": USER_ID,
    "name": "Ada",
    "emoji": "🦊",
    "gender": "female",
    "age": 27,
    "languages": ["en"],
    "occupation": "Engineer",
    "favoriteCoffee": "Flat white",
    "survey": {"hobbies": ["reading"]},
    "stats": {"coffeeTalks": 2, "cafesVisited": 1, "peopleMet": 5},
    "isAdmin": False,
    "onboarded": True,
    "settings": {"notificationsEnabled": True, "remindersEnabled": False},
}


async def test_missing_token_is_401(client):
    response = await client.get("/me")
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


async def test_expired_token_is_401(client):
    response = await client.get("/me", headers=auth(make_token(expires_in=-60)))
    assert response.status_code == 401
    assert response.json()["detail"] == "Token expired"


async def test_wrong_audience_is_401(client):
    response = await client.get("/me", headers=auth(make_token(aud="something-else")))
    assert response.status_code == 401


async def test_wrong_issuer_is_401(client):
    response = await client.get("/me", headers=auth(make_token(issuer="https://evil.example/auth/v1")))
    assert response.status_code == 401


async def test_forged_signature_is_401(client):
    response = await client.get("/me", headers=auth(make_token(secret="not-the-secret-not-the-secret-000")))
    assert response.status_code == 401


async def test_service_role_token_is_not_a_user(client):
    response = await client.get("/me", headers=auth(make_token(role="service_role")))
    assert response.status_code == 401


@respx.mock
async def test_valid_token_calls_supabase_as_the_user(client):
    route = respx.post(f"{SUPABASE_URL}/rest/v1/rpc/get_me").mock(return_value=Response(200, json=ME_PAYLOAD))
    token = make_token()

    response = await client.get("/me", headers=auth(token))

    assert response.status_code == 200, response.text
    sent = route.calls.last.request
    assert sent.headers["Authorization"] == f"Bearer {token}"  # the user's own token, so RLS applies
    assert sent.headers["apikey"] == ANON_KEY  # never the service role key
    assert sent.headers["X-Koffito-Backend-Key"] == BACKEND_KEY  # unlocks the gated Data API

    body = response.json()
    assert body["firstName"] == "Ada"
    assert body["gender"] == "Female"
    assert body["email"] == "ada@example.com"
    assert body["settings"] == {"notificationsEnabled": True, "remindersEnabled": False}
    assert body["stats"]["peopleMet"] == 5
