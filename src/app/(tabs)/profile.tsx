import { router } from "expo-router";
import { useCallback } from "react";

import { fetchMyStats } from "@/api";
import { Screen } from "@/components/layout";
import { ProfileView } from "@/components/profile/profile-view";
import { Button, Header, IconButton } from "@/components/ui";
import { useSession } from "@/context/session";
import { useResource } from "@/hooks/use-resource";

export default function ProfilePage() {
  const { profile } = useSession();

  const userId = profile.id;
  const loadStats = useCallback(() => fetchMyStats(userId ?? ""), [userId]);
  const { data: stats } = useResource(loadStats, !!userId);

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
        stats={[
          { label: "Coffee talks", value: stats?.coffeeTalks ?? 0 },
          { label: "Cafés visited", value: stats?.cafesVisited ?? 0 },
          { label: "People met", value: stats?.peopleMet ?? 0 },
        ]}
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
