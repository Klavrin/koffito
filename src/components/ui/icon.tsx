import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";

import { useKoffitoTheme } from "@/theme/theme-provider";
import type { ColorToken } from "@/theme/tokens";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export type IconProps = {
  name: IconName;
  size?: number;
  /** A design token name (e.g. "primary") or any raw color. */
  color?: ColorToken | (string & {});
};

/** Rounded Ionicons glyph colored with Koffito tokens. */
export function Icon({ name, size = 20, color = "foreground" }: IconProps) {
  const { colors } = useKoffitoTheme();
  const resolved = color in colors ? colors[color as ColorToken] : color;

  return <Ionicons name={name} size={size} color={resolved} />;
}
