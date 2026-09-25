import { Screen } from "@/components/layout";
import { Button, ErrorState } from "@/components/ui";
import { useSession } from "@/context/session";
import { describeError } from "@/lib/errors";

/** Full-screen fallback when the signed-in user's profile could not be loaded. */
export function ProfileLoadError() {
  const { profileError, refreshProfile, signOut } = useSession();

  return (
    <Screen contentClassName="flex-1 justify-center" footer={<Button title="Log out" variant="ghost" fullWidth onPress={signOut} />}>
      <ErrorState
        title="We couldn't fetch your profile"
        description={describeError(profileError)}
        onRetry={refreshProfile}
      />
    </Screen>
  );
}
