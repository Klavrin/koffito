import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Text } from "@/components/ui";
import { motion } from "@/theme/tokens";

export type AuthHeroProps = {
  emoji?: string;
  title: string;
  subtitle: string;
  size?: "md" | "lg";
};

/** Emoji badge + title block shared by the welcome and auth screens. */
export function AuthHero({ emoji = "☕", title, subtitle, size = "md" }: AuthHeroProps) {
  const large = size === "lg";

  return (
    <Animated.View entering={FadeInDown.duration(motion.slow)}>
      <View className="items-center gap-4">
        <View
          className={
            large
              ? "h-36 w-36 items-center justify-center rounded-full bg-secondary"
              : "h-20 w-20 items-center justify-center rounded-full bg-secondary"
          }>
          <Text className={large ? "text-[64px] leading-[80px]" : "text-[36px] leading-[48px]"}>{emoji}</Text>
        </View>
        <View className="items-center gap-2">
          <Text variant={large ? "display" : "title"} className="text-center" accessibilityRole="header">
            {title}
          </Text>
          <Text tone="muted" className="max-w-xs text-center">
            {subtitle}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
