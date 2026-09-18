import { View } from "react-native";

import { Text } from "@/components/ui";
import { cn } from "@/lib/cn";

export type SurveyProgressProps = {
  /** Zero-based index of the current step. */
  step: number;
  total: number;
};

export function SurveyProgress({ step, total }: SurveyProgressProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: step + 1 }}
      className="gap-2">
      <View className="flex-row gap-1.5">
        {Array.from({ length: total }, (_, index) => (
          <View key={index} className={cn("h-2 flex-1 rounded-full", index <= step ? "bg-primary" : "bg-surface-muted")} />
        ))}
      </View>
      <Text variant="caption" tone="muted">
        Step {step + 1} of {total}
      </Text>
    </View>
  );
}
