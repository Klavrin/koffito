import { api } from "@/lib/api";
import type {
  AdminEvent,
  AdminEventCreate,
  AdminVenue,
  AttendanceBody,
  ConfirmBody,
  ConfirmStage,
  MyEventResponse,
  OpenEventResponse,
  RatingBody,
  RatingResponse,
  VenueCard,
} from "@/types/api";
import type { Cafe, CoffeeEvent } from "@/types/koffito";

import { toCafe, toMyEvent, toOpenEvent, venueRowToCafe } from "./mappers";

/** Coffee talks the user joined (past and upcoming), with café and guests once revealed. */
export async function fetchMyEvents(): Promise<CoffeeEvent[]> {
  const rows = await api.get<MyEventResponse[]>("/me/events");
  return rows.map(toMyEvent);
}

/** Upcoming coffee talks anyone can still join. */
export async function fetchOpenEvents(): Promise<CoffeeEvent[]> {
  const rows = await api.get<OpenEventResponse[]>("/events");
  return rows.map(toOpenEvent);
}

export function joinEvent(eventId: string) {
  return api.post(`/events/${eventId}/join`);
}

export function leaveEvent(eventId: string) {
  return api.post(`/events/${eventId}/leave`);
}

/** Confirms the user is still coming, at the 24h or 3h reminder. */
export function confirmEvent(eventId: string, stage: ConfirmStage) {
  const body: ConfirmBody = { stage };
  return api.post(`/events/${eventId}/confirm`, body);
}

/** Records that the user opened the revealed café, so it stays open. */
export function revealEvent(eventId: string) {
  return api.post(`/events/${eventId}/reveal`);
}

/** After the meetup: did it happen? An optional note explains what went wrong. */
export function reportAttendance(eventId: string, happened: boolean, note?: string) {
  const body: AttendanceBody = { happened };
  if (note) body.note = note;
  return api.post(`/events/${eventId}/attendance`, body);
}

/** Saves (or replaces) the user's rating for a coffee talk they attended. */
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
 * One café the user has visited. The API has no single-venue endpoint for users
 * (TODO backend: `GET /venues/{id}`), and this is only reached from "Cafés you've visited",
 * so the visited list always contains it.
 */
export async function fetchVenue(venueId: string): Promise<Cafe | undefined> {
  const visited = await fetchVisitedVenues();
  return visited.find((cafe) => cafe.id === venueId);
}

/** Admins only: every active café, for picking where a coffee talk happens. */
export async function fetchVenues(): Promise<Cafe[]> {
  const rows = await api.get<AdminVenue[]>("/admin/venues");
  return rows.map(venueRowToCafe).sort((a, b) => a.name.localeCompare(b.name));
}

export type NewEvent = {
  venueId: string;
  date: Date;
  groupSize: number;
  locationHidden: boolean;
};

/** Admins only: opens a new coffee talk. Returns the new event id. */
export async function createEvent(event: NewEvent) {
  const body: AdminEventCreate = {
    event_at: event.date.toISOString(),
    target_group_size: event.groupSize,
    default_venue_id: event.venueId,
    location_hidden: event.locationHidden,
  };
  const created = await api.post<AdminEvent>("/admin/events", body);
  return created.id;
}
