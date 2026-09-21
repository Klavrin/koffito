import type { CoffeeEvent } from "@/types/koffito";

import { cafes } from "./cafes";
import { users } from "./users";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Dates are relative to "now" so the mock data always has upcoming and past events. */
const fromNow = (ms: number) => new Date(Date.now() + ms);

export const events: CoffeeEvent[] = [
  {
    id: "e1",
    cafe: cafes[0],
    date: fromNow(2 * DAY),
    participants: [users[0], users[1], users[2]],
    maxParticipants: 4,
    status: "confirmed",
    locationHidden: true,
    joined: true,
  },
  {
    id: "e2",
    cafe: cafes[1],
    date: fromNow(22 * HOUR + 4 * 60 * 1000),
    participants: [users[3], users[4]],
    maxParticipants: 3,
    status: "confirmed",
    joined: true,
    locationHidden: true,
  },
  {
    id: "e3",
    cafe: cafes[2],
    date: fromNow(6 * DAY),
    participants: [users[5]],
    maxParticipants: 5,
    status: "pending",
    locationHidden: true,
    joined: true,
  },
  {
    id: "e4",
    cafe: cafes[3],
    date: fromNow(-5 * DAY),
    participants: [users[0], users[4], users[5], users[1]],
    maxParticipants: 4,
    status: "completed",
    joined: true,
  },
  {
    id: "e5",
    cafe: cafes[2],
    date: fromNow(1 * DAY + 3 * HOUR),
    participants: [users[2], users[3]],
    maxParticipants: 4,
    status: "confirmed",
    locationHidden: true,
    joined: false,
  },
  {
    id: "e6",
    cafe: cafes[3],
    date: fromNow(3 * DAY),
    participants: [users[1]],
    maxParticipants: 3,
    status: "confirmed",
    locationHidden: true,
    joined: false,
  },
  {
    id: "e7",
    cafe: cafes[0],
    date: fromNow(4 * DAY + 2 * HOUR),
    participants: [users[4], users[5], users[0]],
    maxParticipants: 5,
    status: "confirmed",
    locationHidden: true,
    joined: false,
  },
];

export const isUpcoming = (event: CoffeeEvent) =>
  event.date.getTime() > Date.now() && event.status !== "cancelled" && event.status !== "completed";

/** How long before the meetup a surprise café is revealed. */
const REVEAL_BEFORE_MS = HOUR;

export const getRevealTime = (event: CoffeeEvent) => new Date(event.date.getTime() - REVEAL_BEFORE_MS);

/** Locked cafés stay hidden until shortly before an upcoming meetup. */
export const isLocationHidden = (event: CoffeeEvent) =>
  !!event.locationHidden && isUpcoming(event) && getRevealTime(event).getTime() > Date.now();

/** Café name to show; the real one only after the reveal. */
export const getCafeLabel = (event: CoffeeEvent) => (isLocationHidden(event) ? "Café locked" : event.cafe.name);

/** Who is coming stays hidden until the reveal, same as the café. */
export const formatAttendance = (event: CoffeeEvent) => {
  if (isLocationHidden(event)) return "Who's coming is a surprise";
  const count = event.participants.length;
  return `${count} ${count === 1 ? "person" : "people"} going`;
};
