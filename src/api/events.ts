import { api } from "@/lib/api";
import type { MyEventResponse, OpenEventResponse, RatingBody, RatingResponse, RespondBody, VenueCard } from "@/types/api";
import type { Cafe, CoffeeEvent } from "@/types/koffito";

import { toCafe, toMyEvent, toOpenEvent } from "./mappers";

/** Coffee talks the user joined, in every state; café and group only once revealed and confirmed. */
export async function fetchMyEvents(): Promise<CoffeeEvent[]> {
  const rows = await api.get<MyEventResponse[]>("/me/events");
  return rows.map(toMyEvent);
}

/** Coffee talks still open for joining: date and time only. */
export async function fetchOpenEvents(): Promise<CoffeeEvent[]> {
  const rows = await api.get<OpenEventResponse[]>("/events");
  return rows.map(toOpenEvent);
}

/** Joins before registration closes. Joining twice is harmless. */
export function joinEvent(eventId: string) {
  return api.post(`/events/${eventId}/join`);
}

/** Leaves while registration is still open. */
export function leaveEvent(eventId: string) {
  return api.post(`/events/${eventId}/leave`);
}

/**
 * After the reveal: "Yes, I'm coming" (`true`) or "No, I can't make it" (`false`). A confirmed
 * user may still back out with `false` until the coffee talk starts.
 */
export function respondToEvent(eventId: string, coming: boolean) {
  const body: RespondBody = { coming };
  return api.post(`/events/${eventId}/respond`, body);
}

/** Saves (or replaces) the rating for a completed coffee talk the user went to. */
export function rateEvent(eventId: string, rating: number, comment?: string) {
  const body: RatingBody = { rating };
  if (comment) body.comment = comment;
  return api.put<RatingResponse>(`/events/${eventId}/rating`, body);
}

/** Cafés the user already had a coffee talk at, most recent first. */
export async function fetchVisitedVenues(): Promise<Cafe[]> {
  const cards = await api.get<VenueCard[]>("/me/venues");
  return cards.map(toCafe);
}

/**
 * One café the user has visited. The API has no single-venue endpoint for users, and this is
 * only reached from "Cafés you've visited", so the visited list always contains it.
 */
export async function fetchVenue(venueId: string): Promise<Cafe | undefined> {
  const visited = await fetchVisitedVenues();
  return visited.find((cafe) => cafe.id === venueId);
}
