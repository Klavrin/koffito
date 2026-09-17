const DAY_MS = 24 * 60 * 60 * 1000;

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const monthFormatter = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

/** e.g. "14 Sept 2026, 20:00" */
export const formatDateTime = (date: Date) => `${dateFormatter.format(date)}, ${timeFormatter.format(date)}`;

/** e.g. "14 Sept 2026" */
export const formatDate = (date: Date) => dateFormatter.format(date);

/** e.g. "20:00" */
export const formatTime = (date: Date) => timeFormatter.format(date);

/** e.g. "September 2026" */
export const formatMonth = (date: Date) => monthFormatter.format(date);

export const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/** Stable key for a calendar day, e.g. "2026-9-14". */
export const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

/** Friendly distance to a date: "today", "tomorrow", "in 2 days", "3 days ago". */
export function formatRelativeDay(date: Date, now = new Date()) {
  const days = Math.round((startOfDay(date).getTime() - startOfDay(now).getTime()) / DAY_MS);

  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

/** "22:04:27" style countdown; clamps at zero. */
export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const parts = [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60];
  return parts.map((part) => String(part).padStart(2, "0")).join(":");
}
