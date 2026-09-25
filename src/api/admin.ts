import { api } from "@/lib/api";
import type {
  AdminEvent,
  AdminEventCreate,
  AdminEventDetail,
  AdminVenue,
  AdminVenueInput,
  Paginated,
} from "@/types/api";

const PAGE = 100;
const MAX_PAGES = 10;

/** Admins only: every coffee talk, newest first, with participant and group counts. */
export async function fetchAdminEvents(): Promise<AdminEvent[]> {
  const events: AdminEvent[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const { items, total } = await api.get<Paginated<AdminEvent>>(
      `/admin/events?limit=${PAGE}&offset=${page * PAGE}`,
    );
    events.push(...items);
    if (items.length === 0 || events.length >= total) break;
  }

  return events;
}

/** Admins only: participants, groups with cafés and answers, ratings and reports. */
export function fetchAdminEvent(eventId: string) {
  return api.get<AdminEventDetail>(`/admin/events/${eventId}`);
}

/** Admins only: opens a coffee talk from its date and time. Everything else is derived. */
export function createEvent(date: Date) {
  const body: AdminEventCreate = { event_at: date.toISOString() };
  return api.post<AdminEvent>("/admin/events", body);
}

/** Admins only: cancels a coffee talk that hasn't finished. */
export function cancelAdminEvent(eventId: string) {
  return api.post<AdminEventDetail>(`/admin/events/${eventId}/cancel`);
}

/** Admins only: every café, including deactivated ones, by name. */
export async function fetchAdminVenues(): Promise<AdminVenue[]> {
  const rows = await api.get<AdminVenue[]>("/admin/venues?include_inactive=true");
  return rows.sort((a, b) => a.name.localeCompare(b.name));
}

export function createVenue(input: AdminVenueInput) {
  return api.post<AdminVenue>("/admin/venues", input);
}

export function updateVenue(venueId: string, input: AdminVenueInput) {
  return api.patch<AdminVenue>(`/admin/venues/${venueId}`, input);
}

/** Deactivated cafés get no new groups and don't count towards capacity. */
export function setVenueActive(venueId: string, active: boolean) {
  return api.patch<AdminVenue>(`/admin/venues/${venueId}`, { is_active: active });
}
