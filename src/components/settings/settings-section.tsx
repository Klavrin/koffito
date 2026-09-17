import { Children, type PropsWithChildren } from "react";
import { Pressable, Switch, View } from "react-native";

import { Card, Icon, type IconName, Text } from "@/components/ui";
import { useKoffitoTheme } from "@/theme/theme-provider";

export type SettingsSectionProps = PropsWithChildren<{ title: string }>;

/** Titled card grouping `SettingsRow`s, with soft dividers between them. */
export function SettingsSection({ title, children }: SettingsSectionProps) {
  const rows = Children.toArray(children);

  return (
    <View className="gap-2">
      <Text variant="label" tone="muted" className="px-2" accessibilityRole="header">
        {title}
      </Text>
      <Card padding="none" className="px-4">
        {rows.map((row, index) => (
          <View key={index}>
            {index > 0 && <View className="h-px bg-border" />}
            {row}
          </View>
        ))}
      </Card>
    </View>
  );
}

export type SettingsRowProps = {
  icon: IconName;
  label: string;
  description?: string;
  /** Navigates somewhere; shows a chevron. */
  onPress?: () => void;
  /** Turns the row into a switch. */
  toggle?: { value: boolean; onChange: (value: boolean) => void };
  tone?: "default" | "error";
};

export function SettingsRow({ icon, label, description, onPress, toggle, tone = "default" }: SettingsRowProps) {
  const { colors } = useKoffitoTheme();
  const destructive = tone === "error";

  const content = (
    <View className="min-h-[60px] flex-row items-center gap-3 py-3">
      <View className={destructive ? "h-10 w-10 items-center justify-center rounded-full bg-error-soft" : "h-10 w-10 items-center justify-center rounded-full bg-surface-muted"}>
        <Icon name={icon} size={20} color={destructive ? "error" : "primary"} />
      </View>
      <View className="flex-1">
        <Text variant="label" tone={destructive ? "error" : "default"}>
          {label}
        </Text>
        {description && (
          <Text variant="caption" tone="muted">
            {description}
          </Text>
        )}
      </View>
      {toggle ? (
        <Switch
          accessibilityLabel={label}
          value={toggle.value}
          onValueChange={toggle.onChange}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor={colors.surface}
        />
      ) : (
        onPress && !destructive && <Icon name="chevron-forward" size={18} color="muted" />
      )}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      {content}
    </Pressable>
  );
}
