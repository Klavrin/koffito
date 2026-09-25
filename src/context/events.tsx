import { createContext, type PropsWithChildren, useCallback, useContext } from "react";

import {
  fetchMyEvents,
  fetchOpenEvents,
  joinEvent as joinEventRequest,
  leaveEvent as leaveEventRequest,
  rateEvent,
  respondToEvent,
} from "@/api";
import { useResource } from "@/hooks/use-resource";
import type { CoffeeEvent } from "@/types/koffito";

import { useSession } from "./session";

type Review = { rating: number; comment: string };

type EventsContextValue = {
  /** Every coffee talk the user can see: the ones they joined plus the open ones. */
  events: CoffeeEvent[];
  loading: boolean;
  error?: unknown;
  refresh: () => Promise<void>;
  getEvent: (id?: string) => CoffeeEvent | undefined;
  joinEvent: (id: string) => Promise<void>;
  leaveEvent: (id: string) => Promise<void>;
  /** "Yes, I'm coming" / "No, I can't make it" after the reveal (also "Can't make it anymore"). */
  respond: (id: string, coming: boolean) => Promise<void>;
  /** Stores the user's rating and comment for a completed coffee talk. */
  reviewEvent: (id: string, review: Review) => Promise<void>;
};

const EventsContext = createContext<EventsContextValue | null>(null);

const none: CoffeeEvent[] = [];

const loadEvents = async () => {
  const [mine, open] = await Promise.all([fetchMyEvents(), fetchOpenEvents()]);
  // A joined open talk comes back in both lists; the "mine" row knows the user's status.
  const seen = new Set(mine.map((event) => event.id));
  return [...mine, ...open.filter((event) => !seen.has(event.id))];
};

/** Loads the user's coffee talks from the API; every action writes through and reloads. */
export function EventsProvider({ children }: PropsWithChildren) {
  const { session } = useSession();
  const { data, loading, error, refresh } = useResource(loadEvents, !!session);

  const events = data ?? none;

  /**
   * Runs an action against the API, then reloads so the list reflects the server's state. The
   * server also moves statuses on its own schedule, so a rejected action reloads too.
   */
  const act = useCallback(
    async (action: () => Promise<unknown>) => {
      try {
        await action();
      } finally {
        await refresh();
      }
    },
    [refresh],
  );

  const joinEvent = useCallback((id: string) => act(() => joinEventRequest(id)), [act]);
  const leaveEvent = useCallback((id: string) => act(() => leaveEventRequest(id)), [act]);
  const respond = useCallback((id: string, coming: boolean) => act(() => respondToEvent(id, coming)), [act]);
  const reviewEvent = useCallback(
    (id: string, review: Review) => act(() => rateEvent(id, review.rating, review.comment || undefined)),
    [act],
  );

  return (
    <EventsContext.Provider
      value={{
        events,
        loading,
        error,
        refresh,
        getEvent: (id) => events.find((event) => event.id === id),
        joinEvent,
        leaveEvent,
        respond,
        reviewEvent,
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
