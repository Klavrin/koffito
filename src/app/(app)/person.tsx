import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";

import { Screen } from "@/components/layout";
import { ProfileView } from "@/components/profile/profile-view";
import { ErrorState, Header, Skeleton } from "@/components/ui";
import { errorMessage } from "@/lib/api-client";
import { type ApiPublicProfile, koffitoApi } from "@/lib/koffito-api";
import { toProfileView } from "@/lib/mappers";
import { goBack } from "@/lib/navigation";

type State =
  | { kind: "loading" }
  | { kind: "ready"; person: ApiPublicProfile }
  | { kind: "error"; message: string };

export default function PersonPage() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [attempt, setAttempt] = useState(0);

  if (!id) {
    return <PersonError message="They may have left the coffee talk." onRetry={goBack} />;
  }

  // Keyed so a retry (or a different person) starts from a fresh loading state.
  return <PersonLoader key={`${id}:${attempt}`} id={id} onRetry={() => setAttempt((count) => count + 1)} />;
}

function PersonLoader({ id, onRetry }: { id: string; onRetry: () => void }) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    koffitoApi
      .person(id)
      .then((person) => {
        if (!cancelled) setState({ kind: "ready", person });
      })
      .catch((caught: unknown) => {
        if (!cancelled)
          setState({ kind: "error", message: errorMessage(caught, "They may have left the coffee talk.") });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.kind === "loading") {
    return (
      <Screen header={<Header title="Profile" onBack={goBack} />}>
        <View className="items-center gap-3">
          <Skeleton shape="circle" width={96} />
          <Skeleton width="50%" height={24} />
        </View>
        <Skeleton height={88} className="rounded-3xl" />
        <Skeleton height={140} className="rounded-3xl" />
      </Screen>
    );
  }

  if (state.kind === "error") {
    return <PersonError message={state.message} onRetry={onRetry} />;
  }

  const { person } = state;

  return (
    <Screen header={<Header title={person.name} onBack={goBack} />}>
      {/* Same layout as your own profile, minus the edit button. */}
      <ProfileView
        profile={toProfileView(person)}
        stats={[
          { label: "Coffee talks", value: person.stats.coffeeTalks },
          { label: "Cafés visited", value: person.stats.cafesVisited },
          { label: "People met", value: person.stats.peopleMet },
        ]}
      />
    </Screen>
  );
}

function PersonError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Screen header={<Header title="Profile" onBack={goBack} />} contentClassName="flex-1 justify-center">
      <ErrorState title="We couldn't find this person" description={message} retryLabel="Try again" onRetry={onRetry} />
    </Screen>
  );
}
