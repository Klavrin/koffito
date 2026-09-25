import type { ApiError } from "./api-client";

/** Same duck-typing as `isApiError`, kept local so this module has no runtime imports (Node tests). */
const isApiError = (error: unknown): error is ApiError =>
  !!error && typeof error === "object" && (error as { name?: unknown }).name === "ApiError";

/** Friendly wording for the Koffito API's error codes (docs/frontend-integration.md). */
const apiMessages: Record<string, string> = {
  // 401
  missing_token: "Please log in again.",
  invalid_token: "Please log in again.",
  token_expired: "Please log in again.",
  unknown_kid: "Please log in again.",
  not_authenticated: "Please log in again.",
  // 403
  admin_required: "Only admins can do that.",
  forbidden: "You're not allowed to do that.",
  // 404
  profile_not_found: "We couldn't find that profile.",
  settings_not_found: "We couldn't find your settings.",
  survey_not_found: "Finish your survey first.",
  event_not_found: "That coffee talk no longer exists.",
  venue_not_found: "That café isn't available.",
  report_not_found: "We couldn't find that report.",
  not_found: "We couldn't find that.",
  // 409
  survey_incomplete: "Finish your survey before joining a coffee talk.",
  event_not_open: "This coffee talk isn't open for joining anymore.",
  time_conflict: "You already have a coffee talk around that time.",
  registration_closed: "Registration for this coffee talk has closed.",
  event_full: "This coffee talk is already full.",
  nothing_to_cancel: "You're not in this coffee talk.",
  event_not_revealed: "Your group isn't revealed yet. Hold on a little longer.",
  event_started: "This coffee talk has already started.",
  not_in_group: "You're not in a group for this coffee talk.",
  already_responded: "You've already answered for this coffee talk.",
  event_not_completed: "You can rate this coffee talk once it's over.",
  not_attended: "You can only rate coffee talks you went to.",
  event_not_cancellable: "This coffee talk is already over.",
  // 422
  validation_error: "Some of that didn't look right. Check the form.",
  empty_update: "Nothing changed.",
  unknown_language: "Pick a language we support.",
  invalid_rating: "Pick a rating from 1 to 5.",
  event_in_the_past: "Pick a time in the future.",
  registration_window_passed: "Pick a time more than a day away, so people can still join.",
  constraint_violation: "Some of that didn't look right. Check the form.",
  invalid_reference: "Something that was referenced no longer exists.",
  invalid_value: "Some of that didn't look right. Check the form.",
  missing_field: "Something required is missing.",
  // network
  network_error: "We couldn't reach Koffito. Check your connection.",
};

const SERVER_TROUBLE = "Koffito is having trouble right now. Try again in a moment.";

/** Friendly wording for the messages Supabase Auth and the network layer produce. */
const messages: Record<string, string> = {
  "Invalid login credentials": "That email and password don't match.",
  "Email not confirmed": "Confirm your email first — check your inbox.",
  "User already registered": "There's already an account with that email.",
  "Failed to fetch": "We couldn't reach Koffito. Check your connection.",
  "Network request failed": "We couldn't reach Koffito. Check your connection.",
};

const FALLBACK = "Something went wrong. Let's try that again.";

/**
 * The message of whatever was thrown. Supabase's `{ data, error }` errors are
 * plain objects, not `Error` instances, so `instanceof` alone would miss them.
 */
export function errorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "";
}

const firstValidationMessage = (details: unknown) => {
  if (!Array.isArray(details)) return undefined;
  const first: unknown = details[0];
  if (first && typeof first === "object" && "msg" in first && typeof first.msg === "string") return first.msg;
  return undefined;
};

/** Turns any thrown value into a sentence that's safe to show in a toast. */
export function describeError(error: unknown, fallback = FALLBACK) {
  if (isApiError(error)) {
    if (error.code === "rate_limited") {
      return error.retryAfter
        ? `Too many requests. Try again in ${error.retryAfter} seconds.`
        : "Too many requests. Try again in a moment.";
    }
    if (error.code === "validation_error") {
      return firstValidationMessage(error.details) ?? apiMessages.validation_error;
    }
    const known = apiMessages[error.code];
    if (known) return known;
    if (error.status >= 500) return SERVER_TROUBLE;
  }

  const raw = errorMessage(error);
  if (!raw) return fallback;

  const known = Object.keys(messages).find((code) => raw.includes(code));
  if (known) return messages[known];

  // Unknown errors are the ones worth reading in full.
  if (typeof __DEV__ !== "undefined" && __DEV__) console.warn("Unhandled error", error);
  return fallback;
}
