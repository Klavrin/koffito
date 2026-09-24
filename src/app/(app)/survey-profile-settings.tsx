import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { Screen } from "@/components/layout";
import { AvatarPicker } from "@/components/profile/avatar-picker";
import {
  isProfileComplete,
  ProfileFields,
  validateProfileFields,
} from "@/components/profile/profile-fields";
import { Button, Header, Input, Modal, useToast } from "@/components/ui";
import { useSession } from "@/context/session";
import { errorMessage } from "@/lib/api-client";
import { goBack } from "@/lib/navigation";
import { validateRequired } from "@/lib/validation";

export default function MyProfilePage() {
  const { profile, updateProfile } = useSession();
  const toast = useToast();

  // Only the fields edited here; survey answers are changed through the survey itself.
  const { firstName, avatar, gender, age, occupation, favoriteCoffee } =
    profile;
  const saved = { firstName, avatar, gender, age, occupation, favoriteCoffee };

  const [draft, setDraft] = useState(saved);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const nameError = validateRequired(
    draft.firstName,
    "Your first name can't be empty",
  );
  const detailErrors = validateProfileFields(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ ...draft, firstName: draft.firstName.trim() });
      toast.show({ title: "Profile saved", variant: "success" });
      goBack();
    } catch (caught) {
      toast.show({ title: "Couldn't save your profile", message: errorMessage(caught), variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Don't silently drop edits when leaving.
  const handleBack = () => (dirty ? setDiscardOpen(true) : goBack());

  return (
    <Screen
      header={<Header title="My profile" onBack={handleBack} />}
      footer={
        <Button
          title="Save"
          size="lg"
          fullWidth
          disabled={!dirty || !!nameError || !isProfileComplete(draft)}
          loading={saving}
          onPress={handleSave}
        />
      }
    >
      <AvatarPicker
        value={draft.avatar}
        onChange={(avatar) => setDraft({ ...draft, avatar })}
        label="Change avatar"
      />

      <View className="gap-5">
        <Input
          label="Name"
          leftIcon="person-outline"
          textContentType="givenName"
          value={draft.firstName}
          onChangeText={(firstName) => setDraft({ ...draft, firstName })}
          error={nameError}
        />
        <ProfileFields
          values={draft}
          onChange={(changes) => setDraft({ ...draft, ...changes })}
          errors={detailErrors}
        />
      </View>

      <Button
        title="Retake interests survey"
        variant="outline"
        leftIcon="sparkles-outline"
        fullWidth
        onPress={() =>
          router.push({ pathname: "/survey", params: { mode: "interests" } })
        }
      />

      <Modal
        visible={discardOpen}
        onClose={() => setDiscardOpen(false)}
        emoji="✏️"
        title="Discard your changes?"
        description="Your edits haven't been saved yet."
        primaryAction={{
          title: "Discard",
          variant: "destructive",
          onPress: goBack,
        }}
        secondaryAction={{
          title: "Keep editing",
          onPress: () => setDiscardOpen(false),
        }}
      />
    </Screen>
  );
}
