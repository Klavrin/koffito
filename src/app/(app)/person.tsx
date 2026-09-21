import { useLocalSearchParams } from "expo-router";

import { Screen } from "@/components/layout";
import { ProfileView } from "@/components/profile/profile-view";
import { ErrorState, Header } from "@/components/ui";
import { useEvents } from "@/context/events";
import { getPersonStats } from "@/data/events";
import { getUser, toProfileView } from "@/data/users";
import { goBack } from "@/lib/navigation";

export default function PersonPage() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { events } = useEvents();
  const user = getUser(id);

  if (!user) {
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

  const { coffeeTalks, cafesVisited, peopleMet } = getPersonStats(events, user.id);

  return (
    <Screen header={<Header title={user.name} onBack={goBack} />}>
      {/* Same layout as your own profile, minus the edit button. */}
      <ProfileView
        profile={toProfileView(user)}
        stats={[
          { label: "Coffee talks", value: coffeeTalks },
          { label: "Cafés visited", value: cafesVisited },
          { label: "People met", value: peopleMet },
        ]}
      />
    </Screen>
  );
}
