import { createContext, type PropsWithChildren, useContext, useMemo } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";
import { vars } from "nativewind";

import "@/lib/interop";
import { type ColorScheme, palette, shadows, type ThemeColors } from "./tokens";

type KoffitoTheme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  shadows: (typeof shadows)[ColorScheme];
};

const ThemeContext = createContext<KoffitoTheme | null>(null);

function hexToTriplet(hex: string) {
  const value = parseInt(hex.slice(1), 16);
  return `${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255}`;
}

const cssVars = {
  light: vars(
    Object.fromEntries(
      Object.entries(palette.light).map(([key, hex]) => [`--color-${key}`, hexToTriplet(hex)]),
    ),
  ),
  dark: vars(
    Object.fromEntries(
      Object.entries(palette.dark).map(([key, hex]) => [`--color-${key}`, hexToTriplet(hex)]),
    ),
  ),
};

export function KoffitoThemeProvider({ children }: PropsWithChildren) {
  const scheme: ColorScheme = useColorScheme() === "dark" ? "dark" : "light";

  const theme = useMemo(
    () => ({ scheme, colors: palette[scheme], shadows: shadows[scheme] }),
    [scheme],
  );

  return (
    <ThemeContext.Provider value={theme}>
      <View style={[cssVars[scheme], { flex: 1 }]} className="bg-background">
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

/**
 * Re-applies the theme's CSS variables. Needed inside native modals/portals,
 * which render outside the provider's root view.
 */
export function ThemeScope({ children }: PropsWithChildren) {
  const { scheme } = useKoffitoTheme();

  return <View style={[cssVars[scheme], StyleSheet.absoluteFill]}>{children}</View>;
}

export function useKoffitoTheme() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error("useKoffitoTheme must be used within a KoffitoThemeProvider");
  }

  return value;
}
