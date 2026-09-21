import type { Profile } from "@/types/koffito";

type AuthUserProfile = {
  email?: string;
  user_metadata?: Record<string, unknown>;
};

export function profileFromUser(user: AuthUserProfile): Profile {
  const metadataName = user.user_metadata?.first_name;
  const firstName =
    typeof metadataName === "string" && metadataName.trim()
      ? metadataName.trim()
      : (user.email?.split("@")[0] ?? "");

  return {
    firstName,
    email: user.email,
    survey: {},
    onboarded: false,
  };
}
