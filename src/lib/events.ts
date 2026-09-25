import type { CoffeeEvent } from "@/types/koffito";

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

/** Group size is a fixed rule, shown read-only to admins. */
export const GROUP_SIZE = { min: 3, max: 5 } as const;

/**
 * Every moment of a coffee talk follows from its start time T. The server derives the same
 * values; the app only needs them to preview a new event before it's created.
 */
export function eventTimes(date: Date) {
  const t = date.getTime();
  return {
    registrationClosesAt: new Date(t - 24 * HOUR_MS - 5 * MINUTE_MS),
    revealAt: new Date(t - 24 * HOUR_MS),
    completesAt: new Date(t + 2 * HOUR_MS),
  };
}

/** Still ahead: the user can act on it (join, wait, reveal, go). */
export const isUpcoming = (event: CoffeeEvent) =>
  event.status === "open" || event.status === "closed" || event.status === "matched" || event.status === "revealed";

/** Listed in "Find coffee talk": open and registration not closed yet. */
export const isJoinable = (event: CoffeeEvent, now = Date.now()) =>
  event.status === "open" && event.registrationClosesAt.getTime() > now;

/**
 * The single source of truth for how a coffee talk looks. Every screen switches on this, so the
 * wording and actions stay identical everywhere.
 *
 *   available   open, not joined yet              → Join
 *   full        open, not joined, capacity reached → "Event full"
 *   joined      open, joined                       → "You're in", Leave
 *   preparing   closed or matched                  → "Your group is being prepared"
 *   ready       revealed, not answered             → "Your group is ready", Reveal
 *   confirmed   revealed, said yes                 → café, members, "Can't make it anymore"
 *   declined    said no                            → "You declined this coffee talk"
 *   missed      revealed, started, never answered
 *   rate        completed, went, not rated yet     → "Rate your coffee talk"
 *   rated       completed, went, rated
 *   over        completed, didn't go
 *   cancelled   by the admin, or `lowTurnout` when fewer than 3 people joined
 *   failed      matchmaking didn't work out
 */
export type EventPhase =
  | { kind: "available" }
  | { kind: "full" }
  | { kind: "joined" }
  | { kind: "preparing" }
  | { kind: "ready" }
  | { kind: "confirmed" }
  | { kind: "declined" }
  | { kind: "missed" }
  | { kind: "rate" }
  | { kind: "rated" }
  | { kind: "over" }
  | { kind: "cancelled"; lowTurnout: boolean }
  | { kind: "failed" };

export function getEventPhase(event: CoffeeEvent, now = Date.now()): EventPhase {
  const answer = event.participantStatus;

  switch (event.status) {
    case "cancelled":
      return { kind: "cancelled", lowTurnout: event.cancelReason === "not_enough_people" };
    case "failed":
      return { kind: "failed" };
    case "open":
      if (event.joined) return { kind: "joined" };
      return event.full ? { kind: "full" } : { kind: "available" };
    case "closed":
    case "matched":
      return { kind: "preparing" };
    case "revealed":
      if (answer === "declined") return { kind: "declined" };
      if (answer === "confirmed") return { kind: "confirmed" };
      return event.date.getTime() > now ? { kind: "ready" } : { kind: "missed" };
    case "completed":
      if (answer === "declined") return { kind: "declined" };
      if (answer !== "confirmed") return { kind: "over" };
      return event.review ? { kind: "rated" } : { kind: "rate" };
  }
}

/** Café and group are only shown once the user said "Yes, I'm coming". */
export const canSeeDetails = (phase: EventPhase) =>
  phase.kind === "confirmed" || phase.kind === "rate" || phase.kind === "rated";

/** "Can't make it anymore": confirmed, and the coffee talk hasn't started. */
export const canBackOut = (event: CoffeeEvent, now = Date.now()) =>
  getEventPhase(event, now).kind === "confirmed" && event.date.getTime() > now;

export type PhaseTone = "neutral" | "primary" | "success" | "warning" | "error";

/** Short badge for each phase. */
export const phaseBadge: Record<EventPhase["kind"], { label: string; tone: PhaseTone }> = {
  available: { label: "Open", tone: "primary" },
  full: { label: "Event full", tone: "neutral" },
  joined: { label: "You're in", tone: "success" },
  preparing: { label: "Registration closed", tone: "warning" },
  ready: { label: "Group ready", tone: "primary" },
  confirmed: { label: "Confirmed", tone: "success" },
  declined: { label: "Declined", tone: "neutral" },
  missed: { label: "Not answered", tone: "neutral" },
  rate: { label: "Rate it", tone: "primary" },
  rated: { label: "Coffee had", tone: "neutral" },
  over: { label: "Over", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "error" },
  failed: { label: "Didn't work out", tone: "error" },
};

/**
 * The sentence a phase shows in "My events" and on the details page. `formatWhen` renders the
 * reveal time (e.g. "26 Sept 2026, 18:00").
 */
export function phaseMessage(event: CoffeeEvent, formatWhen: (date: Date) => string, now = Date.now()) {
  const phase = getEventPhase(event, now);

  switch (phase.kind) {
    case "available":
      return "Group and location revealed 24h before.";
    case "full":
      return "Event full. Every seat is taken for this one.";
    case "joined":
      return `You're in. Your group will be revealed on ${formatWhen(event.revealAt)}.`;
    case "preparing":
      return "Registration closed. Your group is being prepared.";
    case "ready":
      return "Your group is ready.";
    case "confirmed":
      return "You're coming. See you there!";
    case "declined":
      return "You declined this coffee talk.";
    case "missed":
      return "This coffee talk started before you answered.";
    case "rate":
      return "Rate your coffee talk.";
    case "rated":
      return "Thanks for the review!";
    case "over":
      return "This coffee talk is over.";
    case "cancelled":
      return phase.lowTurnout
        ? "This coffee talk was cancelled because not enough people joined."
        : "This coffee talk was cancelled.";
    case "failed":
      return "We couldn't set up groups for this coffee talk. Sorry!";
  }
}

/** Members' answers, as the group sees them. */
export const memberStatusLabel = {
  joined: "Not confirmed yet",
  matched: "Not confirmed yet",
  confirmed: "Confirmed",
  declined: "Declined",
} as const;
