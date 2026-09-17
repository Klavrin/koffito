import { Pressable, type PressableProps, View } from "react-native";
import Animated from "react-native-reanimated";

import { usePressScale } from "@/hooks/use-press-scale";
import { cn } from "@/lib/cn";
import { useKoffitoTheme } from "@/theme/theme-provider";
import type { ColorToken } from "@/theme/tokens";
import { Icon, type IconName } from "./icon";

export type IconButtonVariant = "primary" | "secondary" | "surface" | "ghost";
export type IconButtonSize = "sm" | "md" | "lg";

export type IconButtonProps = Omit<PressableProps, "children" | "style"> & {
  icon: IconName;
  /** Required: icon-only buttons need a spoken label. */
  accessibilityLabel: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  className?: string;
};

const variantStyles: Record<IconButtonVariant, { base: string; pressed: string; color: ColorToken }> = {
  primary: { base: "bg-primary", pressed: "bg-primary-pressed", color: "on-primary" },
  secondary: { base: "bg-secondary", pressed: "bg-secondary/80", color: "on-secondary" },
  surface: { base: "bg-surface", pressed: "bg-surface-muted", color: "foreground" },
  ghost: { base: "bg-transparent", pressed: "bg-primary/10", color: "foreground" },
};

const sizeStyles: Record<IconButtonSize, { box: string; icon: number }> = {
  sm: { box: "h-9 w-9", icon: 18 },
  md: { box: "h-11 w-11", icon: 22 },
  lg: { box: "h-14 w-14", icon: 26 },
};

export function IconButton({
  icon,
  variant = "surface",
  size = "md",
  disabled,
  className,
  onPressIn,
  onPressOut,
  ...rest
}: IconButtonProps) {
  const { shadows } = useKoffitoTheme();
  const { animatedStyle, onPressIn: scaleIn, onPressOut: scaleOut } = usePressScale(0.92);
  const styles = variantStyles[variant];

  return (
    <Animated.View style={animatedStyle} className="self-start">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        // Small buttons still get a 44pt touch target.
        hitSlop={size === "sm" ? 4 : undefined}
        onPressIn={(event) => {
          scaleIn();
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scaleOut();
          onPressOut?.(event);
        }}
        className={cn(disabled && "opacity-50")}
        {...rest}>
        {({ pressed }) => (
          <View
            style={variant === "surface" ? { boxShadow: shadows.soft } : undefined}
            className={cn(
              "items-center justify-center rounded-full",
              sizeStyles[size].box,
              styles.base,
              pressed && styles.pressed,
              className,
            )}>
            <Icon name={icon} size={sizeStyles[size].icon} color={styles.color} />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}
