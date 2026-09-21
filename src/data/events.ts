import type { CoffeeEvent } from "@/types/koffito";

import { cafes } from "./cafes";
import { users } from "./users";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/**
 * Dates are relative to "now" so the mock data always has upcoming and past
 * events. Coffee talks always start on the hour, never at :37.
 */
const atHour = (dayOffset: number, hour: number) => {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 0, 0, 0);
  return date;
};

export const events: CoffeeEvent[] = [
  {
    id: "e1",
    cafe: cafes[0],
    date: atHour(2, 18),
    participants: [users[0], users[1], users[2]],
    maxParticipants: 4,
    status: "confirmed",
    locationHidden: true,
    joined: true,
  },
  {
    id: "e2",
    cafe: cafes[1],
    date: atHour(1, 10),
    participants: [users[3], users[4]],
    maxParticipants: 3,
    status: "confirmed",
    joined: true,
    locationHidden: true,
  },
  {
    id: "e3",
    cafe: cafes[2],
    date: atHour(6, 17),
    participants: [users[5]],
    maxParticipants: 5,
    status: "pending",
    locationHidden: true,
    joined: true,
  },
  {
    id: "e4",
    cafe: cafes[3],
    date: atHour(-5, 16),
    participants: [users[0], users[4], users[5], users[1]],
    maxParticipants: 4,
    status: "completed",
    joined: true,
  },
  {
    id: "e5",
    cafe: cafes[4],
    date: atHour(1, 19),
    participants: [users[2], users[3]],
    maxParticipants: 4,
    status: "confirmed",
    locationHidden: true,
    joined: false,
  },
  {
    id: "e6",
    cafe: cafes[5],
    date: atHour(3, 11),
    participants: [users[1]],
    maxParticipants: 3,
    status: "confirmed",
    locationHidden: true,
    joined: false,
  },
  {
    id: "e7",
    cafe: cafes[9],
    date: atHour(4, 15),
    participants: [users[4], users[5], users[0]],
    maxParticipants: 5,
    status: "confirmed",
    locationHidden: true,
    joined: false,
  },
];

export const isUpcoming = (event: CoffeeEvent) =>
  event.date.getTime() > Date.now() && event.status !== "cancelled" && event.status !== "completed";

/** How long before the meetup a locked café is revealed. */
const REVEAL_BEFORE_MS = DAY;

export const getRevealTime = (event: CoffeeEvent) => new Date(event.date.getTime() - REVEAL_BEFORE_MS);

/** Locked cafés stay hidden until shortly before an upcoming meetup. */
export const isLocationHidden = (event: CoffeeEvent) =>
  !!event.locationHidden && isUpcoming(event) && getRevealTime(event).getTime() > Date.now();

/** Café name to show; the real one only after the reveal. */
export const getCafeLabel = (event: CoffeeEvent) => (isLocationHidden(event) ? "Café locked" : event.cafe.name);

/** Coffee talks a person has actually had, with the cafés and people they met. */
export const getPersonStats = (events: CoffeeEvent[], userId: string) => {
  const attended = events.filter(
    (event) => event.status === "completed" && event.participants.some((person) => person.id === userId),
  );
  const cafes = new Set(attended.map((event) => event.cafe.id));
  const met = new Set(
    attended.flatMap((event) => event.participants.map((person) => person.id)).filter((id) => id !== userId),
  );

  return { coffeeTalks: attended.length, cafesVisited: cafes.size, peopleMet: met.size };
};

/** Who is coming stays hidden until the reveal, same as the café. */
export const formatAttendance = (event: CoffeeEvent) => {
  if (isLocationHidden(event)) return "Who's coming is a surprise";
  const count = event.participants.length;
  return `${count} ${count === 1 ? "person" : "people"} going`;
};
