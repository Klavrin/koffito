import { router } from "expo-router";
import { useState } from "react";

import { Screen } from "@/components/layout";
import {
  SettingsRow,
  SettingsSection,
} from "@/components/settings/settings-section";
import { Header, Modal, Text, useToast } from "@/components/ui";
import { useSession } from "@/context/session";
import { errorMessage } from "@/lib/api-client";
import { goBack } from "@/lib/navigation";
import type { UserSettings } from "@/types/koffito";

export default function SettingsPage() {
  const { profile, signOut, updateSettings } = useSession();
  const toast = useToast();

  const [signOutOpen, setSignOutOpen] = useState(false);
  const settings = profile.settings ?? { notificationsEnabled: true, remindersEnabled: true };

  const toggle = (key: keyof UserSettings) => async (value: boolean) => {
    try {
      await updateSettings({ [key]: value });
    } catch (caught) {
      toast.show({ title: "Couldn't save that", message: errorMessage(caught), variant: "error" });
    }
  };

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
          toggle={{ value: settings.notificationsEnabled, onChange: toggle("notificationsEnabled") }}
        />
        <SettingsRow
          icon="alarm-outline"
          label="Coffee talk reminders"
          description="A nudge before each meetup"
          toggle={{ value: settings.remindersEnabled, onChange: toggle("remindersEnabled") }}
        />
      </SettingsSection>

      {profile.isAdmin && (
        <SettingsSection title="Admin">
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Reports"
            description="Review what people flagged"
            onPress={() => router.push("/admin")}
          />
          <SettingsRow
            icon="add-circle-outline"
            label="Create meetup"
            description="Schedule a new coffee talk"
            onPress={() => router.push("/create-event")}
          />
        </SettingsSection>
      )}

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
