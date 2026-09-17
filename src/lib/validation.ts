/** Small form validators. Each returns an error message, or `undefined` when the value is fine. */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRequired(value: string, message = "This one is needed") {
  return value.trim() ? undefined : message;
}

export function validateEmail(value: string) {
  if (!value.trim()) return "We need your email";
  return EMAIL_PATTERN.test(value.trim()) ? undefined : "That doesn't look like an email";
}

export function validatePassword(value: string) {
  if (!value) return "Pick a password";
  return value.length >= 8 ? undefined : "Use at least 8 characters";
}

export function validatePasswordMatch(password: string, confirmation: string) {
  if (!confirmation) return "Type your password once more";
  return password === confirmation ? undefined : "Passwords don't match";
}

/** True when no field in the error map holds a message. */
export function isValid(errors: Record<string, string | undefined>) {
  return Object.values(errors).every((error) => !error);
}
