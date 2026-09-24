import { View } from "react-native";

import { Button, Card, Text } from "@/components/ui";
import type { ConfirmStage } from "@/types/api";

export type ConfirmAttendanceCardProps = {
  stage: ConfirmStage;
  loading?: boolean;
  onConfirm: () => void;
};

const copy: Record<ConfirmStage, { title: string; description: string }> = {
  "24h": {
    title: "Still coming tomorrow?",
    description: "Confirm your seat so the group can count on you.",
  },
  "3h": {
    title: "Starts in a few hours!",
    description: "Let the group know you'll be there.",
  },
};

/** Nudge shown 24h and 3h before a coffee talk the user joined but hasn't confirmed. */
export function ConfirmAttendanceCard({ stage, loading, onConfirm }: ConfirmAttendanceCardProps) {
  const { title, description } = copy[stage];

  return (
    <Card variant="filled" className="gap-3">
      <View className="gap-0.5">
        <Text variant="label">{title} ☕</Text>
        <Text variant="caption" tone="muted">
          {description}
        </Text>
      </View>
      <Button title="I'll be there" leftIcon="checkmark-circle-outline" fullWidth loading={loading} onPress={onConfirm} />
    </Card>
  );
}
