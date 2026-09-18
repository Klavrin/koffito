import type { PropsWithChildren } from "react";
import { Pressable, Modal as RNModal, View } from "react-native";
import Animated, { Easing, withTiming } from "react-native-reanimated";

import { cn } from "@/lib/cn";
import { ThemeScope, useKoffitoTheme } from "@/theme/theme-provider";
import { motion } from "@/theme/tokens";
import { Button, type ButtonProps } from "./button";
import { Icon, type IconName } from "./icon";
import { Text } from "./text";

type ModalAction = Omit<ButtonProps, "fullWidth" | "size">;

export type ModalProps = PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  emoji?: string;
  icon?: IconName;
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
  /** Allow closing by tapping the backdrop / back button. */
  dismissible?: boolean;
  className?: string;
}>;

/** Soft fade + slight scale-up, eased out with no overshoot. */
function cardEntering() {
  "worklet";
  const config = { duration: motion.base, easing: Easing.out(Easing.cubic) };

  return {
    initialValues: { opacity: 0, transform: [{ scale: 0.95 }] },
    animations: {
      opacity: withTiming(1, config),
      transform: [{ scale: withTiming(1, config) }],
    },
  };
}

export function Modal({
  visible,
  onClose,
  title,
  description,
  emoji,
  icon,
  primaryAction,
  secondaryAction,
  dismissible = true,
  className,
  children,
}: ModalProps) {
  const { shadows } = useKoffitoTheme();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={dismissible ? onClose : undefined}>
      <ThemeScope>
        <View className="flex-1 items-center justify-center bg-overlay/40 px-6">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            className="absolute inset-0"
            disabled={!dismissible}
            onPress={onClose}
          />

          {visible && (
            <Animated.View accessibilityViewIsModal entering={cardEntering} className="w-full max-w-sm">
              <View
                style={{ boxShadow: shadows.raised }}
                className={cn("items-center gap-5 rounded-[32px] bg-surface p-6", className)}>
                {(emoji || icon) && (
                  <View className="h-16 w-16 items-center justify-center rounded-full bg-secondary">
                    {emoji ? (
                      <Text className="text-3xl leading-10">{emoji}</Text>
                    ) : (
                      icon && <Icon name={icon} size={28} color="on-secondary" />
                    )}
                  </View>
                )}

                <View className="items-center gap-1.5">
                  <Text variant="title" className="text-center" accessibilityRole="header">
                    {title}
                  </Text>
                  {description && (
                    <Text tone="muted" className="text-center">
                      {description}
                    </Text>
                  )}
                </View>

                {children}

                {(primaryAction || secondaryAction) && (
                  <View className="gap-2 self-stretch">
                    {primaryAction && <Button fullWidth {...primaryAction} />}
                    {secondaryAction && <Button variant="ghost" fullWidth {...secondaryAction} />}
                  </View>
                )}
              </View>
            </Animated.View>
          )}
        </View>
      </ThemeScope>
    </RNModal>
  );
}
