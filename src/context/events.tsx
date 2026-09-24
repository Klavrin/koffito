import { createContext, type PropsWithChildren, useCallback, useContext } from "react";

import {
  confirmEvent,
  createEvent as createEventRequest,
  fetchMyEvents,
  fetchOpenEvents,
  joinEvent as joinEventRequest,
  leaveEvent,
  type NewEvent,
  rateEvent,
  reportAttendance,
  revealEvent as revealEventRequest,
} from "@/api";
import { useResource } from "@/hooks/use-resource";
import { isApiError } from "@/lib/api";
import type { ConfirmStage } from "@/types/api";
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
  /** Admins only. Resolves to the new event id. */
  createEvent: (event: NewEvent) => Promise<string>;
  joinEvent: (id: string) => Promise<void>;
  leaveEvent: (id: string) => Promise<void>;
  cancelEvent: (id: string) => Promise<void>;
  /** Opens a café whose reveal time has passed. */
  revealEvent: (id: string) => Promise<void>;
  /** "I'll be there", at the 24h or 3h stage. */
  confirmPresence: (id: string, stage: ConfirmStage) => Promise<void>;
  /** Records whether a past coffee talk happened, with an optional note when it didn't. */
  confirmAttendance: (id: string, happened: boolean, note?: string) => Promise<void>;
  /** Stores the user's rating and comment for a coffee talk that happened. */
  reviewEvent: (id: string, review: Review) => Promise<void>;
};

const EventsContext = createContext<EventsContextValue | null>(null);

const none: CoffeeEvent[] = [];

const loadEvents = async () => {
  const [mine, open] = await Promise.all([fetchMyEvents(), fetchOpenEvents()]);
  const openById = new Map(open.map((event) => [event.id, event]));

  // A joined talk shows up in both lists; the "mine" row carries the café and guests. A talk the
  // user left still comes back as "mine", but the open row is the one that lets them re-join.
  const merged = mine.map((event) => (!event.joined && openById.get(event.id)) || event);
  const seen = new Set(merged.map((event) => event.id));
  return [...merged, ...open.filter((event) => !seen.has(event.id))];
};

/** Loads the user's coffee talks from the API; every action writes through and reloads. */
export function EventsProvider({ children }: PropsWithChildren) {
  const { session } = useSession();
  const { data, loading, error, refresh } = useResource(loadEvents, !!session);

  const events = data ?? none;

  /** Runs an action against the API, then reloads so the list reflects the server's state. */
  const act = useCallback(
    async (action: () => Promise<unknown>) => {
      await action();
      await refresh();
    },
    [refresh],
  );

  const joinEvent = useCallback((id: string) => act(() => joinEventRequest(id)), [act]);
  const cancelEvent = useCallback((id: string) => act(() => leaveEvent(id)), [act]);

  const createEvent = useCallback(
    async (event: NewEvent) => {
      const id = await createEventRequest(event);
      await refresh();
      return id;
    },
    [refresh],
  );

  const revealEvent = useCallback(
    async (id: string) => {
      try {
        await revealEventRequest(id);
      } catch (error) {
        // Reveal times are decided by the server, so make sure the list agrees with it.
        if (isApiError(error) && error.code === "not_revealed_yet") await refresh();
        throw error;
      }
      await refresh();
    },
    [refresh],
  );

  const confirmPresence = useCallback(
    async (id: string, stage: ConfirmStage) => {
      try {
        await confirmEvent(id, stage);
      } catch (error) {
        // Already confirmed (maybe on another device): the reload clears the prompt.
        if (isApiError(error) && error.code === "nothing_to_confirm") {
          await refresh();
          return;
        }
        throw error;
      }
      await refresh();
    },
    [refresh],
  );

  const confirmAttendance = useCallback(
    (id: string, happened: boolean, note?: string) => act(() => reportAttendance(id, happened, note)),
    [act],
  );

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
        createEvent,
        joinEvent,
        leaveEvent: cancelEvent,
        cancelEvent,
        revealEvent,
        confirmPresence,
        confirmAttendance,
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
