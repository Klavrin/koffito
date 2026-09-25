import assert from "node:assert/strict";
import test from "node:test";

import { toMe, toMyEvent, toOpenEvent, toProfile, toProfileUpdate, toReport, toSettingsUpdate } from "../src/api/mappers.ts";

// The example payloads from docs/frontend-integration.md.
const me = {
  id: "66f7bb5d-6b1e-4d7a-8a23-2412e8e3826b",
  name: "Sergiu Gherasim",
  emoji: "☕",
  gender: "male",
  age: 30,
  languages: ["en", "ro"],
  occupation: "developer",
  favoriteCoffee: "flat white",
  survey: { hobbies: ["sports", "reading"] },
  stats: { coffeeTalks: 2, cafesVisited: 1, peopleMet: 5 },
  isAdmin: false,
  onboarded: true,
  settings: { notificationsEnabled: true, remindersEnabled: false },
};

const myEvent = {
  id: "cee809b6-ac52-4a29-9264-63083df8f479",
  event_at: "2026-09-27T06:00:00Z",
  registration_closes_at: "2026-09-26T05:55:00Z",
  reveal_at: "2026-09-26T06:00:00Z",
  completes_at: "2026-09-27T08:00:00Z",
  event_status: "open",
  participant_status: "joined",
  cancel_reason: null,
  group_number: null,
  cafe: null,
  members: null,
  my_rating: null,
  my_comment: null,
};

test("toProfile maps /me into the app's profile", () => {
  const profile = toProfile(me, "sergiu@example.com");

  assert.deepEqual(profile, {
    id: me.id,
    firstName: "Sergiu",
    lastName: "Gherasim",
    email: "sergiu@example.com",
    avatar: "☕",
    gender: "Male",
    age: "30",
    occupation: "developer",
    favoriteCoffee: "flat white",
    survey: { hobbies: ["sports", "reading"] },
    onboarded: true,
    isAdmin: false,
  });
});

test("toMe carries stats and settings along", () => {
  const result = toMe({ ...me, age: null, gender: null, survey: null });

  assert.equal(result.profile.age, undefined);
  assert.equal(result.profile.gender, undefined);
  assert.deepEqual(result.profile.survey, {});
  assert.deepEqual(result.stats, { coffeeTalks: 2, cafesVisited: 1, peopleMet: 5 });
  assert.deepEqual(result.settings, { notifications: true, reminders: false });
});

test("toMyEvent keeps the server's times and statuses, with no details while locked", () => {
  const joined = toMyEvent(myEvent);
  assert.equal(joined.joined, true);
  assert.equal(joined.status, "open");
  assert.equal(joined.participantStatus, "joined");
  assert.equal(joined.registrationClosesAt.toISOString(), "2026-09-26T05:55:00.000Z");
  assert.equal(joined.revealAt.toISOString(), "2026-09-26T06:00:00.000Z");
  assert.equal(joined.completesAt.toISOString(), "2026-09-27T08:00:00.000Z");
  assert.equal(joined.cafe, undefined);
  assert.deepEqual(joined.members, []);
  assert.equal(joined.review, undefined);

  const cancelled = toMyEvent({ ...myEvent, event_status: "cancelled", cancel_reason: "not_enough_people" });
  assert.equal(cancelled.cancelReason, "not_enough_people");
});

test("toMyEvent maps the café and group once revealed and confirmed", () => {
  const revealed = toMyEvent({
    ...myEvent,
    event_status: "completed",
    participant_status: "confirmed",
    group_number: 2,
    cafe: { id: "v1", name: "Tucano", description: "", photo: null, address: "Str. Ismail 33", website: null, phone: null, mapsUrl: "https://maps.example/t", rating: 4.5, popularTimes: [] },
    members: [{ id: "u2", name: "Gabi", emoji: null, status: "declined", sharedInterests: ["topics:music"] }],
    my_rating: 5,
    my_comment: "great people",
  });

  assert.equal(revealed.groupNumber, 2);
  assert.equal(revealed.cafe.name, "Tucano");
  assert.equal(revealed.cafe.mapsUrl, "https://maps.example/t");
  assert.deepEqual(revealed.members, [{ id: "u2", name: "Gabi", emoji: undefined, status: "declined", sharedInterests: ["topics:music"] }]);
  assert.deepEqual(revealed.review, { rating: 5, comment: "great people" });
});

test("toOpenEvent keeps only the time and whether it's full", () => {
  const open = toOpenEvent({
    id: "e1",
    event_at: "2026-09-27T06:00:00Z",
    registration_closes_at: "2026-09-26T05:55:00Z",
    reveal_at: "2026-09-26T06:00:00Z",
    full: true,
    joined: false,
  });

  assert.equal(open.status, "open");
  assert.equal(open.full, true);
  assert.equal(open.joined, false);
  assert.equal(open.cafe, undefined);
  assert.deepEqual(open.members, []);
  assert.equal(open.completesAt.toISOString(), "2026-09-27T08:00:00.000Z");
});

test("toProfileUpdate sends only what changed", () => {
  const current = toProfile(me);

  assert.deepEqual(toProfileUpdate({ firstName: "Sergiu", occupation: "developer" }, current), {});
  assert.deepEqual(toProfileUpdate({ firstName: "Ana" }, current), { display_name: "Ana Gherasim" });
  assert.deepEqual(toProfileUpdate({ avatar: undefined, gender: "Non-binary" }, current), {
    avatar_emoji: null,
    gender: "non_binary",
  });
  assert.deepEqual(toProfileUpdate({ survey: { hobbies: ["arts"] } }, current), {});
});

test("toProfileUpdate marks onboarding complete only once", () => {
  const fresh = toProfile({ ...me, onboarded: false });

  assert.deepEqual(toProfileUpdate({ onboarded: true }, fresh), { onboarded: true });
  assert.deepEqual(toProfileUpdate({ onboarded: true }, toProfile(me)), {});
});

test("toSettingsUpdate maps to the API's field names", () => {
  assert.deepEqual(toSettingsUpdate({ notifications: false }), { notifications_enabled: false });
  assert.deepEqual(toSettingsUpdate({ reminders: true }), { reminders_enabled: true });
});

test("toReport reads the admin report row", () => {
  const report = toReport({
    id: "r1",
    reason: "rude",
    details: "was rude to everyone at the table",
    status: "open",
    created_at: "2026-09-22T12:50:25Z",
    updated_at: "2026-09-22T12:50:25Z",
    event_id: null,
    reporter_id: "u1",
    reported_by: "",
    reported_user_id: null,
    reported_user_name: null,
    handled_by: null,
  });

  assert.equal(report.reportedBy, "Unknown");
  assert.equal(report.date.toISOString(), "2026-09-22T12:50:25.000Z");
  assert.equal(report.status, "open");
});
