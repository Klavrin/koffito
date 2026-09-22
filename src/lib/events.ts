import type { CoffeeEvent, User } from "@/types/koffito";

export const isUpcoming = (event: CoffeeEvent) =>
  event.date.getTime() > Date.now() && event.status !== "cancelled" && event.status !== "completed";

/** The meetup already happened (and wasn't cancelled), so the café can be rated. */
export const hasHappened = (event: CoffeeEvent) =>
  event.joined && event.status !== "cancelled" && event.date.getTime() <= Date.now();

/** Surprise cafés stay hidden until the reveal; the API leaves `cafe` empty until then. */
export const isLocationHidden = (event: CoffeeEvent) => !event.cafe;

/** Seats still free; open events report this directly, joined ones derive it from the group. */
export const getSpotsLeft = (event: CoffeeEvent) =>
  event.spotsLeft ?? Math.max(event.maxParticipants - event.participants.length, 0);

/** Maps people to the shape `AvatarGroup` expects. */
export const toAvatarPeople = (people: User[]) =>
  people.map((person) => ({ name: person.name, source: person.photo, emoji: person.emoji }));

/** Everyone the user has shared a revealed coffee talk with, most recent first and without duplicates. */
export function peopleMet(events: CoffeeEvent[]) {
  const seen = new Map<string, User>();

  for (const event of [...events].sort((a, b) => b.date.getTime() - a.date.getTime())) {
    if (event.status === "cancelled") continue;
    for (const person of event.participants) {
      if (!seen.has(person.id)) seen.set(person.id, person);
    }
  }

  return [...seen.values()];
}

/** People going, counting the user's own seat (the API lists only the other guests). */
export const goingCount = (event: CoffeeEvent) =>
  event.participants.length + (event.joined && event.status !== "cancelled" ? 1 : 0);

/** When a still-hidden café will be revealed, if that moment is known and hasn't passed. */
export const getPendingReveal = (event: CoffeeEvent) =>
  event.revealAt && event.revealAt.getTime() > Date.now() ? event.revealAt : undefined;
