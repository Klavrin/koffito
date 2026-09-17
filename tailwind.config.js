/** @type {import('tailwindcss').Config} */

// Color values live in src/theme/tokens.ts and are injected as CSS variables
// by KoffitoThemeProvider, so every color switches with light/dark mode.
const colorTokens = [
  "background",
  "surface",
  "surface-muted",
  "primary",
  "primary-pressed",
  "on-primary",
  "secondary",
  "on-secondary",
  "accent",
  "foreground",
  "muted",
  "border",
  "success",
  "success-soft",
  "warning",
  "warning-soft",
  "error",
  "error-soft",
  "overlay",
];

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: Object.fromEntries(
        colorTokens.map((token) => [token, `rgb(var(--color-${token}) / <alpha-value>)`]),
      ),
      fontFamily: {
        body: ["Nunito_400Regular"],
        "body-medium": ["Nunito_600SemiBold"],
        "body-bold": ["Nunito_700Bold"],
        heading: ["Nunito_800ExtraBold"],
      },
      borderRadius: {
        sheet: "32px",
      },
    },
  },
  plugins: [],
};
