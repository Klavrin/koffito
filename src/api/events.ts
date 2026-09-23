import { supabase } from "@/lib/supabase";
import type { Cafe, CoffeeEvent } from "@/types/koffito";

import { toCafe, toMyEvent, toOpenEvent, type VenueCard, venueRowToCafe } from "./mappers";

/** Coffee talks the user joined (past and upcoming), with café and guests once revealed. */
export async function fetchMyEvents(): Promise<CoffeeEvent[]> {
  const { data, error } = await supabase.rpc("get_my_events");
  if (error) throw error;
  return data.map(toMyEvent);
}

/** Upcoming coffee talks anyone can still join. */
export async function fetchOpenEvents(): Promise<CoffeeEvent[]> {
  const { data, error } = await supabase.rpc("get_open_events");
  if (error) throw error;
  return data.map(toOpenEvent);
}

export async function joinEvent(eventId: string) {
  const { error } = await supabase.rpc("join_event", { p_event_id: eventId });
  if (error) throw error;
}

export async function leaveEvent(eventId: string) {
  const { error } = await supabase.rpc("leave_event", { p_event_id: eventId });
  if (error) throw error;
}

export type NewEvent = {
  venueId: string;
  date: Date;
  groupSize: number;
  locationHidden: boolean;
};

/** Admins only: opens a new coffee talk. Returns the new event id. */
export async function createEvent(event: NewEvent) {
  const { data, error } = await supabase.rpc("create_event", {
    p_event_at: event.date.toISOString(),
    p_default_venue_id: event.venueId,
    p_target_group_size: event.groupSize,
    p_location_hidden: event.locationHidden,
  });
  if (error) throw error;
  return data;
}

/** Saves (or replaces) the signed-in user's rating for a coffee talk they attended. */
export async function rateEvent(eventId: string, rating: number, comment: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("not_authenticated");

  // Not an upsert: PostgREST would also `SET event_id, user_id`, which users have no grant for.
  const updated = await supabase
    .from("event_ratings")
    .update({ rating, comment })
    .eq("event_id", eventId)
    .eq("user_id", auth.user.id)
    .select("id");
  if (updated.error) throw updated.error;

  if (updated.data.length === 0) {
    const { error } = await supabase.from("event_ratings").insert({ event_id: eventId, user_id: auth.user.id, rating, comment });
    if (error) throw error;
  }
}

/** One café, when the user is allowed to see it (revealed talk or admin). */
export async function fetchVenue(venueId: string): Promise<Cafe | undefined> {
  const { data, error } = await supabase.rpc("venue_card", { p_venue_id: venueId });
  if (error) throw error;
  return data ? toCafe(data as unknown as VenueCard) : undefined;
}

/** Cafés the user already had a coffee talk at, most recent first. */
export async function fetchVisitedVenues(): Promise<Cafe[]> {
  const { data, error } = await supabase.rpc("get_my_visited_venues");
  if (error) throw error;
  return (data as unknown as VenueCard[]).map(toCafe);
}

/** Admins only: every active café, for picking where a coffee talk happens. */
export async function fetchVenues(): Promise<Cafe[]> {
  const { data, error } = await supabase.from("venues").select("*").eq("is_active", true).order("name");
  if (error) throw error;
  return data.map(venueRowToCafe);
}
