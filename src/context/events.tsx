import { createContext, type PropsWithChildren, useCallback, useContext, useState } from "react";

import {
  createEvent as createEventRequest,
  fetchMyEvents,
  fetchOpenEvents,
  joinEvent as joinEventRequest,
  leaveEvent,
  type NewEvent,
  rateEvent,
} from "@/api";
import { useResource } from "@/hooks/use-resource";
import type { CoffeeEvent } from "@/types/koffito";

import { useSession } from "./session";

type Review = { rating: number; comment: string };

/**
 * What the user did on this device that the database does not store:
 * opening a revealed café, and saying a coffee talk fell through.
 */
type LocalEventState = Partial<Pick<CoffeeEvent, "revealOpened" | "attendance" | "review">>;

type EventsContextValue = {
  /** Every coffee talk the user can see: the ones they joined plus the open ones. */
  events: CoffeeEvent[];
  loading: boolean;
  error?: unknown;
  refresh: () => Promise<void>;
  getEvent: (id?: string) => CoffeeEvent | undefined;
  /** Admins only. Resolves to the new event id. */
  createEvent: (event: NewEvent) => Promise<string>;
  joinEvent: (id: string) => Promise<void>;
  leaveEvent: (id: string) => Promise<void>;
  cancelEvent: (id: string) => Promise<void>;
  /** Opens a café whose reveal time has passed. */
  revealEvent: (id: string) => void;
  /** Records whether a past coffee talk happened. */
  confirmAttendance: (id: string, happened: boolean) => void;
  /** Stores the user's review (in the database when it happened), or their note about one that fell through. */
  reviewEvent: (id: string, review: Review) => Promise<void>;
};

const EventsContext = createContext<EventsContextValue | null>(null);

const none: CoffeeEvent[] = [];

const loadEvents = async () => {
  const [mine, open] = await Promise.all([fetchMyEvents(), fetchOpenEvents()]);
  // A joined talk shows up in both lists; the "mine" row carries the café and guests.
  const seen = new Set(mine.map((event) => event.id));
  return [...mine, ...open.filter((event) => !seen.has(event.id))];
};

/** Loads the user's coffee talks from the database and layers on-device state over them. */
export function EventsProvider({ children }: PropsWithChildren) {
  const { session } = useSession();
  const { data, loading, error, refresh } = useResource(loadEvents, !!session);
  const [local, setLocal] = useState<Record<string, LocalEventState>>({});

  const patch = useCallback(
    (id: string, changes: LocalEventState) => setLocal((current) => ({ ...current, [id]: { ...current[id], ...changes } })),
    [],
  );

  const events = data ? data.map((event) => (local[event.id] ? { ...event, ...local[event.id] } : event)) : none;

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

  const reviewEvent = useCallback(
    async (id: string, review: Review) => {
      // Ratings live in the database; a missed coffee talk only gets a local note.
      if (review.rating > 0) await rateEvent(id, review.rating, review.comment);
      patch(id, { review });
      if (review.rating > 0) await refresh();
    },
    [patch, refresh],
  );

  return (
    <EventsContext.Provider
      value={{
        events,
        loading,
        error,
        refresh,
        getEvent: (id) => events.find((event) => event.id === id),
        createEvent,
        joinEvent,
        leaveEvent: cancelEvent,
        cancelEvent,
        revealEvent: (id) => patch(id, { revealOpened: true }),
        confirmAttendance: (id, happened) => patch(id, { attendance: happened ? "happened" : "missed" }),
        reviewEvent,
      }}
    >
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
