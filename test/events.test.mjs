import assert from "node:assert/strict";
import test from "node:test";

import { getConfirmStage, getEventState } from "../src/lib/events.ts";

const NOW = Date.UTC(2026, 8, 25, 12, 0, 0);
const hours = (n) => n * 60 * 60 * 1000;

const event = (overrides = {}) => ({
  id: "e1",
  date: new Date(NOW + hours(20)),
  participants: [],
  maxParticipants: 4,
  status: "pending",
  joined: true,
  participantStatus: "joined",
  ...overrides,
});

test("getConfirmStage asks for the 24h confirmation a day before", () => {
  assert.equal(getConfirmStage(event({ date: new Date(NOW + hours(30)) }), NOW), undefined);
  assert.equal(getConfirmStage(event(), NOW), "24h");
  assert.equal(getConfirmStage(event({ participantStatus: "matched" }), NOW), "24h");
  assert.equal(getConfirmStage(event({ participantStatus: "confirmed_24h" }), NOW), undefined);
});

test("getConfirmStage asks for the 3h confirmation shortly before", () => {
  const soon = new Date(NOW + hours(2));
  assert.equal(getConfirmStage(event({ date: soon }), NOW), "3h");
  assert.equal(getConfirmStage(event({ date: soon, participantStatus: "confirmed_24h" }), NOW), "3h");
  assert.equal(getConfirmStage(event({ date: soon, participantStatus: "confirmed_3h" }), NOW), undefined);
});

test("getConfirmStage stays quiet for talks that are not the user's, over or cancelled", () => {
  assert.equal(getConfirmStage(event({ joined: false, participantStatus: undefined }), NOW), undefined);
  assert.equal(getConfirmStage(event({ date: new Date(NOW - hours(1)) }), NOW), undefined);
  assert.equal(getConfirmStage(event({ status: "cancelled" }), NOW), undefined);
  assert.equal(getConfirmStage(event({ status: "completed" }), NOW), undefined);
});

test("getEventState treats a missed coffee talk as settled", () => {
  const past = event({ date: new Date(Date.now() - hours(5)), status: "completed", attendance: "missed" });
  assert.deepEqual(getEventState(past), { kind: "past", needsConfirm: false, needsReview: false });

  const unconfirmed = event({ date: new Date(Date.now() - hours(5)), status: "completed" });
  assert.deepEqual(getEventState(unconfirmed), { kind: "past", needsConfirm: true, needsReview: false });
});
