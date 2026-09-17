import type { ReactNode } from "react";
import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { cn } from "@/lib/cn";
import { motion } from "@/theme/tokens";
import { Text } from "./text";

export type StateViewProps = {
  emoji: string;
  title: string;
  description?: string;
  /** Background for the emoji circle. */
  circleClassName: string;
  action?: ReactNode;
  className?: string;
};

/** Shared friendly layout for EmptyState and ErrorState. */
export function StateView({ emoji, title, description, circleClassName, action, className }: StateViewProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(motion.slow)}
      className={cn("items-center justify-center gap-5 px-8 py-10", className)}>
      <View className={cn("h-24 w-24 items-center justify-center rounded-full", circleClassName)}>
        <Text className="text-[44px] leading-[54px]">{emoji}</Text>
      </View>
      <View className="max-w-xs items-center gap-1.5">
        <Text variant="title" className="text-center">
          {title}
        </Text>
        {description && (
          <Text tone="muted" className="text-center">
            {description}
          </Text>
        )}
      </View>
      {action}
    </Animated.View>
  );
}
