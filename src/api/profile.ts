import { api, isApiError } from "@/lib/api";
import type { MeResponse, ProfileRow, PublicProfile, SettingsResponse, SurveyBody, SurveyResponse } from "@/types/api";
import type { Me, Profile, ProfileStats, Settings, SurveyAnswers, User } from "@/types/koffito";

import { settingsFromResponse, toMe, toProfileUpdate, toSettingsUpdate, toStats, toUser } from "./mappers";

/** The signed-in user's profile, stats and settings in one request. */
export async function fetchMe(email?: string): Promise<Me> {
  const me = await api.get<MeResponse>("/me");
  return toMe(me, email);
}

/** Creates or replaces the user's survey. Completed surveys unlock joining coffee talks. */
export async function putSurvey(answers: SurveyAnswers, completed = true) {
  const body: SurveyBody = { survey_data: answers, completed };
  return api.put<SurveyResponse>("/me/survey", body);
}

/**
 * Persists profile edits. The survey goes first so the profile is never marked onboarded
 * without a saved survey; if the profile patch fails afterwards, retrying re-sends both.
 */
export async function saveProfile(current: Profile, changes: Partial<Profile>) {
  if (changes.survey) await putSurvey(changes.survey);

  const patch = toProfileUpdate(changes, current);
  if (Object.keys(patch).length > 0) await api.patch<ProfileRow>("/me", patch);
}

export async function saveSettings(changes: Partial<Settings>): Promise<Settings> {
  const saved = await api.patch<SettingsResponse>("/me/settings", toSettingsUpdate(changes));
  return settingsFromResponse(saved);
}

/**
 * Someone's profile card plus their coffee talk stats. The API only answers for the user
 * themself, admins, or people they shared a revealed coffee talk with; everyone else is a 404.
 */
export async function fetchPublicProfile(userId: string): Promise<{ user: User; stats: ProfileStats } | undefined> {
  try {
    const card = await api.get<PublicProfile>(`/users/${userId}`);
    return { user: toUser(card), stats: toStats(card.stats) };
  } catch (error) {
    if (isApiError(error) && error.status === 404) return undefined;
    throw error;
  }
}
