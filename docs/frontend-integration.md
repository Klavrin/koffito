# Koffito — frontend integration guide

Everything the React Native (Expo) app needs to talk to Koffito. Written to be pasted into an
AI assistant as context: it is self-contained and describes the _contract_, not the backend's
internals.

## 1. The trust model

```
┌──────────────┐   auth only (sign up / in / out / refresh)   ┌──────────────────┐
│  Expo app    │ ───────────────────────────────────────────▶ │  Supabase Auth   │
│  (RN)        │ ◀─── access token (JWT, ~1h) + refresh token │                  │
│              │                                              └──────────────────┘
│              │   every data request                          ┌──────────────────┐
│              │   Authorization: Bearer <access_token>        │  Koffito API     │
│              │ ───────────────────────────────────────────▶ │  (FastAPI)       │
│              │ ◀─── JSON                                     │                  │
└──────────────┘                                               │  verifies JWT,   │
                                                               │  calls Supabase  │
                                                               │  with YOUR token │
                                                               │  → RLS applies   │
                                                               └────────┬─────────┘
                                                                        ▼
                                                               ┌──────────────────┐
                                                               │ Supabase DB      │
                                                               │ (PostgREST gate: │
                                                               │  backend only)   │
                                                               └──────────────────┘
```

- **The app talks to Supabase for authentication only**: sign up, sign in, sign out, token
  refresh. `supabase-js` stores the session in secure storage and refreshes it automatically.
- **Every data request goes to the Koffito API** (profile, events, survey, join/leave,
  confirmations, ratings, reports) with `Authorization: Bearer <access_token>`, over HTTPS.
- **Direct database access from the app is closed.** `supabase.from(...)` and
  `supabase.rpc(...)` are rejected by the server with
  `42501 "Koffito data is only available through the Koffito API"`. Do not build on them
  (Storage and Realtime are not part of this contract either).
- The API verifies the token on every request (signature, expiry, audience) and takes the
  user id from the token — **never send your own user id in a body**; bodies with unknown
  fields are rejected with `422`.
- The app holds only the Supabase URL and the **publishable key**. There is no service key in
  the app, ever.

## 2. Environment

```bash
# .env (Expo public vars are bundled into the app — they are not secrets)
EXPO_PUBLIC_SUPABASE_URL=https://gxdebgnkrstzxtlvcsix.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # from the Supabase dashboard
EXPO_PUBLIC_API_URL=https://api.koffito.example           # the Koffito API base URL (no trailing slash)
```

Packages: `@supabase/supabase-js`, `expo-secure-store`, `@react-native-async-storage/async-storage`,
`aes-js`, `react-native-get-random-values`, `react-native-url-polyfill`.

## 3. Supabase client (auth only)

`expo-secure-store` caps values at 2 048 bytes, which a session exceeds. Keep an AES key in
SecureStore and the encrypted session in AsyncStorage (the pattern Supabase documents):

```ts
// lib/supabase.ts
import "react-native-url-polyfill/auto";
import "react-native-get-random-values";
import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as aesjs from "aes-js";
import { AppState } from "react-native";

class LargeSecureStore {
  private async encrypt(key: string, value: string) {
    const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8));
    const cipher = new aesjs.ModeOfOperation.ctr(
      encryptionKey,
      new aesjs.Counter(1),
    );
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await SecureStore.setItemAsync(
      key,
      aesjs.utils.hex.fromBytes(encryptionKey),
    );
    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }
  private async decrypt(key: string, value: string) {
    const encryptionKeyHex = await SecureStore.getItemAsync(key);
    if (!encryptionKeyHex) return null;
    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1),
    );
    return aesjs.utils.utf8.fromBytes(
      cipher.decrypt(aesjs.utils.hex.toBytes(value)),
    );
  }
  async getItem(key: string) {
    const encrypted = await AsyncStorage.getItem(key);
    return encrypted ? this.decrypt(key, encrypted) : null;
  }
  async setItem(key: string, value: string) {
    await AsyncStorage.setItem(key, await this.encrypt(key, value));
  }
  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  }
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    auth: {
      storage: new LargeSecureStore(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// Refresh only while the app is in the foreground.
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
```

### Auth calls

```ts
// Sign up. Email confirmation is ON: `session` is null until the user clicks the link.
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { first_name: firstName } }, // becomes profiles.display_name
});

// Sign in → session with access_token (JWT, ~1 h) + refresh_token
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// Current session (refreshes automatically when close to expiry)
const {
  data: { session },
} = await supabase.auth.getSession();

// Sign out
await supabase.auth.signOut();

// React to changes (SIGNED_IN, TOKEN_REFRESHED, SIGNED_OUT)
supabase.auth.onAuthStateChange((event, session) => {
  /* update app state */
});
```

Signing up automatically creates the user's `profile` and `settings` rows on the server; the
first `GET /me` after sign-in already works.

## 4. Calling the API

One helper does everything: attach the token, retry **once** after a refresh on `401`, and
sign out if the refreshed token is rejected too.

```ts
// lib/api.ts
import { supabase } from "./supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
    public retryAfter?: number,
  ) {
    super(message);
  }
}

async function accessToken(forceRefresh = false): Promise<string | null> {
  if (forceRefresh) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) return null;
    return data.session.access_token;
  }
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function api<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  retried = false,
): Promise<T> {
  const token = await accessToken(retried);
  if (!token) throw new ApiError(401, "missing_token", "Not signed in");

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  if (res.status === 401 && !retried) {
    return api<T>(method, path, body, true); // refresh once, then retry
  }
  if (res.status === 401) {
    await supabase.auth.signOut(); // refreshed token still rejected → session is dead
  }

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const err = payload?.error ?? {
      code: "http_error",
      message: res.statusText,
    };
    const retryAfter = Number(res.headers.get("Retry-After")) || undefined;
    throw new ApiError(
      res.status,
      err.code,
      err.message,
      err.details,
      retryAfter,
    );
  }
  return payload as T;
}
```

Usage: `await api<Me>("GET", "/me")`, `await api<void>("POST", `/events/${id}/join`)`.

### Error envelope

Every error has the same shape:

```json
{ "error": { "code": "event_full", "message": "event full", "details": null } }
```

`code` is stable and is what the UI should switch on; `message` is for logs. `details` is
present for `validation_error` (a list of `{loc, msg, type}`) and some constraint errors.

| Status | Codes                                                                                                                                                                                                                                                                            | Meaning / what to do                                                                                            |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 401    | `missing_token`, `invalid_token`, `token_expired`, `unknown_kid`, `not_authenticated`                                                                                                                                                                                            | Refresh the session once and retry; if it happens again, sign out. Response carries `WWW-Authenticate: Bearer`. |
| 403    | `admin_required`, `forbidden`                                                                                                                                                                                                                                                    | Not allowed. Hide the action.                                                                                   |
| 404    | `profile_not_found`, `settings_not_found`, `survey_not_found`, `event_not_found`, `venue_not_found`, `report_not_found`, `not_found`                                                                                                                                             | Nothing there (or not visible to this user).                                                                    |
| 409    | `survey_incomplete`, `event_not_open`, `registration_closed`, `time_conflict`, `event_full`, `nothing_to_cancel`, `not_in_group`, `event_not_revealed`, `event_started`, `already_responded`, `event_not_completed`, `not_attended`, `event_not_cancellable` (see the endpoints) | A business rule said no. Show the specific message.                                                             |
| 422    | `validation_error`, `empty_update`, `unknown_language`, `invalid_rating`, `event_in_the_past`, `registration_window_passed`, `constraint_violation`, `invalid_reference`, `invalid_value`, `missing_field`                                                                       | The request is malformed. Fix the form.                                                                         |
| 429    | `rate_limited`                                                                                                                                                                                                                                                                   | Back off for `Retry-After` seconds.                                                                             |
| 5xx    | `internal_error`, `backend_misconfigured`, `upstream_error`, `upstream_unavailable`, `upstream_timeout`                                                                                                                                                                          | Server-side. Retry later, show a generic error.                                                                 |

### Rate limits

Per user (per API instance): reads 120/min, writes 30/min, reports 5/hour, admin 60/min.
Successful responses with a body carry `X-RateLimit-Limit` and `X-RateLimit-Remaining`
(`204` responses do not).

### Conventions

- All ids are UUIDs. All timestamps are ISO-8601 in UTC (`2026-09-27T06:00:00Z`).
- Request bodies reject unknown fields (`422 validation_error`). Only send what is documented.
- `PATCH` bodies are partial: send only the fields you change. An empty patch is `422 empty_update`.
- Endpoints that act (join, leave, confirm, …) return `204 No Content`.

## 5. Endpoints

`GET /health` — public liveness check, no auth: `{"status":"ok","version":"0.1.0","environment":"production"}`.

### 5.1 Me

#### `GET /me` — profile, stats, admin flag and settings

```json
{
  "id": "66f7bb5d-6b1e-4d7a-8a23-2412e8e3826b",
  "name": "Sergiu",
  "emoji": "☕",
  "gender": "male",
  "age": 30,
  "languages": ["en", "ro"],
  "occupation": "developer",
  "favoriteCoffee": "flat white",
  "survey": { "q1": ["a"] },
  "stats": { "coffeeTalks": 2, "cafesVisited": 1, "peopleMet": 5 },
  "isAdmin": false,
  "onboarded": true,
  "settings": { "notificationsEnabled": true, "remindersEnabled": true }
}
```

`404 profile_not_found` if the account has no profile row (should not happen for accounts
created through sign-up).

#### `PATCH /me` — edit the profile (partial)

Body fields (all optional): `display_name` (1–60 chars, not null), `avatar_emoji` (≤ 8),
`avatar_url` (http(s) URL or null), `gender` (`female|male|non_binary|prefer_not_to_say`),
`date_of_birth` (`YYYY-MM-DD`, must be 18+), `occupation` (≤ 80), `favorite_coffee` (≤ 80),
`onboarded` (`true` marks onboarding complete, `false` clears it).

Response — the profile row (snake_case):

```json
{
  "id": "…",
  "display_name": "Sergiu",
  "avatar_emoji": "☕",
  "avatar_url": null,
  "gender": "male",
  "date_of_birth": "1995-01-01",
  "occupation": "developer",
  "favorite_coffee": "flat white",
  "onboarded_at": "2026-09-22T12:50:25Z",
  "created_at": "2026-09-22T12:44:10Z",
  "updated_at": "2026-09-24T10:00:00Z"
}
```

`is_admin` is read-only and cannot be sent.

#### `PUT /me/languages` — replace the language list

Body `{"languages": ["ro", "en"]}` (values `ro|ru|en`, unique, max 3). Response `{"languages": ["en", "ro"]}`.

#### `PATCH /me/settings`

Body (partial) `{"notifications_enabled": true, "reminders_enabled": false}`.
Response `{"notifications_enabled": true, "reminders_enabled": false, "updated_at": "…"}`.

#### `GET /me/survey`

```json
{
  "survey_data": { "q1": ["a", "b"], "q2": ["c"] },
  "completed_at": "2026-09-22T12:50:25Z",
  "completed": true
}
```

`404 survey_not_found` until the user saves one.

#### `PUT /me/survey` — create or replace the survey

Body `{"survey_data": {"<questionId>": ["<answer>", …]}, "completed": true}`. Every value
must be an array of strings (a draft can be saved with `"completed": false`). Users cannot
join events until a survey is **completed**. Response: same shape as `GET /me/survey`.

#### `GET /me/events` — the user's coffee talks (past and upcoming)

```json
[
  {
    "id": "cee809b6-ac52-4a29-9264-63083df8f479",
    "event_at": "2026-09-27T06:00:00Z",
    "registration_closes_at": "2026-09-26T05:55:00Z",
    "reveal_at": "2026-09-26T06:00:00Z",
    "completes_at": "2026-09-27T08:00:00Z",
    "event_status": "revealed",
    "participant_status": "confirmed",
    "cancel_reason": null,
    "group_number": 2,
    "cafe": {
      "id": "…",
      "name": "Tucano Coffee",
      "address": "Str. Ismail 33",
      "mapsUrl": "…",
      "…": "…"
    },
    "members": [
      {
        "id": "…",
        "name": "Gabi",
        "emoji": "☕",
        "status": "matched",
        "sharedInterests": ["topics:music"]
      }
    ],
    "my_rating": null,
    "my_comment": null
  }
]
```

- `event_status`: `open` → `closed` → `matched` → `revealed` → `completed`, or `failed` /
  `cancelled`. The server moves it every minute; the app never does.
- `participant_status`: `joined` → `matched` → `confirmed` | `declined`.
- `cancel_reason`: `not_enough_people` (fewer than 3 joined) or `admin`.
- `cafe`, `group_number` and `members` are `null` until the event is revealed **and** the user
  said "Yes, I'm coming". `members` are first names; `sharedInterests` are survey answers both
  people picked, as `question:answer` (only `hobbies` and `topics`).
- `src/lib/events.ts` (`getEventPhase`) turns the two statuses into what each screen shows.

#### `GET /me/venues` — cafés the user has visited (most recent first)

```json
[
  {
    "id": "…",
    "name": "Tucano Coffee",
    "description": "",
    "photo": null,
    "address": "Str. Ismail 33",
    "website": null,
    "phone": null,
    "mapsUrl": null,
    "rating": 4.5,
    "popularTimes": [10, 20, 30, 40, 50, 60, 70]
  }
]
```

### 5.2 Events

The admin only picks `event_at` (T). Registration closes at T − 24h5m, the group is revealed at
T − 24h and the event completes at T + 2h. Groups are 3–5 people; capacity is active cafés × 5.

#### `GET /events` — open events the user can join

```json
[
  {
    "id": "cee809b6-ac52-4a29-9264-63083df8f479",
    "event_at": "2026-09-27T06:00:00Z",
    "registration_closes_at": "2026-09-26T05:55:00Z",
    "reveal_at": "2026-09-26T06:00:00Z",
    "full": false,
    "joined": false
  }
]
```

Only `open` events before their registration close. Never a café or a head count.

#### `POST /events/{id}/join` → `204`

409 codes: `survey_incomplete`, `event_not_open`, `registration_closed`, `time_conflict`
(another event within ±2 h), `event_full`. Joining twice is a no-op.

#### `POST /events/{id}/leave` → `204`

Only while the event is `open` and before registration closes. 409 `nothing_to_cancel`
(not a participant) or `registration_closed`.

#### `POST /events/{id}/respond` → `204`

After the reveal: `{"coming": true}` ("Yes, I'm coming") or `{"coming": false}` ("No, I can't
make it"). A confirmed user can still send `false` ("Can't make it anymore") until the event
starts. 409 `not_in_group`, `event_not_revealed`, `event_started`, `already_responded`.

#### `PUT /events/{id}/rating` — rate a completed coffee talk

Body `{"rating": 5, "comment": "great people"}` (`rating` 1–5, `comment` ≤ 1000, optional).
Creates or replaces the rating. Response:

```json
{
  "event_id": "…",
  "rating": 5,
  "comment": "great people",
  "created_at": "…",
  "updated_at": "…"
}
```

409 `event_not_completed`, `not_attended` (the user didn't confirm); 422 `invalid_rating`.

### 5.3 Users

#### `GET /users/{id}` — a groupmate's card

Visible for people the user shares a _revealed_ group with (and for admins). Otherwise
`404 profile_not_found` — the API does not distinguish "hidden" from "missing".

```json
{
  "id": "…",
  "name": "Gabi",
  "emoji": "🍵",
  "gender": "female",
  "age": 28,
  "languages": ["ro"],
  "occupation": null,
  "favoriteCoffee": "latte",
  "survey": {},
  "stats": { "coffeeTalks": 1, "cafesVisited": 1, "peopleMet": 3 }
}
```

### 5.4 Reports

#### `POST /reports` → `201`

```json
{
  "reported_user_id": "…",
  "event_id": "…",
  "reason": "rude",
  "details": "was rude to everyone at the table"
}
```

`reason`: `no-show|rude|unsafe|fake|other`. `details`: 10–2000 chars. `reported_user_id` and
`event_id` are optional. The reporter is always the signed-in user. Limited to 5 per hour.
Reporting a person needs `event_id` of a **completed** event in which both were in the same group:
otherwise 409 `event_not_completed` or `not_in_group`.

Response:

```json
{
  "id": "…",
  "reason": "rude",
  "details": "…",
  "status": "open",
  "event_id": "…",
  "reported_user_id": "…",
  "created_at": "…"
}
```

### 5.5 Admin (only when `GET /me` says `isAdmin: true`)

Admin-ness is decided by the server on every request (`profiles.is_admin`); a non-admin gets
`403 admin_required`. Do not cache the flag beyond the current session.

| Method & path                                           | Body / query                                                                                                      | Response                                                        |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `GET /admin/events?status=&from=&to=&limit=50&offset=0` | filters optional                                                                                                  | `{"items": [Event], "total", "limit", "offset"}`                |
| `POST /admin/events` → 201                              | `{"event_at": "<ISO with timezone>"}` only                                                                        | `Event` (422 `event_in_the_past`, `registration_window_passed`) |
| `GET /admin/events/{id}`                                |                                                                                                                   | `EventDetail` (404 `event_not_found`)                           |
| `POST /admin/events/{id}/cancel`                        |                                                                                                                   | `EventDetail` (409 `event_not_cancellable`)                     |
| `GET /admin/venues?include_inactive=false`              |                                                                                                                   | `[Venue]`                                                       |
| `POST /admin/venues` → 201                              | `{"name", "address", "description", "photo_url", "website", "phone", "maps_url", …}` (`name`, `address` required) | `Venue`                                                         |
| `GET /admin/venues/{id}` · `PATCH /admin/venues/{id}`   | partial body, e.g. `{"is_active": false}`                                                                         | `Venue` (404 `venue_not_found`)                                 |
| `DELETE /admin/venues/{id}` → 204                       | soft delete: `is_active=false`                                                                                    |                                                                 |
| `GET /admin/reports?status=&limit=50&offset=0`          | `status`: `open`, `reviewing` or `resolved`                                                                       | `{"items": [Report], "total", "limit", "offset"}`               |
| `PATCH /admin/reports/{id}`                             | `{"status": "reviewing"}`                                                                                         | `{"id", "status", "handled_by", "updated_at"}`                  |

There is no way to edit an event or its groups: the admin only creates, observes and cancels.

`Event`:

```json
{
  "id": "…",
  "title": null,
  "event_at": "…",
  "registration_closes_at": "…",
  "reveal_at": "…",
  "completes_at": "…",
  "status": "open",
  "cancel_reason": null,
  "status_changed_at": "…",
  "matching_error": null,
  "created_at": "…",
  "participant_count": 22,
  "group_count": 0,
  "capacity": 40
}
```

`EventDetail`: `{event: Event, group_size_min: 3, group_size_max: 5, active_cafes,
estimated_groups, participants: [{user_id, name, emoji, status, group_number, joined_at}],
groups: [{id, number, cafe, shared_interests, members: [{user_id, name, emoji, status,
shared_interests}], ratings: [{user_id, name, rating, comment}], average_rating}],
reports: [{id, reason, details, status, reported_by, reported_user_id, reported_user_name,
created_at}]}`.

`Venue`: all columns (`id, name, description, photo_url, address, website, phone, maps_url,
google_place_id, latitude, longitude, rating, popular_times, capacity, is_active, created_at`).

`Report` (admin view): `id, reason, details, status, created_at, updated_at, event_id, reporter_id,
reported_by (name), reported_user_id, reported_user_name, handled_by`.

## 6. Typical flows

**Onboarding**: sign up → confirm email → sign in → `GET /me` (`onboarded: false`) →
`PATCH /me` (name, birth date, …) → `PUT /me/languages` → `PUT /me/survey` →
`PATCH /me {"onboarded": true}`.

**Joining**: `GET /events` → `POST /events/{id}/join` → the event shows up in `GET /me/events`
with `event_status: "open"`, `participant_status: "joined"`.

**Registration closes** (T − 24h5m): the event becomes `closed` (or `cancelled` with
`cancel_reason: "not_enough_people"`), then `matched` a minute later; the user is `matched`.

**Reveal** (T − 24h): `event_status: "revealed"` → the app asks "Are you coming?" →
`POST /events/{id}/respond` → with `coming: true` the next `GET /me/events` carries `cafe`,
`group_number` and `members`.

**After** (T + 2h): `event_status: "completed"` → `PUT /events/{id}/rating` →
`POST /reports` with `reported_user_id` if a groupmate misbehaved. Groupmates stay visible via
`GET /users/{id}` for confirmed members.

## 7. Things the app must NOT do

- Use `supabase.from()` or `supabase.rpc()` as a data path — blocked server-side.
- Ship or use a service-role / `sb_secret_` key.
- Put user ids (`user_id`, `reporter_id`, …) in request bodies — they are rejected.
- Call the API over plain `http://` in production, or store the access token anywhere but the
  Supabase session storage.
- Treat a JWT claim as proof of admin rights — only `GET /me` → `isAdmin` (server-checked
  again on every admin call) counts.

## 8. OpenAPI

The running API serves Swagger UI at `/docs`, ReDoc at `/redoc` and the schema at
`/openapi.json` — the request/response models above are generated from the same code.
