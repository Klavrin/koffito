import type { ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "@/lib/cn";
import { IconButton } from "./icon-button";
import { Text } from "./text";

export type HeaderSize = "compact" | "large";

export type HeaderProps = {
  title: string;
  subtitle?: string;
  size?: HeaderSize;
  onBack?: () => void;
  /** Action buttons on the right (e.g. IconButtons). */
  right?: ReactNode;
  /** Add the top safe-area inset. Disable when already inside a SafeAreaView. */
  safeArea?: boolean;
  className?: string;
};

export function Header({
  title,
  subtitle,
  size = "compact",
  onBack,
  right,
  safeArea = true,
  className,
}: HeaderProps) {
  const insets = useSafeAreaInsets();

  const back = onBack && (
    <IconButton icon="chevron-back" accessibilityLabel="Go back" variant="surface" onPress={onBack} />
  );

  if (size === "large") {
    return (
      <View style={{ paddingTop: safeArea ? insets.top : 0 }} className={cn("gap-4 bg-background px-5 pb-4 pt-2", className)}>
        {(back || right) && (
          <View className="flex-row items-center justify-between">
            {back ?? <View />}
            <View className="flex-row items-center gap-2">{right}</View>
          </View>
        )}
        <View className="gap-1">
          <Text variant="display" accessibilityRole="header">
            {title}
          </Text>
          {subtitle && <Text tone="muted">{subtitle}</Text>}
        </View>
      </View>
    );
  }

  return (
    <View
      style={{ paddingTop: safeArea ? insets.top : 0 }}
      className={cn("min-h-14 flex-row items-center gap-3 bg-background px-5 pb-3 pt-2", className)}>
      {back}
      <View className="flex-1">
        <Text variant="heading" numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
        {subtitle && (
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {right && <View className="flex-row items-center gap-2">{right}</View>}
    </View>
  );
}
