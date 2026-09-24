from __future__ import annotations

import json

import respx
from httpx import Response

from .conftest import SUPABASE_URL, USER_ID, auth, make_token

REST = f"{SUPABASE_URL}/rest/v1"


@respx.mock
async def test_report_uses_reporter_from_token(client):
    route = respx.post(f"{REST}/reports").mock(return_value=Response(201, json=[{"id": "r1", "status": "open"}]))

    response = await client.post(
        "/reports",
        headers=auth(),
        json={"reason": "no-show", "details": "Nobody came to the café, waited 40 minutes."},
    )

    assert response.status_code == 201, response.text
    sent = json.loads(route.calls.last.request.content)
    assert sent["reporter_id"] == USER_ID
    assert sent["reason"] == "no-show"


async def test_report_rejects_reporter_in_body(client):
    response = await client.post(
        "/reports",
        headers=auth(),
        json={"reason": "no-show", "details": "Long enough details here.", "reporter_id": "someone-else"},
    )
    assert response.status_code == 422


async def test_report_validates_details_length(client):
    response = await client.post("/reports", headers=auth(), json={"reason": "rude", "details": "short"})
    assert response.status_code == 422


@respx.mock
async def test_join_maps_domain_errors(client):
    respx.post(f"{REST}/rpc/join_event").mock(
        return_value=Response(400, json={"code": "P0001", "message": "event_full", "details": None, "hint": None})
    )
    response = await client.post(f"/events/{USER_ID}/join", headers=auth())
    assert response.status_code == 409
    assert "full" in response.json()["detail"]


@respx.mock
async def test_rls_denial_becomes_403(client):
    respx.post(f"{REST}/rpc/join_event").mock(
        return_value=Response(403, json={"code": "42501", "message": "permission denied for table x"})
    )
    response = await client.post(f"/events/{USER_ID}/join", headers=auth())
    assert response.status_code == 403


@respx.mock
async def test_events_are_shaped_for_the_app(client):
    respx.post(f"{REST}/rpc/get_my_events").mock(
        return_value=Response(
            200,
            json=[
                {
                    "id": "e1",
                    "event_at": "2026-10-01T10:00:00+00:00",
                    "reveal_at": "2026-09-30T10:00:00+00:00",
                    "status": "confirmed",
                    "participant_status": "confirmed_24h",
                    "joined": True,
                    "location_hidden": False,
                    "reveal_opened": True,
                    "max_participants": 4,
                    "cafe": {"id": "v1", "name": "Naringi"},
                    "participants": [{"id": "u2", "name": "Sam"}],
                    "attended": None,
                    "attendance_note": None,
                    "my_rating": None,
                    "my_comment": None,
                }
            ],
        )
    )
    response = await client.get("/events", headers=auth())
    assert response.status_code == 200
    event = response.json()[0]
    assert event["cafe"]["name"] == "Naringi"
    assert event["participants"][0]["name"] == "Sam"
    assert event["revealOpened"] is True
    assert event["maxParticipants"] == 4


@respx.mock
async def test_admin_routes_check_is_admin(client):
    respx.get(f"{REST}/profiles").mock(return_value=Response(200, json={"is_admin": False}))
    response = await client.get("/admin/reports", headers=auth())
    assert response.status_code == 403

    respx.get(f"{REST}/profiles").mock(return_value=Response(200, json={"is_admin": True}))
    respx.get(f"{REST}/admin_reports").mock(
        return_value=Response(
            200,
            json=[
                {
                    "id": "r1",
                    "reason": "rude",
                    "details": "details",
                    "status": "open",
                    "created_at": "2026-09-20T10:00:00+00:00",
                    "reported_by": "Maya",
                }
            ],
        )
    )
    response = await client.get("/admin/reports", headers=auth())
    assert response.status_code == 200
    assert response.json()[0]["reasonLabel"] == "Rude or disrespectful"


@respx.mock
async def test_profile_update_maps_fields(client):
    update = respx.patch(f"{REST}/profiles").mock(return_value=Response(204))
    languages = respx.post(f"{REST}/rpc/set_my_languages").mock(return_value=Response(200, json=["en", "ro"]))
    respx.post(f"{REST}/rpc/get_me").mock(return_value=Response(200, json={"id": USER_ID, "name": "Ada"}))

    response = await client.patch(
        "/me",
        headers=auth(),
        json={"firstName": "Ada", "gender": "Non-binary", "age": 30, "languages": ["en", "ro"]},
    )

    assert response.status_code == 200, response.text
    sent = json.loads(update.calls.last.request.content)
    assert sent["display_name"] == "Ada"
    assert sent["gender"] == "non_binary"
    assert sent["date_of_birth"].endswith(tuple(str(d) for d in range(10)))
    assert update.calls.last.request.url.params["id"] == f"eq.{USER_ID}"
    assert json.loads(languages.calls.last.request.content) == {"p_languages": ["en", "ro"]}


async def test_profile_update_rejects_minors(client):
    response = await client.patch("/me", headers=auth(), json={"age": 15})
    assert response.status_code == 422


@respx.mock
async def test_rate_limit_on_reports(client):
    respx.post(f"{REST}/reports").mock(return_value=Response(201, json=[{"id": "r", "status": "open"}]))
    headers = auth(make_token())
    statuses = []
    for _ in range(6):
        response = await client.post(
            "/reports", headers=headers, json={"reason": "other", "details": "Ten characters or more."}
        )
        statuses.append(response.status_code)
    assert statuses[:5] == [201] * 5
    assert statuses[5] == 429
