import { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { motion } from "@/theme/tokens";

/** Subtle "squish" on press, shared by all pressable components. */
export function usePressScale(scaleTo: number = motion.pressScale) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return {
    animatedStyle,
    onPressIn: () => {
      scale.value = withSpring(scaleTo, motion.spring);
    },
    onPressOut: () => {
      scale.value = withSpring(1, motion.spring);
    },
  };
}
