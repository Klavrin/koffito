import { type PropsWithChildren, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Modal as RNModal,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
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
      translateY.value = withTiming(0, { duration: motion.slow, easing: Easing.out(Easing.cubic) });
    } else if (mounted) {
      translateY.value = withTiming(
        screenHeight,
        { duration: motion.base, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        },
      );
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
        translateY.value = withTiming(0, { duration: motion.base, easing: Easing.out(Easing.cubic) });
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
          {/* Animated wrappers stay class-less; colors live on the plain views inside them. */}
          <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              className="flex-1 bg-overlay/40"
              disabled={!dismissible}
              onPress={onClose}
            />
          </Animated.View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            pointerEvents="box-none"
            className="flex-1 justify-end">
            <GestureDetector gesture={pan}>
              <Animated.View accessibilityViewIsModal style={sheetStyle}>
                <View
                  style={{
                    boxShadow: shadows.raised,
                    paddingBottom: Math.max(insets.bottom, 20),
                    maxHeight: screenHeight * 0.9,
                  }}
                  className={cn("rounded-t-sheet bg-surface px-6 pt-3", className)}>
                  <View className="mb-4 h-1.5 w-11 self-center rounded-full bg-border" />
                  {(title || description) && (
                    <View className="mb-4 gap-1">
                      {title && <Text variant="title">{title}</Text>}
                      {description && <Text tone="muted">{description}</Text>}
                    </View>
                  )}
                  {children}
                </View>
              </Animated.View>
            </GestureDetector>
          </KeyboardAvoidingView>
        </ThemeScope>
      </GestureHandlerRootView>
    </RNModal>
  );
}
