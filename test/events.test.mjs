import assert from "node:assert/strict";
import test from "node:test";

import {
  canBackOut,
  canSeeDetails,
  eventTimes,
  getEventPhase,
  isJoinable,
  isUpcoming,
  phaseMessage,
} from "../src/lib/events.ts";

const NOW = Date.UTC(2026, 8, 25, 12, 0, 0);
const hours = (n) => n * 60 * 60 * 1000;
const minutes = (n) => n * 60 * 1000;

const event = (overrides = {}) => {
  const date = new Date(NOW + hours(48));
  return {
    id: "e1",
    date,
    registrationClosesAt: new Date(date.getTime() - hours(24) - minutes(5)),
    revealAt: new Date(date.getTime() - hours(24)),
    completesAt: new Date(date.getTime() + hours(2)),
    status: "open",
    joined: false,
    members: [],
    ...overrides,
  };
};

const phase = (overrides) => getEventPhase(event(overrides), NOW).kind;
const when = (date) => date.toISOString();

test("eventTimes derives close, reveal and completion from the start time", () => {
  const start = new Date("2026-10-10T18:00:00Z");
  const times = eventTimes(start);
  assert.equal(times.registrationClosesAt.toISOString(), "2026-10-09T17:55:00.000Z");
  assert.equal(times.revealAt.toISOString(), "2026-10-09T18:00:00.000Z");
  assert.equal(times.completesAt.toISOString(), "2026-10-10T20:00:00.000Z");
});

test("open coffee talks: join, full, or already in", () => {
  assert.equal(phase({}), "available");
  assert.equal(phase({ full: true }), "full");
  assert.equal(phase({ joined: true, participantStatus: "joined", full: true }), "joined");
});

test("only open talks before the registration deadline can be joined", () => {
  assert.equal(isJoinable(event(), NOW), true);
  assert.equal(isJoinable(event({ registrationClosesAt: new Date(NOW - 1) }), NOW), false);
  assert.equal(isJoinable(event({ status: "closed" }), NOW), false);
});

test("closed and matched talks are being prepared; details stay locked", () => {
  for (const status of ["closed", "matched"]) {
    const kind = phase({ status, joined: true, participantStatus: status === "matched" ? "matched" : "joined" });
    assert.equal(kind, "preparing");
    assert.equal(canSeeDetails({ kind }), false);
  }
});

test("after the reveal: ready, then confirmed or declined", () => {
  const revealed = { status: "revealed", joined: true, date: new Date(NOW + hours(20)) };
  assert.equal(phase({ ...revealed, participantStatus: "matched" }), "ready");
  assert.equal(phase({ ...revealed, participantStatus: "confirmed" }), "confirmed");
  assert.equal(phase({ ...revealed, participantStatus: "declined" }), "declined");
  assert.equal(phase({ ...revealed, participantStatus: "matched", date: new Date(NOW - 1) }), "missed");

  assert.equal(canSeeDetails({ kind: "confirmed" }), true);
  assert.equal(canSeeDetails({ kind: "ready" }), false);
  assert.equal(canSeeDetails({ kind: "declined" }), false);
});

test("a confirmed user can back out until the coffee talk starts", () => {
  const confirmed = { status: "revealed", joined: true, participantStatus: "confirmed" };
  assert.equal(canBackOut(event({ ...confirmed, date: new Date(NOW + hours(1)) }), NOW), true);
  assert.equal(canBackOut(event({ ...confirmed, date: new Date(NOW - 1) }), NOW), false);
  assert.equal(canBackOut(event({ ...confirmed, participantStatus: "matched" }), NOW), false);
});

test("completed: rate if you went, otherwise it's just over", () => {
  const completed = { status: "completed", joined: true };
  assert.equal(phase({ ...completed, participantStatus: "confirmed" }), "rate");
  assert.equal(phase({ ...completed, participantStatus: "confirmed", review: { rating: 4, comment: "" } }), "rated");
  assert.equal(phase({ ...completed, participantStatus: "declined" }), "declined");
  assert.equal(phase({ ...completed, participantStatus: "matched" }), "over");
  assert.equal(canSeeDetails({ kind: "rate" }), true);
});

test("cancelled and failed talks explain why", () => {
  assert.deepEqual(getEventPhase(event({ status: "cancelled", cancelReason: "not_enough_people" }), NOW), {
    kind: "cancelled",
    lowTurnout: true,
  });
  assert.deepEqual(getEventPhase(event({ status: "cancelled", cancelReason: "admin" }), NOW), {
    kind: "cancelled",
    lowTurnout: false,
  });
  assert.equal(phase({ status: "failed", joined: true }), "failed");
});

test("upcoming vs past follows the server status", () => {
  for (const status of ["open", "closed", "matched", "revealed"]) assert.equal(isUpcoming(event({ status })), true);
  for (const status of ["completed", "failed", "cancelled"]) assert.equal(isUpcoming(event({ status })), false);
});

test("phase messages use the flow's wording", () => {
  const joined = event({ joined: true, participantStatus: "joined" });
  assert.equal(phaseMessage(joined, when, NOW), `You're in. Your group will be revealed on ${when(joined.revealAt)}.`);
  assert.equal(
    phaseMessage(event({ status: "closed", joined: true, participantStatus: "joined" }), when, NOW),
    "Registration closed. Your group is being prepared.",
  );
  assert.equal(
    phaseMessage(event({ status: "cancelled", cancelReason: "not_enough_people", joined: true }), when, NOW),
    "This coffee talk was cancelled because not enough people joined.",
  );
  assert.equal(
    phaseMessage(event({ status: "revealed", joined: true, participantStatus: "matched", date: new Date(NOW + hours(20)) }), when, NOW),
    "Your group is ready.",
  );
  assert.equal(
    phaseMessage(event({ status: "revealed", joined: true, participantStatus: "declined" }), when, NOW),
    "You declined this coffee talk.",
  );
  assert.equal(
    phaseMessage(event({ status: "completed", joined: true, participantStatus: "confirmed" }), when, NOW),
    "Rate your coffee talk.",
  );
});
