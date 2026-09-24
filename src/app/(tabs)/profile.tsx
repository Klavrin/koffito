import { router } from "expo-router";

import { Screen } from "@/components/layout";
import { ProfileView } from "@/components/profile/profile-view";
import { Button, Header, IconButton } from "@/components/ui";
import { useSession } from "@/context/session";

export default function ProfilePage() {
  const { profile } = useSession();

  const stats = [
    { label: "Coffee talks", value: profile.stats?.coffeeTalks ?? 0 },
    { label: "Cafés visited", value: profile.stats?.cafesVisited ?? 0 },
    { label: "People met", value: profile.stats?.peopleMet ?? 0 },
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
