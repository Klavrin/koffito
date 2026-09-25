/**
 * Request and response shapes of the Koffito API (see docs/frontend-integration.md).
 * snake_case fields are exactly what goes over the wire; the cards (`ProfileCard`, `VenueCard`)
 * are camelCase because the API sends them that way.
 */

export type Gender = "female" | "male" | "non_binary" | "prefer_not_to_say";
export type Language = "ro" | "ru" | "en";
/** joined → matched (in a group) → confirmed | declined (answer after the reveal). */
export type ParticipantStatus = "joined" | "matched" | "confirmed" | "declined";
/** open → closed → matched → revealed → completed, or failed / cancelled. Moved by the server only. */
export type EventStatus = "open" | "closed" | "matched" | "revealed" | "completed" | "failed" | "cancelled";
export type CancelReason = "admin" | "not_enough_people";
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

/** A groupmate as a confirmed member sees them. `sharedInterests` are "question:answer" keys. */
export type GroupMemberCard = {
  id: string;
  name: string;
  emoji: string | null;
  status: ParticipantStatus;
  sharedInterests: string[];
};

/** `GET /me/events` item. `cafe`, `members` and `group_number` only once revealed and confirmed. */
export type MyEventResponse = {
  id: string;
  event_at: string;
  registration_closes_at: string;
  reveal_at: string;
  completes_at: string;
  event_status: EventStatus;
  participant_status: ParticipantStatus;
  cancel_reason: CancelReason | null;
  group_number: number | null;
  cafe: VenueCard | null;
  members: GroupMemberCard[] | null;
  my_rating: number | null;
  my_comment: string | null;
};

/** `GET /events` item: only the time, never the café or a head count. */
export type OpenEventResponse = {
  id: string;
  event_at: string;
  registration_closes_at: string;
  reveal_at: string;
  full: boolean;
  joined: boolean;
};

/** `POST /events/{id}/respond`: "Yes, I'm coming" / "No, I can't make it". */
export type RespondBody = { coming: boolean };
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

/** `GET /admin/events` item. `capacity` is global: active cafés × 5. */
export type AdminEvent = {
  id: string;
  title: string | null;
  event_at: string;
  registration_closes_at: string;
  reveal_at: string;
  completes_at: string;
  status: EventStatus;
  cancel_reason: CancelReason | null;
  status_changed_at: string;
  matching_error: string | null;
  created_at: string;
  participant_count: number;
  group_count: number;
  capacity: number;
};

/** `POST /admin/events` body: the admin only picks the date and time. */
export type AdminEventCreate = { event_at: string };

export type AdminParticipant = {
  user_id: string;
  name: string;
  emoji: string | null;
  status: ParticipantStatus;
  group_number: number | null;
  joined_at: string;
};

export type AdminGroupMember = {
  user_id: string;
  name: string;
  emoji: string | null;
  status: ParticipantStatus;
  shared_interests: string[];
};

export type AdminGroup = {
  id: string;
  number: number;
  cafe: VenueCard | null;
  shared_interests: string[];
  members: AdminGroupMember[];
  ratings: { user_id: string; name: string; rating: number; comment: string }[];
  average_rating: number | null;
};

export type AdminEventReport = {
  id: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  reported_by: string;
  reported_user_id: string | null;
  reported_user_name: string | null;
  created_at: string;
};

/** `GET /admin/events/{id}` and `POST /admin/events/{id}/cancel` */
export type AdminEventDetail = {
  event: AdminEvent;
  group_size_min: number;
  group_size_max: number;
  active_cafes: number;
  estimated_groups: number;
  participants: AdminParticipant[];
  groups: AdminGroup[];
  reports: AdminEventReport[];
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

/** `POST /admin/venues` body (`PATCH` takes any subset). */
export type AdminVenueInput = {
  name?: string;
  address?: string;
  description?: string | null;
  photo_url?: string | null;
  website?: string | null;
  phone?: string | null;
  maps_url?: string | null;
  is_active?: boolean;
};
