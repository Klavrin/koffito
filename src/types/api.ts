/**
 * Request and response shapes of the Koffito API (see docs/frontend-integration.md).
 * snake_case fields are exactly what goes over the wire; the cards (`ProfileCard`, `VenueCard`)
 * are camelCase because the API sends them that way.
 */

export type Gender = "female" | "male" | "non_binary" | "prefer_not_to_say";
export type Language = "ro" | "ru" | "en";
export type ParticipantStatus =
  | "joined"
  | "matched"
  | "confirmed_24h"
  | "confirmed_3h"
  | "declined"
  | "cancelled"
  | "no_show";
export type MyEventStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type EventStatus = "draft" | "open" | "matched" | "confirmed" | "completed" | "cancelled";
export type ConfirmStage = "24h" | "3h";
export type ReportReason = "no-show" | "rude" | "unsafe" | "fake" | "other";
export type ReportStatus = "open" | "reviewing" | "resolved";

export type SurveyData = Record<string, string[]>;

/** A person as the API shows them to groupmates. */
export type ProfileCard = {
  id: string;
  name: string;
  emoji: string | null;
  gender: Gender | null;
  age: number | null;
  languages: string[];
  occupation: string | null;
  favoriteCoffee: string | null;
  survey: SurveyData;
};

export type MeStats = { coffeeTalks: number; cafesVisited: number; peopleMet: number };

/** `GET /users/{id}` */
export type PublicProfile = ProfileCard & { stats: MeStats };

export type MeSettings = { notificationsEnabled: boolean; remindersEnabled: boolean };

/** `GET /me` */
export type MeResponse = ProfileCard & {
  stats: MeStats;
  isAdmin: boolean;
  onboarded: boolean;
  settings: MeSettings;
};

/** `PATCH /me` body. Partial: send only what changes. */
export type ProfilePatch = {
  display_name?: string;
  avatar_emoji?: string | null;
  avatar_url?: string | null;
  gender?: Gender | null;
  /** `YYYY-MM-DD`, 18+. */
  date_of_birth?: string | null;
  occupation?: string | null;
  favorite_coffee?: string | null;
  onboarded?: boolean;
};

/** `PATCH /me` response: the profile row. */
export type ProfileRow = {
  id: string;
  display_name: string;
  avatar_emoji: string | null;
  avatar_url: string | null;
  gender: Gender | null;
  date_of_birth: string | null;
  occupation: string | null;
  favorite_coffee: string | null;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
};

/** `PUT /me/languages` */
export type LanguagesBody = { languages: Language[] };
export type LanguagesResponse = { languages: Language[] };

/** `PATCH /me/settings` */
export type SettingsPatch = { notifications_enabled?: boolean; reminders_enabled?: boolean };
export type SettingsResponse = { notifications_enabled: boolean; reminders_enabled: boolean; updated_at: string };

/** `PUT /me/survey` */
export type SurveyBody = { survey_data: SurveyData; completed: boolean };
export type SurveyResponse = { survey_data: SurveyData; completed_at: string | null; completed: boolean };

/** A café card, as in `GET /me/venues` and `GET /me/events`. */
export type VenueCard = {
  id: string;
  name: string;
  description: string;
  photo: string | null;
  address: string;
  website: string | null;
  phone: string | null;
  mapsUrl: string | null;
  rating: number | null;
  popularTimes: number[];
};

/** `GET /me/events` item */
export type MyEventResponse = {
  id: string;
  event_at: string;
  reveal_at: string;
  status: MyEventStatus;
  participant_status: ParticipantStatus;
  joined: boolean;
  /** The café is hidden until `reveal_at`. */
  blind: boolean;
  /** It is still hidden now. */
  location_hidden: boolean;
  reveal_opened: boolean;
  max_participants: number;
  cafe: VenueCard | null;
  participants: ProfileCard[] | null;
  attended: boolean | null;
  attendance_note: string | null;
  my_rating: number | null;
  my_comment: string | null;
};

/** `GET /events` item */
export type OpenEventResponse = {
  id: string;
  event_at: string;
  max_participants: number;
  spots_left: number;
  joined: boolean;
};

export type ConfirmBody = { stage: ConfirmStage };
export type AttendanceBody = { happened: boolean; note?: string };
export type RatingBody = { rating: number; comment?: string };
export type RatingResponse = {
  event_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
};

/** `POST /reports` */
export type ReportBody = {
  reason: ReportReason;
  details: string;
  event_id?: string;
  reported_user_id?: string;
};
export type ReportResponse = {
  id: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  event_id: string | null;
  reported_user_id: string | null;
  created_at: string;
};

export type Paginated<T> = { items: T[]; total: number; limit: number; offset: number };

/** `GET /admin/reports` item */
export type AdminReport = {
  id: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  created_at: string;
  updated_at: string;
  event_id: string | null;
  reporter_id: string;
  reported_by: string;
  reported_user_id: string | null;
  reported_user_name: string | null;
  handled_by: string | null;
};
export type ReportStatusPatch = { status: ReportStatus };
export type ReportStatusResponse = { id: string; status: ReportStatus; handled_by: string | null; updated_at: string };

/** `Event` in the admin endpoints. */
export type AdminEvent = {
  id: string;
  title: string | null;
  event_at: string;
  capacity: number;
  target_group_size: number;
  reveal_at: string;
  default_venue_id: string | null;
  status: EventStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/** `POST /admin/events` body; only `event_at` is required. */
export type AdminEventCreate = {
  event_at: string;
  target_group_size?: number;
  default_venue_id?: string | null;
  location_hidden?: boolean;
  capacity?: number;
  title?: string | null;
  status?: EventStatus;
};

/** `Venue` in the admin endpoints: every column. */
export type AdminVenue = {
  id: string;
  name: string;
  description: string;
  photo_url: string | null;
  address: string;
  website: string | null;
  phone: string | null;
  maps_url: string | null;
  google_place_id: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  popular_times: number[] | null;
  capacity: number | null;
  is_active: boolean;
  created_at: string;
};

export type ApiErrorEnvelope = { error: { code: string; message: string; details?: unknown } };
