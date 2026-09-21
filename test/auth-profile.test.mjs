import assert from "node:assert/strict";
import test from "node:test";

import { profileFromUser } from "../src/lib/auth-profile.ts";

test("profileFromUser maps safe Supabase user metadata into a new Koffito profile", () => {
  const profile = profileFromUser({
    email: "ada@example.com",
    user_metadata: { first_name: "  Ada  ", role: "admin" },
  });

  assert.deepEqual(profile, {
    firstName: "Ada",
    email: "ada@example.com",
    survey: {},
    onboarded: false,
  });
});

test("profileFromUser falls back to the email prefix when first_name is missing", () => {
  const profile = profileFromUser({
    email: "grace.hopper@example.com",
    user_metadata: {},
  });

  assert.equal(profile.firstName, "grace.hopper");
});
