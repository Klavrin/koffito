import assert from "node:assert/strict";
import test from "node:test";

import { toMe, toMyEvent, toProfile, toProfileUpdate, toReport, toSettingsUpdate } from "../src/api/mappers.ts";

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
  reveal_at: "2026-09-26T06:00:00Z",
  status: "pending",
  participant_status: "joined",
  joined: true,
  blind: true,
  location_hidden: true,
  reveal_opened: false,
  max_participants: 4,
  cafe: null,
  participants: null,
  attended: null,
  attendance_note: null,
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

test("toMyEvent keeps the server's reveal, attendance and rating state", () => {
  const pending = toMyEvent(myEvent);
  assert.equal(pending.cafe, undefined);
  assert.deepEqual(pending.participants, []);
  assert.equal(pending.participantStatus, "joined");
  assert.equal(pending.revealOpened, false);
  assert.equal(pending.attendance, undefined);
  assert.equal(pending.review, undefined);
  assert.equal(pending.revealAt.toISOString(), "2026-09-26T06:00:00.000Z");

  const happened = toMyEvent({ ...myEvent, status: "completed", attended: true, my_rating: 5, my_comment: "great people" });
  assert.equal(happened.status, "completed");
  assert.equal(happened.attendance, "happened");
  assert.deepEqual(happened.review, { rating: 5, comment: "great people" });

  const missed = toMyEvent({ ...myEvent, attended: false, attendance_note: "nobody showed up" });
  assert.equal(missed.attendance, "missed");
  assert.equal(missed.attendanceNote, "nobody showed up");
  assert.equal(missed.review, undefined);
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
