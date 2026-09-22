import { useState } from "react";
import { Pressable, View } from "react-native";

import { BottomSheet, Button, Input, Text } from "@/components/ui";

export type MissedFeedbackSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** The note is optional — sending nothing still records the coffee talk as missed. */
  onSubmit: (comment: string) => void;
  onReport: () => void;
};

/** Asked when a coffee talk did not happen: a note, or a way to report it. */
export function MissedFeedbackSheet({ visible, onClose, onSubmit, onReport }: MissedFeedbackSheetProps) {
  const [comment, setComment] = useState("");

  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setComment("");
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Sorry it didn't happen"
      description="Tell us what got in the way, so we can make the next one easier.">
      <View className="gap-5 pb-6">
        <Input
          label="What happened?"
          placeholder="Plans changed, no one showed up, wrong café..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          fieldClassName="min-h-28 items-start py-3"
          value={comment}
          onChangeText={setComment}
        />

        <Button title="Send" size="lg" fullWidth onPress={() => onSubmit(comment.trim())} />

        <Pressable accessibilityRole="link" hitSlop={8} onPress={onReport} className="self-center">
          <Text variant="caption" tone="muted">
            Someone behaved badly?{" "}
            <Text variant="caption" tone="error">
              Report
            </Text>
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
