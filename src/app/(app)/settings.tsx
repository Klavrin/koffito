import { router } from "expo-router";
import { useState } from "react";

import { Screen } from "@/components/layout";
import {
  SettingsRow,
  SettingsSection,
} from "@/components/settings/settings-section";
import { Header, Modal, Text } from "@/components/ui";
import { useSession } from "@/context/session";
import { goBack } from "@/lib/navigation";

export default function SettingsPage() {
  const { signOut } = useSession();

  const [notifications, setNotifications] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [signOutOpen, setSignOutOpen] = useState(false);

  return (
    <Screen header={<Header title="Settings" onBack={goBack} />}>
      <SettingsSection title="Account">
        <SettingsRow
          icon="person-outline"
          label="My profile"
          description="Avatar, name and the basics"
          onPress={() => router.push("/survey-profile-settings")}
        />
        <SettingsRow
          icon="sparkles-outline"
          label="Retake interests survey"
          description="Update what you like talking about"
          onPress={() =>
            router.push({ pathname: "/survey", params: { mode: "interests" } })
          }
        />
      </SettingsSection>

      <SettingsSection title="Preferences">
        <SettingsRow
          icon="notifications-outline"
          label="Notifications"
          description="Opportunities, event updates and more"
          toggle={{ value: notifications, onChange: setNotifications }}
        />
        <SettingsRow
          icon="alarm-outline"
          label="Coffee talk reminders"
          description="A nudge before each meetup"
          toggle={{ value: reminders, onChange: setReminders }}
        />
      </SettingsSection>

      <SettingsSection title="Support">
        <SettingsRow
          icon="flag-outline"
          label="Report a problem"
          onPress={() => router.push("/report")}
        />
      </SettingsSection>

      <SettingsSection title="Session">
        <SettingsRow
          icon="log-out-outline"
          label="Log out"
          tone="error"
          onPress={() => setSignOutOpen(true)}
        />
      </SettingsSection>

      <Text variant="caption" tone="muted" className="text-center">
        Koffito · made with ☕
      </Text>

      <Modal
        visible={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        emoji="👋"
        title="Leaving already?"
        description="You'll need to log in again to join coffee talks."
        primaryAction={{
          title: "Log out",
          variant: "destructive",
          onPress: signOut,
        }}
        secondaryAction={{
          title: "Stay",
          onPress: () => setSignOutOpen(false),
        }}
      />
    </Screen>
  );
}
