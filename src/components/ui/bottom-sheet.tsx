import { type PropsWithChildren, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Modal as RNModal,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { cn } from "@/lib/cn";
import { ThemeScope, useKoffitoTheme } from "@/theme/theme-provider";
import { motion } from "@/theme/tokens";
import { Text } from "./text";

export type BottomSheetProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  /** Allow closing by tapping the backdrop or swiping down. */
  dismissible?: boolean;
  className?: string;
}>;

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 900;

export function BottomSheet({
  visible,
  onClose,
  title,
  description,
  dismissible = true,
  className,
  children,
}: BottomSheetProps) {
  const { shadows } = useKoffitoTheme();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(screenHeight);

  // Keep the native modal mounted until the closing animation has finished.
  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = screenHeight;
      translateY.value = withSpring(0, { damping: 22, stiffness: 240 });
    } else if (mounted) {
      translateY.value = withTiming(screenHeight, { duration: motion.base }, (finished) => {
        if (finished) scheduleOnRN(setMounted, false);
      });
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const pan = Gesture.Pan()
    .enabled(dismissible)
    .activeOffsetY(8)
    .onUpdate((event) => {
      translateY.value = Math.max(0, event.translationY);
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY) {
        scheduleOnRN(onClose);
      } else {
        translateY.value = withSpring(0, motion.spring);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, screenHeight * 0.6], [1, 0], "clamp"),
  }));

  return (
    <RNModal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={dismissible ? onClose : undefined}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeScope>
          <Animated.View style={backdropStyle} className="absolute inset-0 bg-overlay/40">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="flex-1"
              disabled={!dismissible}
              onPress={onClose}
            />
          </Animated.View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            pointerEvents="box-none"
            className="flex-1 justify-end">
            <GestureDetector gesture={pan}>
              <Animated.View
                accessibilityViewIsModal
                style={[sheetStyle, { boxShadow: shadows.raised, paddingBottom: Math.max(insets.bottom, 20) }]}
                className={cn("max-h-[90%] rounded-t-sheet bg-surface px-6 pt-3", className)}>
                <View className="mb-4 h-1.5 w-11 self-center rounded-full bg-border" />
                {(title || description) && (
                  <View className="mb-4 gap-1">
                    {title && <Text variant="title">{title}</Text>}
                    {description && <Text tone="muted">{description}</Text>}
                  </View>
                )}
                {children}
              </Animated.View>
            </GestureDetector>
          </KeyboardAvoidingView>
        </ThemeScope>
      </GestureHandlerRootView>
    </RNModal>
  );
}
