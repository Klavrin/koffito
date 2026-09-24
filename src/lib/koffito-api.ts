/**
 * Typed endpoints of the Koffito API (FastAPI). Shapes mirror the backend's
 * responses one to one; `mappers.ts` turns them into app types.
 */

import { api } from "./api";
import type { ReportStatus, SurveyAnswers } from "@/types/koffito";

export type ApiStats = { coffeeTalks: number; cafesVisited: number; peopleMet: number };

export type ApiProfile = {
  id: string;
  email: string | null;
  firstName: string;
  avatar: string | null;
  gender: string | null;
  age: number | null;
  occupation: string | null;
  favoriteCoffee: string | null;
  languages: string[];
  survey: SurveyAnswers;
  onboarded: boolean;
  isAdmin: boolean;
  stats: ApiStats;
  settings: { notificationsEnabled: boolean; remindersEnabled: boolean };
};

export type ApiProfileUpdate = Partial<{
  firstName: string;
  avatar: string;
  gender: string;
  age: number;
  occupation: string;
  favoriteCoffee: string;
  languages: string[];
}>;

export type ApiCafe = {
  id: string;
  name: string;
  description: string | null;
  photo: string | null;
  address: string | null;
  website: string | null;
  phone: string | null;
  mapsUrl: string | null;
  rating: number | string | null;
  popularTimes: number[] | null;
};

export type ApiPerson = {
  id: string;
  name: string;
  emoji: string | null;
  gender: string | null;
  age: number | null;
  languages: string[];
  occupation: string | null;
  favoriteCoffee: string | null;
  survey: SurveyAnswers;
};

export type ApiPublicProfile = Omit<ApiPerson, "emoji"> & { avatar: string | null; stats: ApiStats };

export type ApiEvent = {
  id: string;
  eventAt: string;
  revealAt: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  participantStatus: string | null;
  joined: boolean;
  blind: boolean;
  locationHidden: boolean;
  revealOpened: boolean;
  maxParticipants: number;
  spotsLeft: number | null;
  cafe: ApiCafe | null;
  participants: ApiPerson[];
  attended: boolean | null;
  attendanceNote: string | null;
  myRating: number | null;
  myComment: string | null;
};

export type ApiReport = {
  id: string;
  reason: string;
  reasonLabel: string;
  details: string;
  status: ReportStatus;
  reportedBy: string;
  reportedUserName: string | null;
  eventId: string | null;
  createdAt: string;
};

export type ApiEventCreate = {
  eventAt: string;
  targetGroupSize: number;
  defaultVenueId?: string;
  locationHidden: boolean;
};

export const koffitoApi = {
  me: () => api.get<ApiProfile>("/me"),
  updateMe: (changes: ApiProfileUpdate) => api.patch<ApiProfile>("/me", changes),
  saveSurvey: (answers: SurveyAnswers) => api.put<ApiProfile>("/me/survey", { answers }),
  updateSettings: (changes: Partial<ApiProfile["settings"]>) =>
    api.patch<ApiProfile>("/me/settings", changes),

  myEvents: () => api.get<ApiEvent[]>("/events"),
  openEvents: () => api.get<ApiEvent[]>("/events/open"),
  event: (id: string) => api.get<ApiEvent>(`/events/${id}`),
  joinEvent: (id: string) => api.post<ApiEvent>(`/events/${id}/join`),
  leaveEvent: (id: string) => api.post<ApiEvent>(`/events/${id}/leave`),
  confirmEvent: (id: string, stage: "24h" | "3h") =>
    api.post<ApiEvent>(`/events/${id}/confirm`, { stage }),
  revealEvent: (id: string) => api.post<ApiEvent>(`/events/${id}/reveal`),
  reportAttendance: (id: string, happened: boolean, note?: string) =>
    api.post<ApiEvent>(`/events/${id}/attendance`, { happened, note }),
  rateEvent: (id: string, rating: number, comment: string) =>
    api.put<ApiEvent>(`/events/${id}/rating`, { rating, comment }),

  visitedVenues: () => api.get<ApiCafe[]>("/venues/visited"),
  person: (id: string) => api.get<ApiPublicProfile>(`/people/${id}`),

  createReport: (report: { reason: string; details: string; eventId?: string }) =>
    api.post<{ id: string; status: ReportStatus }>("/reports", report),

  admin: {
    reports: () => api.get<ApiReport[]>("/admin/reports"),
    updateReport: (id: string, status: ReportStatus) =>
      api.patch<ApiReport>(`/admin/reports/${id}`, { status }),
    venues: () => api.get<ApiCafe[]>("/admin/venues"),
    createEvent: (event: ApiEventCreate) => api.post<{ id: string }>("/admin/events", event),
  },
};
