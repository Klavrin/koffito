import { supabase } from "@/lib/supabase";

export async function signInWithPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

export type Registration = {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
};

/**
 * Creates the account; a database trigger adds the profile and settings rows.
 * Resolves to `true` when the project requires email confirmation before the first login.
 */
export async function register({ firstName, lastName, email, password }: Registration) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { first_name: firstName, display_name: [firstName, lastName].filter(Boolean).join(" ") } },
  });
  if (error) throw error;

  return data.session === null;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
