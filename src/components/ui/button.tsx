import { ActivityIndicator, Pressable, type PressableProps, View } from "react-native";
import Animated from "react-native-reanimated";

import { usePressScale } from "@/hooks/use-press-scale";
import { cn } from "@/lib/cn";
import { useKoffitoTheme } from "@/theme/theme-provider";
import type { ColorToken } from "@/theme/tokens";
import { Icon, type IconName } from "./icon";
import { Text, type TextTone } from "./text";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: IconName;
  rightIcon?: IconName;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
};

const variantStyles: Record<
  ButtonVariant,
  { base: string; pressed: string; color: ColorToken & TextTone }
> = {
  primary: { base: "bg-primary", pressed: "bg-primary-pressed", color: "on-primary" },
  secondary: { base: "bg-secondary", pressed: "bg-secondary/80", color: "on-secondary" },
  outline: { base: "border-2 border-primary/40", pressed: "bg-primary/10", color: "primary" },
  ghost: { base: "bg-transparent", pressed: "bg-primary/10", color: "primary" },
  destructive: { base: "bg-error", pressed: "bg-error/85", color: "on-primary" },
};

const sizeStyles: Record<ButtonSize, { container: string; gap: string; text: string; icon: number }> = {
  sm: { container: "min-h-11 px-4", gap: "gap-1.5", text: "text-sm", icon: 16 },
  md: { container: "min-h-[52px] px-6", gap: "gap-2", text: "text-base", icon: 18 },
  lg: { container: "min-h-[60px] px-8", gap: "gap-2.5", text: "text-lg", icon: 20 },
};

export function Button({
  title,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  loading = false,
  fullWidth = false,
  disabled,
  className,
  onPressIn,
  onPressOut,
  ...rest
}: ButtonProps) {
  const { colors } = useKoffitoTheme();
  const { animatedStyle, onPressIn: scaleIn, onPressOut: scaleOut } = usePressScale();
  const isDisabled = !!disabled || loading;
  const styles = variantStyles[variant];
  const sizing = sizeStyles[size];

  return (
    <Animated.View style={animatedStyle} className={fullWidth ? "self-stretch" : "self-start"}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        onPressIn={(event) => {
          scaleIn();
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scaleOut();
          onPressOut?.(event);
        }}
        className={cn(isDisabled && "opacity-50")}
        {...rest}>
        {({ pressed }) => (
          <View
            className={cn(
              "flex-row items-center justify-center rounded-full",
              sizing.container,
              styles.base,
              pressed && styles.pressed,
              className,
            )}>
            {/* Content stays in the layout while loading so the button keeps its width. */}
            <View className={cn("flex-row items-center", sizing.gap, loading && "opacity-0")}>
              {leftIcon && <Icon name={leftIcon} size={sizing.icon} color={styles.color} />}
              <Text variant="label" tone={styles.color} className={sizing.text}>
                {title}
              </Text>
              {rightIcon && <Icon name={rightIcon} size={sizing.icon} color={styles.color} />}
            </View>
            {loading && (
              <View className="absolute inset-0 items-center justify-center">
                <ActivityIndicator color={colors[styles.color]} />
              </View>
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}
