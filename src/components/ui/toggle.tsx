import { Platform, Switch } from "react-native";

import { useKoffitoTheme } from "@/theme/theme-provider";

export type ToggleProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Required: a switch on its own has no visible label. */
  accessibilityLabel: string;
  disabled?: boolean;
};

/** Themed on/off switch in the warm palette. */
export function Toggle({ value, onValueChange, accessibilityLabel, disabled }: ToggleProps) {
  const { colors } = useKoffitoTheme();

  // react-native-web colors the "on" thumb separately and defaults it to teal.
  const webProps = Platform.OS === "web" ? { activeThumbColor: colors.surface } : {};

  return (
    <Switch
      accessibilityLabel={accessibilityLabel}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ true: colors.primary, false: colors.border }}
      thumbColor={colors.surface}
      ios_backgroundColor={colors.border}
      {...webProps}
    />
  );
}
