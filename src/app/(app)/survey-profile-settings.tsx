import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "@/components/layout";
import { AvatarPicker } from "@/components/profile/avatar-picker";
import { ProfileFields, validateAge } from "@/components/profile/profile-fields";
import { Button, Header, Input, Modal, useToast } from "@/components/ui";
import { useProfile, useSession } from "@/context/session";
import { describeError } from "@/lib/errors";
import { goBack } from "@/lib/navigation";
import { validateRequired } from "@/lib/validation";

export default function MyProfilePage() {
  const profile = useProfile();
  const { updateProfile } = useSession();
  const toast = useToast();

  // Only the fields edited here; survey answers are changed through the survey itself.
  const { firstName, avatar, gender, age, occupation, favoriteCoffee } = profile;
  const saved = { firstName, avatar, gender, age, occupation, favoriteCoffee };

  const [draft, setDraft] = useState(saved);
  const [saving, setSaving] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const nameError = validateRequired(draft.firstName, "Your first name can't be empty");
  const ageError = validateAge(draft.age);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ ...draft, firstName: draft.firstName.trim() });
      toast.show({ title: "Profile saved", variant: "success" });
      goBack();
    } catch (error) {
      toast.show({ title: "Couldn't save your profile", message: describeError(error), variant: "error" });
      setSaving(false);
    }
  };

  // Don't silently drop edits when leaving.
  const handleBack = () => (dirty ? setDiscardOpen(true) : goBack());

  return (
    <Screen
      header={<Header title="My profile" onBack={handleBack} />}
      footer={
        <Button title="Save" size="lg" fullWidth loading={saving} disabled={!dirty || !!nameError || !!ageError} onPress={handleSave} />
      }>
      <AvatarPicker value={draft.avatar} onChange={(avatar) => setDraft({ ...draft, avatar })} label="Change avatar" />

      <View className="gap-5">
        <Input
          label="First name"
          leftIcon="person-outline"
          textContentType="givenName"
          value={draft.firstName}
          onChangeText={(firstName) => setDraft({ ...draft, firstName })}
          error={nameError}
        />
        <ProfileFields values={draft} onChange={(changes) => setDraft({ ...draft, ...changes })} ageError={ageError} />
      </View>

      <Button
        title="Retake interests survey"
        variant="outline"
        leftIcon="sparkles-outline"
        fullWidth
        onPress={() => router.push({ pathname: "/survey", params: { mode: "interests" } })}
      />

      <Modal
        visible={discardOpen}
        onClose={() => setDiscardOpen(false)}
        emoji="✏️"
        title="Discard your changes?"
        description="Your edits haven't been saved yet."
        primaryAction={{ title: "Discard", variant: "destructive", onPress: goBack }}
        secondaryAction={{ title: "Keep editing", onPress: () => setDiscardOpen(false) }}
      />
    </Screen>
  );
}
