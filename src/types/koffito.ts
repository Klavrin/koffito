import type { ImageSource } from "expo-image";

import type { Interest } from "@/constants/interests";

export type { Interest };

export type User = {
  id: string;
  name: string;
  age?: number;
  bio?: string;
  /** Emoji avatar; Koffito shows emojis rather than real photos of people. */
  emoji?: string;
  photo?: ImageSource | string | null;
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
  photo: string;
  address: string;
  website?: string;
  phone?: string;
  rating: number;
  /** Relative busyness (0-100) for each slot in `popularTimeLabels`. */
  popularTimes: number[];
};

export type CoffeeEvent = {
  id: string;
  cafe: Cafe;
  date: Date;
  participants: User[];
  maxParticipants: number;
  status: MeetupStatusType;
  /** Whether the signed-in user is part of this coffee talk. */
  joined: boolean;
  /** Blind coffee talks keep the café secret until shortly before the meetup. */
  locationHidden?: boolean;
};

export type ReportStatus = "open" | "reviewing" | "resolved";

export type Report = {
  id: string;
  reason: string;
  details: string;
  reportedBy: string;
  date: Date;
  status: ReportStatus;
};

export type SurveyAnswers = Record<string, string[]>;

export type Profile = {
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
};
