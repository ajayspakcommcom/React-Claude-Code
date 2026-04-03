// DESIGN SYSTEM — theme/themes.ts
//
// A Theme is a set of semantic values for a specific colour mode.
// Components read from the theme — they never hardcode hex values.
//
// Swapping theme = the entire UI changes.
// This is the power of the design token → theme → component pipeline.

import { palette, semantic } from "../tokens/colors";
import { shadows } from "../tokens/shadows";

// ── Theme shape ───────────────────────────────────────────────────────────────

export interface Theme {
  name: "light" | "dark";
  colors: {
    // Backgrounds
    bg:          string;  // page background
    surface:     string;  // card / panel surface
    surfaceHover:string;  // hovered surface
    overlay:     string;  // modal overlay

    // Borders
    border:      string;
    borderStrong:string;

    // Text
    text:        string;  // primary text
    textMuted:   string;  // secondary / helper text
    textInverse: string;  // text on coloured bg

    // Brand / Interactive
    primary:     string;
    primaryHover:string;
    primaryFg:   string;  // foreground (text) on primary bg

    // Semantic
    success:     string;
    warning:     string;
    danger:      string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// ── Light theme ───────────────────────────────────────────────────────────────

export const lightTheme: Theme = {
  name: "light",
  colors: {
    bg:           palette.gray[50],
    surface:      palette.white,
    surfaceHover: palette.gray[100],
    overlay:      "rgba(0,0,0,0.45)",

    border:       palette.gray[200],
    borderStrong: palette.gray[300],

    text:         palette.gray[900],
    textMuted:    palette.gray[500],
    textInverse:  palette.white,

    primary:      semantic.primary,
    primaryHover: semantic.primaryDark,
    primaryFg:    palette.white,

    success:      semantic.success,
    warning:      semantic.warning,
    danger:       semantic.danger,
  },
  shadows: {
    sm: shadows.sm,
    md: shadows.md,
    lg: shadows.lg,
    xl: shadows.xl,
  },
};

// ── Dark theme ────────────────────────────────────────────────────────────────

export const darkTheme: Theme = {
  name: "dark",
  colors: {
    bg:           "#0f172a",   // slate-950
    surface:      "#1e293b",   // slate-800
    surfaceHover: "#334155",   // slate-700
    overlay:      "rgba(0,0,0,0.65)",

    border:       "#334155",   // slate-700
    borderStrong: "#475569",   // slate-600

    text:         "#f1f5f9",   // slate-100
    textMuted:    "#94a3b8",   // slate-400
    textInverse:  "#0f172a",

    primary:      palette.blue[400],   // lighter for dark bg
    primaryHover: palette.blue[300],
    primaryFg:    "#0f172a",

    success:      palette.green[400],
    warning:      palette.yellow[400],
    danger:       palette.red[400],
  },
  shadows: {
    sm: shadows.darkSm,
    md: shadows.darkMd,
    lg: shadows.darkLg,
    xl: shadows.darkXl,
  },
};
