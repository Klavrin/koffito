# Koffito backend (FastAPI)

> This folder belongs in the `Koffito-Backend` repository. It was written here
> because that repository was not reachable from the session that produced it;
> copy the folder over as-is.

The API sits between the Koffito app and Supabase:

- **App ↔ Supabase**: authentication only (sign up, log in, log out, refresh).
- **App ↔ API**: every data request, with `Authorization: Bearer <access_token>`.
- **API ↔ Supabase**: each request verifies the JWT (signature, expiry,
  audience, issuer), takes the user id from the token and calls the Data API
  with the user's own token, so Row Level Security still applies. System jobs
  use the service role key from the environment.

The Data API refuses `anon` / `authenticated` requests that do not carry the
`X-Koffito-Backend-Key` header (a PostgREST pre-request hook), so the app cannot
bypass the API even though it holds the publishable key.

## Run

```bash
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env   # fill in the keys
uvicorn app.asgi:app --reload --port 8000
```

Generate the backend key once in the Supabase SQL editor:

```sql
select private.rotate_backend_key();
```

Run the tests with `pytest`.

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/health` | liveness |
| GET | `/me` | profile, survey, stats, settings, admin flag |
| PATCH | `/me` | name, avatar, gender, age, occupation, favourite coffee, languages |
| PUT | `/me/survey` | survey answers; marks the profile onboarded |
| PATCH | `/me/settings` | notification / reminder toggles |
| GET | `/events` | the user's coffee talks (`get_my_events`) |
| GET | `/events/open` | joinable coffee talks (`get_open_events`) |
| GET | `/events/{id}` | one coffee talk (own or open) |
| POST | `/events/{id}/join` / `/leave` | `join_event` / `leave_event` |
| POST | `/events/{id}/confirm` | `{ "stage": "24h" \| "3h" }` |
| POST | `/events/{id}/reveal` | remembers the café was opened |
| POST | `/events/{id}/attendance` | `{ "happened": bool, "note"?: str }` |
| PUT | `/events/{id}/rating` | `{ "rating": 1-5, "comment": str }` |
| GET | `/venues/visited` | cafés the user has been to |
| GET | `/people/{id}` | public profile of a group mate |
| POST | `/reports` | file a report |
| GET | `/admin/reports`, PATCH `/admin/reports/{id}` | admins only (`profiles.is_admin`) |
| GET | `/admin/venues`, POST `/admin/events` | admins only |

All endpoints are rate limited per user (falls back to the client IP).

## System jobs

Scheduled with APScheduler inside the API process when `JOBS_ENABLED=true`:

- **matchmaking** (every 10 min): groups `joined` participants of events that
  start within `MATCH_LEAD_HOURS`, using survey embeddings (feature-hashed,
  64 dims, stored in `surveys.embedding`) and shared languages.
- **venue assignment** (every 10 min): gives groups without a café the event's
  default venue or the least-loaded active venue.
- **reminders** (every 5 min): 24h and 3h confirmation reminders for people who
  have not confirmed yet, respecting `user_settings.reminders_enabled`.
  Delivery goes through `app/jobs/notifier.py` (logging by default; plug in
  push/email there).
- **completion** (every 15 min): marks events as completed a few hours after
  they took place.
