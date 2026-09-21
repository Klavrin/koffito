import { View } from "react-native";

import { IconButton, Text } from "@/components/ui";

export type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Used for accessibility labels, e.g. "participants". */
  unit: string;
};

export function Stepper({ value, onChange, min = 1, max = 10, unit }: StepperProps) {
  return (
    <View className="flex-row items-center gap-4">
      <IconButton
        icon="remove"
        variant="secondary"
        accessibilityLabel={`Fewer ${unit}`}
        disabled={value <= min}
        onPress={() => onChange(value - 1)}
      />
      <Text variant="title" className="min-w-10 text-center" accessibilityLabel={`${value} ${unit}`}>
        {value}
      </Text>
      <IconButton
        icon="add"
        variant="secondary"
        accessibilityLabel={`More ${unit}`}
        disabled={value >= max}
        onPress={() => onChange(value + 1)}
      />
    </View>
  );
}
