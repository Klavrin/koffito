import { createContext, type PropsWithChildren, useCallback, useContext } from "react";

import {
  createEvent as createEventRequest,
  fetchMyEvents,
  fetchOpenEvents,
  joinEvent as joinEventRequest,
  leaveEvent,
  type NewEvent,
} from "@/api";
import { useResource } from "@/hooks/use-resource";
import type { CoffeeEvent } from "@/types/koffito";

import { useSession } from "./session";

type EventsContextValue = {
  /** Coffee talks the user joined, past and upcoming. */
  events: CoffeeEvent[];
  /** Upcoming coffee talks that can still be joined. */
  openEvents: CoffeeEvent[];
  loading: boolean;
  error?: unknown;
  refresh: () => Promise<void>;
  getEvent: (id?: string) => CoffeeEvent | undefined;
  joinEvent: (id: string) => Promise<void>;
  cancelEvent: (id: string) => Promise<void>;
  /** Admins only. Resolves to the new event id. */
  createEvent: (event: NewEvent) => Promise<string>;
};

const EventsContext = createContext<EventsContextValue | null>(null);

const loadEvents = async () => {
  const [mine, open] = await Promise.all([fetchMyEvents(), fetchOpenEvents()]);
  return { mine, open };
};

const none: CoffeeEvent[] = [];

/** Loads the signed-in user's coffee talks once and shares them (plus join/cancel actions) across screens. */
export function EventsProvider({ children }: PropsWithChildren) {
  const { session } = useSession();
  const { data, loading, error, refresh } = useResource(loadEvents, !!session);

  const events = data?.mine ?? none;
  const openEvents = data?.open ?? none;

  const joinEvent = useCallback(
    async (id: string) => {
      await joinEventRequest(id);
      await refresh();
    },
    [refresh],
  );

  const cancelEvent = useCallback(
    async (id: string) => {
      await leaveEvent(id);
      await refresh();
    },
    [refresh],
  );

  const createEvent = useCallback(
    async (event: NewEvent) => {
      const id = await createEventRequest(event);
      await refresh();
      return id;
    },
    [refresh],
  );

  return (
    <EventsContext.Provider
      value={{
        events,
        openEvents,
        loading,
        error,
        refresh,
        getEvent: (id) => events.find((event) => event.id === id) ?? openEvents.find((event) => event.id === id),
        joinEvent,
        cancelEvent,
        createEvent,
      }}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const value = useContext(EventsContext);

  if (!value) {
    throw new Error("useEvents must be used within an EventsProvider");
  }

  return value;
}
