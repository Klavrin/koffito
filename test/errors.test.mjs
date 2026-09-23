import assert from "node:assert/strict";
import test from "node:test";

import { describeError, errorMessage } from "../src/lib/errors.ts";

test("reads the message off Supabase's plain error objects", () => {
  // supabase-js returns `{ data, error }` where `error` is not an Error instance.
  const postgrest = { code: "P0001", message: "survey_incomplete", details: null, hint: null };
  assert.equal(errorMessage(postgrest), "survey_incomplete");
  assert.equal(describeError(postgrest), "Finish your survey before joining a coffee talk.");
});

test("still understands Error instances and strings", () => {
  assert.equal(describeError(new Error("event_full")), "This coffee talk is already full.");
  assert.equal(describeError("not_admin"), "Only admins can do that.");
});

test("falls back for anything unknown", () => {
  assert.equal(describeError({ message: "column x does not exist" }), "Something went wrong. Let's try that again.");
  assert.equal(describeError(undefined, "nope"), "nope");
  assert.equal(describeError({}), "Something went wrong. Let's try that again.");
});
