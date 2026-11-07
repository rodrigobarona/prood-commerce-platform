import { defineTheme } from "c15t/next"

/**
 * The banner follows the @prood/ui tokens, so light and dark mode, and a
 * store's own theme, apply to it without a second palette.
 */
export const consentTheme = defineTheme({
  colors: {
    primary: "var(--primary)",
    primaryHover: "color-mix(in oklab, var(--primary) 88%, black)",
    surface: "var(--card)",
    surfaceHover: "var(--muted)",
    border: "var(--border)",
    borderHover: "var(--input)",
    text: "var(--foreground)",
    textMuted: "var(--muted-foreground)",
    textOnPrimary: "var(--primary-foreground)",
    switchTrack: "var(--input)",
    switchTrackActive: "var(--primary)",
  },
  typography: { fontFamily: "inherit" },
  radius: { sm: "6px", md: "8px", lg: "12px" },
})
