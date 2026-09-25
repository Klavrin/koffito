import { useLocalSearchParams } from "expo-router";
import { useCallback } from "react";

import { fetchPublicProfile } from "@/api";
import { Screen } from "@/components/layout";
import { ProfileView } from "@/components/profile/profile-view";
import { ErrorState, Header, Skeleton } from "@/components/ui";
import { useResource } from "@/hooks/use-resource";
import { describeError } from "@/lib/errors";
import { goBack } from "@/lib/navigation";
import { toProfileView } from "@/lib/people";

export default function PersonPage() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  // The API only shares profiles of people you've had a revealed coffee talk with.
  const loadPerson = useCallback(() => fetchPublicProfile(id ?? ""), [id]);
  const { data, loading, error, refresh } = useResource(loadPerson, !!id);

  if (loading && !data) {
    return (
      <Screen header={<Header title="Profile" onBack={goBack} />} contentClassName="items-center gap-6">
        <Skeleton shape="circle" width={112} />
        <Skeleton width="60%" height={28} />
        <Skeleton height={96} className="rounded-3xl" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen header={<Header title="Profile" onBack={goBack} />} contentClassName="flex-1 justify-center">
        <ErrorState title="Couldn't load this profile" description={describeError(error)} onRetry={refresh} />
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen header={<Header title="Profile" onBack={goBack} />} contentClassName="flex-1 justify-center">
        <ErrorState
          title="We couldn't find this person"
          description="They may have left the coffee talk."
          retryLabel="Go back"
          onRetry={goBack}
        />
      </Screen>
    );
  }

  const { user, stats } = data;

  return (
    <Screen header={<Header title={user.name} onBack={goBack} />}>
      {/* Same layout as your own profile, minus the edit button. */}
      <ProfileView
        profile={toProfileView(user)}
        stats={[
          { label: "Coffee talks", value: stats.coffeeTalks },
          { label: "Cafés visited", value: stats.cafesVisited },
          { label: "People met", value: stats.peopleMet },
        ]}
      />
    </Screen>
  );
}
