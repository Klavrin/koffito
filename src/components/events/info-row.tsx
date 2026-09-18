import { Pressable, View } from "react-native";

import { Icon, type IconName, Text } from "@/components/ui";

export type InfoRowProps = {
  icon: IconName;
  label: string;
  /** Makes the row tappable (e.g. open a website or dial a number). */
  onPress?: () => void;
  size?: "sm" | "md";
};

/** Icon + text line used for event facts (date, location, website, phone...). */
export function InfoRow({ icon, label, onPress, size = "md" }: InfoRowProps) {
  const small = size === "sm";

  const row = (
    <View className="flex-row items-center gap-2">
      {small ? (
        <Icon name={icon} size={15} color="muted" />
      ) : (
        <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-muted">
          <Icon name={icon} size={18} color="primary" />
        </View>
      )}
      <Text variant={small ? "caption" : "body"} tone={onPress ? "primary" : small ? "muted" : "default"} numberOfLines={1} className="flex-1">
        {label}
      </Text>
    </View>
  );

  if (!onPress) return row;

  return (
    <Pressable accessibilityRole="link" accessibilityLabel={label} hitSlop={4} onPress={onPress}>
      {row}
    </Pressable>
  );
}
