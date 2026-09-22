import type { CoffeeEvent } from "@/types/koffito";

const DAY_MS = 24 * 60 * 60 * 1000;

export const isUpcoming = (event: CoffeeEvent) =>
  event.date.getTime() > Date.now() && event.status !== "cancelled" && event.status !== "completed";

/**
 * When the café gets revealed. The database sends `reveal_at` for joined coffee
 * talks; open ones fall back to its default of a day before the meetup.
 */
export const getRevealTime = (event: CoffeeEvent) => event.revealAt ?? new Date(event.date.getTime() - DAY_MS);

/**
 * The single source of truth for how a coffee talk is displayed. Every screen
 * switches on this instead of re-deriving dates, so the backend only has to
 * supply the fields below and the states stay identical.
 *
 *   mystery         blind coffee talk, reveal time not reached yet (or café not sent yet)
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
      needsConfirm: event.joined && !event.attendance,
      needsReview: event.joined && event.attendance === "happened" && !event.review,
    };
  }

  // Until the API sends the café there is nothing to open, so keep counting down.
  if (!event.cafe) {
    return { kind: "mystery", revealAt: getRevealTime(event) };
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
  return event.cafe?.name ?? "Café to be announced";
};

/** Seats still free; open events report this directly, joined ones derive it from the group. */
export const getSpotsLeft = (event: CoffeeEvent) =>
  event.spotsLeft ?? Math.max(event.maxParticipants - event.participants.length - (event.joined ? 1 : 0), 0);

/** Who is coming stays hidden until the reveal, same as the café. */
export const formatAttendance = (event: CoffeeEvent) => {
  if (isLocationHidden(event)) return "Who's coming is a surprise";
  const count = event.participants.length;
  const who = `${count} ${count === 1 ? "person" : "people"}`;
  return isUpcoming(event) ? `${who} going` : `${who} went`;
};
