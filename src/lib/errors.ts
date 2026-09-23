/** Friendly wording for the error codes raised by the database functions and Supabase Auth. */
const messages: Record<string, string> = {
  survey_incomplete: "Finish your survey before joining a coffee talk.",
  event_not_open: "This coffee talk isn't open for joining anymore.",
  time_conflict: "You already have a coffee talk around that time.",
  event_full: "This coffee talk is already full.",
  nothing_to_cancel: "There's nothing to cancel here.",
  not_admin: "Only admins can do that.",
  not_authenticated: "Please log in again.",
  event_in_the_past: "Pick a time in the future.",
  is_admin_is_read_only: "That field can't be changed.",
  "permission denied": "You're not allowed to do that.",
  "row-level security": "You're not allowed to do that.",
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

/** Turns any thrown value into a sentence that's safe to show in a toast. */
export function describeError(error: unknown, fallback = FALLBACK) {
  const raw = errorMessage(error);
  if (!raw) return fallback;

  const known = Object.keys(messages).find((code) => raw.includes(code));
  if (known) return messages[known];

  // Unknown errors are the ones worth reading in full (PostgREST puts the fix in `hint`).
  if (typeof __DEV__ !== "undefined" && __DEV__) console.warn("Unhandled error", error);
  return fallback;
}
