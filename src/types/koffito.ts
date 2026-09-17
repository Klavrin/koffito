import type { ImageSource } from "expo-image";

import type { Interest } from "@/constants/interests";

export type { Interest };

export type User = {
  id: string;
  name: string;
  age?: number;
  bio?: string;
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
