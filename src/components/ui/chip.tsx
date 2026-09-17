import { useEffect, useRef } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";

import { cn } from "@/lib/cn";
import { motion } from "@/theme/tokens";
import { Icon, type IconName } from "./icon";
import { Text } from "./text";

export type ChipSize = "sm" | "md";

export type ChipProps = {
  label: string;
  emoji?: string;
  icon?: IconName;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  size?: ChipSize;
  className?: string;
};

const sizeClasses: Record<ChipSize, { container: string; text: string; icon: number }> = {
  sm: { container: "min-h-8 px-3 gap-1", text: "text-[13px]", icon: 14 },
  md: { container: "min-h-11 px-4 gap-1.5", text: "text-[15px]", icon: 16 },
};

export function Chip({
  label,
  emoji,
  icon,
  selected = false,
  onPress,
  disabled = false,
  size = "md",
  className,
}: ChipProps) {
  const scale = useSharedValue(1);
  const isFirstRender = useRef(true);
  const sizing = sizeClasses[size];

  // A small bounce whenever selection changes (not on mount).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    scale.value = withSequence(
      withTiming(0.92, { duration: motion.fast / 2 }),
      withSpring(1, motion.spring),
    );
  }, [selected, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const content = (
    <View
      className={cn(
        "flex-row items-center rounded-full",
        sizing.container,
        selected ? "bg-primary" : "bg-surface-muted",
        disabled && "opacity-50",
        className,
      )}>
      {selected && (
        <Animated.View entering={ZoomIn.duration(motion.fast)}>
          <Icon name="checkmark-circle" size={sizing.icon} color="on-primary" />
        </Animated.View>
      )}
      {emoji && <Text className={sizing.text}>{emoji}</Text>}
      {icon && <Icon name={icon} size={sizing.icon} color={selected ? "on-primary" : "foreground"} />}
      <Text
        variant="label"
        tone={selected ? "on-primary" : "default"}
        className={cn("font-body-medium", sizing.text)}>
        {label}
      </Text>
    </View>
  );

  return (
    <Animated.View style={animatedStyle} className="self-start">
      {onPress ? (
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: selected, disabled }}
          accessibilityLabel={label}
          disabled={disabled}
          onPress={onPress}>
          {({ pressed }) => <View className={cn(pressed && "opacity-80")}>{content}</View>}
        </Pressable>
      ) : (
        content
      )}
    </Animated.View>
  );
}
