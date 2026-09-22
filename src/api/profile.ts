import { supabase } from "@/lib/supabase";
import type { Profile, ProfileStats, Settings } from "@/types/koffito";

import { toProfile, toProfileUpdate, toSettings, toSettingsUpdate } from "./mappers";

/** Loads the signed-in user's profile row and survey answers. */
export async function fetchProfile(userId: string, email?: string): Promise<Profile> {
  const [profile, survey] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("surveys").select("survey_data").eq("user_id", userId).maybeSingle(),
  ]);

  if (profile.error) throw profile.error;
  if (survey.error) throw survey.error;

  return toProfile(profile.data, survey.data?.survey_data ?? null, email);
}

/** Persists profile edits; survey answers go to their own table. */
export async function saveProfile(current: Profile, changes: Partial<Profile>) {
  const update = toProfileUpdate(changes, current);

  if (Object.keys(update).length > 0) {
    const { error } = await supabase.from("profiles").update(update).eq("id", current.id);
    if (error) throw error;
  }

  if (changes.survey) {
    const { error } = await supabase.from("surveys").upsert(
      {
        user_id: current.id,
        survey_data: changes.survey,
        // Finishing onboarding (or retaking the survey) marks it complete so the user can join talks.
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw error;
  }
}

export async function fetchMyStats(userId: string): Promise<ProfileStats> {
  const { data, error } = await supabase.rpc("get_public_profile", { p_user_id: userId });
  if (error) throw error;

  const stats = (data as { stats?: Partial<ProfileStats> } | null)?.stats ?? {};
  return { coffeeTalks: stats.coffeeTalks ?? 0, cafesVisited: stats.cafesVisited ?? 0, peopleMet: stats.peopleMet ?? 0 };
}

export async function fetchSettings(userId: string): Promise<Settings> {
  const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", userId).single();
  if (error) throw error;
  return toSettings(data);
}

export async function saveSettings(userId: string, changes: Partial<Settings>) {
  const { error } = await supabase.from("user_settings").update(toSettingsUpdate(changes)).eq("user_id", userId);
  if (error) throw error;
}
