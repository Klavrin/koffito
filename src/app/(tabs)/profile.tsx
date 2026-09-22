import { router } from "expo-router";

import { Screen } from "@/components/layout";
import { ProfileView } from "@/components/profile/profile-view";
import { Button, Header, IconButton } from "@/components/ui";
import { useEvents } from "@/context/events";
import { useSession } from "@/context/session";
import { visitedCafes } from "@/data/cafes";
import { users } from "@/data/users";

export default function ProfilePage() {
  const { profile } = useSession();
  const { events } = useEvents();

  const coffeeTalks = events.filter((event) => event.joined && event.status === "completed").length;
  const stats = [
    { label: "Coffee talks", value: coffeeTalks },
    { label: "Cafés visited", value: visitedCafes.length },
    { label: "People met", value: users.length },
  ];

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");

  return (
    <Screen
      tabBarInset
      header={
        <Header
          title="Profile"
          right={
            <IconButton
              icon="settings-outline"
              accessibilityLabel="Settings"
              onPress={() => router.push("/settings")}
            />
          }
        />
      }
    >
      <ProfileView
        profile={{ ...profile, name: fullName }}
        title={`Hi, ${fullName}!`}
        stats={stats}
        action={
          <Button
            title="Edit profile"
            variant="secondary"
            size="sm"
            leftIcon="create-outline"
            onPress={() => router.push("/survey-profile-settings")}
          />
        }
      />
    </Screen>
  );
}
