import type { ImageSource } from "expo-image";

import type { Interest } from "@/constants/interests";
import type { CancelReason, EventStatus, ParticipantStatus } from "@/types/api";

export type { CancelReason, EventStatus, ParticipantStatus };

export type { Interest };

export type User = {
  id: string;
  name: string;
  age?: number;
  bio?: string;
  /** Emoji avatar; Koffito shows emojis rather than real photos of people. */
  emoji?: string;
  photo?: ImageSource | string | null;
  /** The same details the profile setup collects, so a profile renders in full. */
  gender?: string;
  occupation?: string;
  favoriteCoffee?: string;
  survey?: SurveyAnswers;
  interests: Interest[];
  location?: string;
  isOnline?: boolean;
};

export type Match = {
  id: string;
  user: User;
  sharedInterests: Interest[];
  /** e.g. "1.2 km away" */
  distance?: string;
};

export type MeetupStatusType = "pending" | "confirmed" | "completed" | "cancelled";

export type Meetup = {
  id: string;
  title?: string;
  participants: User[];
  place: string;
  address?: string;
  date: Date;
  status: MeetupStatusType;
};

export type Cafe = {
  id: string;
  name: string;
  description: string;
  /** Venues can be listed before they have a picture. */
  photo: string | null;
  address: string;
  website?: string;
  phone?: string;
  mapsUrl?: string;
  rating: number;
  /** Relative busyness (0-100) for each slot in `popularTimeLabels`. */
  popularTimes: number[];
};

/** Someone in the user's group, as a confirmed member sees them. */
export type GroupMember = {
  id: string;
  /** First name only. */
  name: string;
  emoji?: string;
  status: ParticipantStatus;
  /** Survey answers both people picked, as "question:answer" keys (e.g. "hobbies:hiking"). */
  sharedInterests: string[];
};

/**
 * A coffee talk as the app sees it. Everything time-based comes from the server: the admin
 * only picks `date`, the rest is derived (close T − 24h5m, reveal T − 24h, completed T + 2h)
 * and the statuses are moved by the server's scheduler.
 */
export type CoffeeEvent = {
  id: string;
  date: Date;
  registrationClosesAt: Date;
  revealAt: Date;
  completesAt: Date;
  status: EventStatus;
  /** Whether the signed-in user joined this coffee talk. */
  joined: boolean;
  /** The user's own state, for talks they joined. */
  participantStatus?: ParticipantStatus;
  cancelReason?: CancelReason;
  /** Open talks only: capacity (active cafés × 5) is reached. */
  full?: boolean;
  /** Only once revealed and the user said "Yes, I'm coming". */
  groupNumber?: number;
  cafe?: Cafe;
  members: GroupMember[];
  /** The user's own rating, after the coffee talk. */
  review?: { rating: number; comment: string };
};

export type ReportStatus = "open" | "reviewing" | "resolved";

export type ReportReason = "no-show" | "rude" | "unsafe" | "fake" | "other";

export type Report = {
  id: string;
  reason: ReportReason;
  details: string;
  reportedBy: string;
  date: Date;
  status: ReportStatus;
};

export type SurveyAnswers = Record<string, string[]>;

export type Profile = {
  /** Auth user id; missing only for the placeholder built before the profile row is loaded. */
  id?: string;
  firstName: string;
  lastName?: string;
  email?: string;
  /** Emoji avatar picked during onboarding. */
  avatar?: string;
  gender?: string;
  age?: string;
  occupation?: string;
  favoriteCoffee?: string;
  survey: SurveyAnswers;
  onboarded: boolean;
  isAdmin?: boolean;
};

export type ProfileStats = {
  coffeeTalks: number;
  cafesVisited: number;
  peopleMet: number;
};

export type Settings = {
  notifications: boolean;
  reminders: boolean;
};

/** Everything `GET /me` says about the signed-in user. */
export type Me = {
  profile: Profile;
  stats: ProfileStats;
  settings: Settings;
};
