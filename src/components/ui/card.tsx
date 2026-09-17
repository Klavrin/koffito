import type { PropsWithChildren } from "react";
import { Pressable, View, type ViewProps } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { usePressScale } from "@/hooks/use-press-scale";
import { cn } from "@/lib/cn";
import { useKoffitoTheme } from "@/theme/theme-provider";
import { motion } from "@/theme/tokens";

export type CardVariant = "elevated" | "filled" | "outlined";
export type CardPadding = "none" | "sm" | "md" | "lg";

export type CardProps = PropsWithChildren<
  Omit<ViewProps, "style"> & {
    variant?: CardVariant;
    padding?: CardPadding;
    onPress?: () => void;
    /** Fade + rise in when the card mounts. Pass a number to stagger (index in a list). */
    animateIn?: boolean | number;
    className?: string;
  }
>;

const variantClasses: Record<CardVariant, string> = {
  elevated: "bg-surface",
  filled: "bg-surface-muted",
  outlined: "bg-surface border border-border",
};

const paddingClasses: Record<CardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

export function Card({
  variant = "elevated",
  padding = "md",
  onPress,
  animateIn = false,
  className,
  children,
  ...rest
}: CardProps) {
  const { shadows } = useKoffitoTheme();
  const { animatedStyle, onPressIn, onPressOut } = usePressScale(0.98);

  const entering =
    animateIn === false
      ? undefined
      : FadeInDown.duration(motion.base).delay(typeof animateIn === "number" ? animateIn * 60 : 0);

  const surface = (
    <View
      style={variant === "elevated" ? { boxShadow: shadows.soft } : undefined}
      className={cn("rounded-3xl", variantClasses[variant], paddingClasses[padding], className)}
      {...rest}>
      {children}
    </View>
  );

  return (
    <Animated.View entering={entering} style={onPress ? animatedStyle : undefined}>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}>
          {surface}
        </Pressable>
      ) : (
        surface
      )}
    </Animated.View>
  );
}
