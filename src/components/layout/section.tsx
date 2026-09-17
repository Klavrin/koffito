import type { PropsWithChildren } from "react";
import { Pressable, View } from "react-native";

import { Text } from "@/components/ui";
import { cn } from "@/lib/cn";

export type SectionProps = PropsWithChildren<{
  title: string;
  description?: string;
  /** Small text action on the right, e.g. "See all". */
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}>;

export function Section({ title, description, actionLabel, onAction, className, children }: SectionProps) {
  return (
    <View className={cn("gap-3", className)}>
      <View className="flex-row items-end justify-between gap-3">
        <View className="flex-1 gap-0.5">
          <Text variant="heading" accessibilityRole="header">
            {title}
          </Text>
          {description && (
            <Text variant="caption" tone="muted">
              {description}
            </Text>
          )}
        </View>
        {actionLabel && onAction && (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onAction}>
            <Text variant="label" tone="primary">
              {actionLabel}
            </Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}
