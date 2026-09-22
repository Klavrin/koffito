import { router } from "expo-router";
import { useCallback, useState } from "react";

import { fetchSettings, saveSettings } from "@/api";
import { Screen } from "@/components/layout";
import { SettingsRow, SettingsSection } from "@/components/settings/settings-section";
import { Header, Modal, Text, useToast } from "@/components/ui";
import { useProfile, useSession } from "@/context/session";
import { useResource } from "@/hooks/use-resource";
import { describeError } from "@/lib/errors";
import { goBack } from "@/lib/navigation";
import type { Settings } from "@/types/koffito";

const defaults: Settings = { notifications: true, reminders: true };

export default function SettingsPage() {
  const profile = useProfile();
  const { signOut } = useSession();
  const toast = useToast();

  const loadSettings = useCallback(() => fetchSettings(profile.id), [profile.id]);
  const { data, setData } = useResource(loadSettings);
  const settings = data ?? defaults;

  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Flip the switch right away and roll it back if the save fails.
  const toggle = (key: keyof Settings) => async (value: boolean) => {
    setData((current) => ({ ...(current ?? defaults), [key]: value }));
    try {
      await saveSettings(profile.id, { [key]: value });
    } catch (error) {
      setData((current) => ({ ...(current ?? defaults), [key]: !value }));
      toast.show({ title: "Couldn't save that", message: describeError(error), variant: "error" });
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      setSigningOut(false);
      setSignOutOpen(false);
      toast.show({ title: "Couldn't log you out", message: describeError(error), variant: "error" });
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
          onPress={() => router.push({ pathname: "/survey", params: { mode: "interests" } })}
        />
      </SettingsSection>

      <SettingsSection title="Preferences">
        <SettingsRow
          icon="notifications-outline"
          label="Notifications"
          description="Invites, matches and messages"
          toggle={{ value: settings.notifications, onChange: toggle("notifications") }}
        />
        <SettingsRow
          icon="alarm-outline"
          label="Coffee talk reminders"
          description="A nudge before each meetup"
          toggle={{ value: settings.reminders, onChange: toggle("reminders") }}
        />
      </SettingsSection>

      <SettingsSection title="Support">
        <SettingsRow icon="flag-outline" label="Report a problem" onPress={() => router.push("/report")} />
        {profile.isAdmin && (
          <SettingsRow icon="shield-checkmark-outline" label="Reports" description="Admin area" onPress={() => router.push("/admin")} />
        )}
        <SettingsRow icon="color-palette-outline" label="Component gallery" description="For developers" onPress={() => router.push("/components")} />
      </SettingsSection>

      <SettingsSection title="Session">
        <SettingsRow icon="log-out-outline" label="Log out" tone="error" onPress={() => setSignOutOpen(true)} />
      </SettingsSection>

      <Text variant="caption" tone="muted" className="text-center">
        {profile.email ? `Logged in as ${profile.email}` : "Koffito · made with ☕"}
      </Text>

      <Modal
        visible={signOutOpen}
        onClose={() => setSignOutOpen(false)}
        emoji="👋"
        title="Leaving already?"
        description="You'll need to log in again to join coffee talks."
        primaryAction={{ title: "Log out", variant: "destructive", loading: signingOut, onPress: handleSignOut }}
        secondaryAction={{ title: "Stay", onPress: () => setSignOutOpen(false) }}
      />
    </Screen>
  );
}
