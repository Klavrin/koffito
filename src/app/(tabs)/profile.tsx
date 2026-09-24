import { router } from "expo-router";

import { Screen } from "@/components/layout";
import { ProfileView } from "@/components/profile/profile-view";
import { Button, Header, IconButton } from "@/components/ui";
import { useSession } from "@/context/session";

export default function ProfilePage() {
  const { profile, stats } = useSession();

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
          { label: "Coffee talks", value: stats.coffeeTalks },
          { label: "Cafés visited", value: stats.cafesVisited },
          { label: "People met", value: stats.peopleMet },
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
