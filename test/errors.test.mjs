import assert from "node:assert/strict";
import test from "node:test";

import { ApiError } from "../src/lib/api-client.ts";
import { describeError, errorMessage } from "../src/lib/errors.ts";

const FALLBACK = "Something went wrong. Let's try that again.";

test("errorMessage reads the message off plain objects, Errors and strings", () => {
  assert.equal(errorMessage({ message: "Invalid login credentials" }), "Invalid login credentials");
  assert.equal(errorMessage(new Error("boom")), "boom");
  assert.equal(errorMessage("plain"), "plain");
  assert.equal(errorMessage(undefined), "");
});

test("explains API errors by their code", () => {
  assert.equal(describeError(new ApiError(409, "event_full", "event full")), "This coffee talk is already full.");
  assert.equal(describeError(new ApiError(409, "survey_incomplete", "")), "Finish your survey before joining a coffee talk.");
  assert.equal(describeError(new ApiError(403, "admin_required", "Admins only")), "Only admins can do that.");
  assert.equal(describeError(new ApiError(409, "not_revealed_yet", "")), "The café isn't revealed yet — hold on a little longer.");
  assert.equal(describeError(new ApiError(409, "nothing_to_confirm", "")), "Nothing to confirm here — maybe you already did.");
  assert.equal(describeError(new ApiError(401, "token_expired", "")), "Please log in again.");
});

test("rate limits mention the wait when known", () => {
  assert.equal(describeError(new ApiError(429, "rate_limited", "", undefined, 30)), "Too many requests. Try again in 30 seconds.");
  assert.equal(describeError(new ApiError(429, "rate_limited", "")), "Too many requests. Try again in a moment.");
});

test("validation errors surface the first field message", () => {
  const details = [{ loc: ["body", "details"], msg: "String should have at least 10 characters", type: "string_too_short" }];
  assert.equal(describeError(new ApiError(422, "validation_error", "invalid", details)), "String should have at least 10 characters");
  assert.equal(describeError(new ApiError(422, "validation_error", "invalid")), "Some of that didn't look right. Check the form.");
});

test("unknown API errors fall back by status", () => {
  assert.equal(describeError(new ApiError(503, "brand_new_code", "")), "Koffito is having trouble right now. Try again in a moment.");
  assert.equal(describeError(new ApiError(409, "brand_new_code", "")), FALLBACK);
  assert.equal(describeError(new ApiError(0, "network_error", "Network request failed")), "We couldn't reach Koffito. Check your connection.");
});

test("recognises duck-typed API errors", () => {
  assert.equal(describeError({ name: "ApiError", status: 409, code: "event_full", message: "" }), "This coffee talk is already full.");
});

test("still understands Supabase auth errors, Error instances and strings", () => {
  assert.equal(describeError({ message: "Invalid login credentials", status: 400 }), "That email and password don't match.");
  assert.equal(describeError(new Error("Email not confirmed")), "Confirm your email first — check your inbox.");
  assert.equal(describeError("User already registered"), "There's already an account with that email.");
  assert.equal(describeError(new Error("Network request failed")), "We couldn't reach Koffito. Check your connection.");
});

test("falls back for anything unknown", () => {
  assert.equal(describeError({ message: "column x does not exist" }), FALLBACK);
  assert.equal(describeError(undefined, "nope"), "nope");
  assert.equal(describeError({}), FALLBACK);
});
