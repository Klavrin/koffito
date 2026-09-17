/**
 * Koffito design tokens — the single source of truth for colors, radii, shadows and motion.
 * Colors are exposed to NativeWind as CSS variables by `KoffitoThemeProvider`
 * (see `tailwind.config.js`), and to JS via `useKoffitoTheme()`.
 */

export type ColorScheme = "light" | "dark";

const light = {
  background: "#FBF6EF",
  surface: "#FFFDF9",
  "surface-muted": "#F3EAE0",
  primary: "#9A5B34",
  "primary-pressed": "#7E4A2A",
  "on-primary": "#FFFDF9",
  secondary: "#F4D3B8",
  "on-secondary": "#5A3622",
  accent: "#C8664A",
  foreground: "#3B2A20",
  muted: "#7A6A5F",
  border: "#EADFD3",
  success: "#4F8259",
  "success-soft": "#E3F0E3",
  warning: "#9C6F1E",
  "warning-soft": "#F8ECD2",
  error: "#B24D46",
  "error-soft": "#F8E1DE",
  overlay: "#2A1A10",
};

const dark: typeof light = {
  background: "#1E1714",
  surface: "#2A211C",
  "surface-muted": "#362B24",
  primary: "#D49A6A",
  "primary-pressed": "#E2B089",
  "on-primary": "#2A1A10",
  secondary: "#5A3F30",
  "on-secondary": "#F6DCC6",
  accent: "#E0896C",
  foreground: "#F5EBE0",
  muted: "#B8A89A",
  border: "#3E322A",
  success: "#8CC49A",
  "success-soft": "#2C3A2E",
  warning: "#E3BD6F",
  "warning-soft": "#3D3222",
  error: "#E58A82",
  "error-soft": "#44292A",
  overlay: "#0E0A08",
};

export const palette = { light, dark };

export type ColorToken = keyof typeof light;
export type ThemeColors = Record<ColorToken, string>;

/** Warm tones for avatar initials fallbacks. */
export const avatarTones = {
  light: ["#F4D3B8", "#EBC9A9", "#E8D5C0", "#F2C6B4", "#DCCBB2"],
  dark: ["#5A3F30", "#4E3A2C", "#5C4433", "#553A35", "#4A4030"],
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
} as const;

export const shadows = {
  light: {
    soft: "0px 4px 16px rgba(92, 58, 34, 0.08)",
    raised: "0px 10px 30px rgba(92, 58, 34, 0.14)",
  },
  dark: {
    soft: "0px 4px 16px rgba(0, 0, 0, 0.35)",
    raised: "0px 10px 30px rgba(0, 0, 0, 0.5)",
  },
} as const;

export const motion = {
  fast: 150,
  base: 220,
  slow: 320,
  pressScale: 0.97,
  spring: { damping: 18, stiffness: 320, mass: 0.6 },
} as const;
