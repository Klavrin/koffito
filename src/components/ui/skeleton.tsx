import { useEffect } from "react";
import { type DimensionValue, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { cn } from "@/lib/cn";

export type SkeletonProps = {
  shape?: "rect" | "circle";
  width?: DimensionValue;
  height?: DimensionValue;
  className?: string;
};

/** Soft pulsing placeholder while content loads. */
export function Skeleton({ shape = "rect", width = "100%", height = 16, className }: SkeletonProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.45, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[animatedStyle, { width, height: shape === "circle" ? width : height }]}
      className={cn("bg-surface-muted", shape === "circle" ? "rounded-full" : "rounded-xl", className)}
    />
  );
}

export type SkeletonTextProps = {
  lines?: number;
  className?: string;
};

/** Paragraph placeholder; the last line is shorter to look like real text. */
export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <View className={cn("gap-2", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} height={12} width={index === lines - 1 && lines > 1 ? "60%" : "100%"} />
      ))}
    </View>
  );
}
