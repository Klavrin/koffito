import type { CoffeeEvent } from "@/types/koffito";

export const isUpcoming = (event: CoffeeEvent) =>
  event.date.getTime() > Date.now() && event.status !== "cancelled" && event.status !== "completed";

/** When a locked café is revealed; the backend sets it 24h before the meetup. */
export const getRevealTime = (event: CoffeeEvent) => event.revealAt;

/**
 * The single source of truth for how a coffee talk is displayed. Every screen
 * switches on this instead of re-deriving dates, so the backend only has to
 * supply the fields below and the states stay identical.
 *
 *   mystery         blind coffee talk, reveal time not reached yet
 *   awaiting-reveal reveal time passed, the user has not opened it yet
 *   revealed        café is visible (never blind, or opened)
 *   past            the meetup is over: confirm, then review
 */
export type EventState =
  | { kind: "mystery"; revealAt: Date }
  | { kind: "awaiting-reveal" }
  | { kind: "revealed" }
  | { kind: "past"; needsConfirm: boolean; needsReview: boolean };

export const getEventState = (event: CoffeeEvent): EventState => {
  if (!isUpcoming(event)) {
    return {
      kind: "past",
      needsConfirm: event.joined && event.status === "completed" && !event.attendance,
      needsReview: event.joined && event.attendance === "happened" && !event.review,
    };
  }

  if (event.locationHidden && !event.revealOpened) {
    const revealAt = getRevealTime(event);
    return revealAt.getTime() > Date.now() ? { kind: "mystery", revealAt } : { kind: "awaiting-reveal" };
  }

  return { kind: "revealed" };
};

/** Locked cafés stay hidden until the reveal time passes and the user opens them. */
export const isLocationHidden = (event: CoffeeEvent) => {
  const state = getEventState(event);
  return state.kind === "mystery" || state.kind === "awaiting-reveal";
};

/** Café name to show; the real one only after the reveal. */
export const getCafeLabel = (event: CoffeeEvent) => {
  const state = getEventState(event);
  if (state.kind === "mystery") return "Café locked";
  if (state.kind === "awaiting-reveal") return "Café ready to open";
  return event.cafe.name;
};

/** Who is coming stays hidden until the reveal, same as the café. */
export const formatAttendance = (event: CoffeeEvent) => {
  if (isLocationHidden(event)) return "Who's coming is a surprise";
  const count = event.participants.length;
  const who = `${count} ${count === 1 ? "person" : "people"}`;
  return isUpcoming(event) ? `${who} going` : `${who} went`;
};

/**
 * Which confirmation the participant can give right now, if any:
 * 24h before the meetup, then again 3h before.
 */
export const getConfirmationStage = (event: CoffeeEvent): "24h" | "3h" | undefined => {
  if (!event.joined || !isUpcoming(event)) return undefined;
  const hoursLeft = (event.date.getTime() - Date.now()) / (60 * 60 * 1000);
  const status = event.participantStatus;
  if (hoursLeft <= 3 && status !== "confirmed_3h") return "3h";
  if (hoursLeft <= 24 && (status === "joined" || status === "matched")) return "24h";
  return undefined;
};
