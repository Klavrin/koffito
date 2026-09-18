import { View } from "react-native";

import { Text } from "@/components/ui";
import { cn } from "@/lib/cn";

export type EmojiAvatarSize = "sm" | "md" | "lg" | "xl";

export type EmojiAvatarProps = {
  emoji?: string;
  size?: EmojiAvatarSize;
  className?: string;
};

const sizes: Record<EmojiAvatarSize, { box: string; text: string }> = {
  sm: { box: "h-10 w-10", text: "text-[20px] leading-[28px]" },
  md: { box: "h-14 w-14", text: "text-[28px] leading-[36px]" },
  lg: { box: "h-20 w-20", text: "text-[40px] leading-[52px]" },
  xl: { box: "h-28 w-28", text: "text-[56px] leading-[72px]" },
};

/** Round emoji avatar used for the signed-in user's own profile. */
export function EmojiAvatar({ emoji = "☕", size = "md", className }: EmojiAvatarProps) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Your avatar"
      className={cn("items-center justify-center rounded-full bg-secondary", sizes[size].box, className)}>
      <Text className={sizes[size].text}>{emoji}</Text>
    </View>
  );
}
