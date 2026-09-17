import { View } from "react-native";

import { cn } from "@/lib/cn";
import type { ColorToken } from "@/theme/tokens";
import { Icon, type IconName } from "./icon";
import { Text, type TextTone } from "./text";

export type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "error";

export type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  icon?: IconName;
  /** Small colored dot before the label. */
  dot?: boolean;
  className?: string;
};

const variantStyles: Record<
  BadgeVariant,
  { container: string; dot: string; color: ColorToken & TextTone }
> = {
  neutral: { container: "bg-surface-muted", dot: "bg-muted", color: "muted" },
  primary: { container: "bg-secondary", dot: "bg-primary", color: "on-secondary" },
  success: { container: "bg-success-soft", dot: "bg-success", color: "success" },
  warning: { container: "bg-warning-soft", dot: "bg-warning", color: "warning" },
  error: { container: "bg-error-soft", dot: "bg-error", color: "error" },
};

export function Badge({ label, variant = "neutral", icon, dot = false, className }: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <View
      className={cn(
        "flex-row items-center gap-1 self-start rounded-full px-2.5 py-1",
        styles.container,
        className,
      )}>
      {dot && <View className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />}
      {icon && <Icon name={icon} size={13} color={styles.color} />}
      <Text variant="caption" tone={styles.color} className="font-body-bold text-xs">
        {label}
      </Text>
    </View>
  );
}
