// DESIGN SYSTEM — tokens/colors.ts
//
// Token hierarchy (3 levels):
//
//   Level 1 — Global palette  (raw hex values, not used directly in components)
//   Level 2 — Semantic tokens (give meaning: primary, success, danger…)
//   Level 3 — Theme tokens    (light/dark overrides — live in themes.ts)
//
// Rule: components consume semantic/theme tokens, NEVER the raw palette.
//   ✅  background: theme.colors.surface
//   ❌  background: palette.gray[50]

// ── Level 1: Global palette ───────────────────────────────────────────────────

export const palette = {
  blue: {
    50:  "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd",
    400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8",
    800: "#1e40af", 900: "#1e3a8a",
  },
  green: {
    50:  "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 300: "#86efac",
    400: "#4ade80", 500: "#22c55e", 600: "#16a34a", 700: "#15803d",
    800: "#166534", 900: "#14532d",
  },
  red: {
    50:  "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5",
    400: "#f87171", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c",
    800: "#991b1b", 900: "#7f1d1d",
  },
  yellow: {
    50:  "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d",
    400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309",
    800: "#92400e", 900: "#78350f",
  },
  purple: {
    50:  "#faf5ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd",
    400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9",
    800: "#5b21b6", 900: "#4c1d95",
  },
  gray: {
    50:  "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 300: "#d1d5db",
    400: "#9ca3af", 500: "#6b7280", 600: "#4b5563", 700: "#374151",
    800: "#1f2937", 900: "#111827",
  },
  // True blacks and whites
  white: "#ffffff",
  black: "#000000",
};

// ── Level 2: Semantic tokens ──────────────────────────────────────────────────
// Maps intent → palette. Swap palette here = rebrand everywhere.

export const semantic = {
  primary:       palette.blue[500],
  primaryLight:  palette.blue[100],
  primaryDark:   palette.blue[700],

  success:       palette.green[500],
  successLight:  palette.green[100],
  successDark:   palette.green[700],

  warning:       palette.yellow[500],
  warningLight:  palette.yellow[100],
  warningDark:   palette.yellow[700],

  danger:        palette.red[500],
  dangerLight:   palette.red[100],
  dangerDark:    palette.red[700],

  neutral:       palette.gray[500],
  neutralLight:  palette.gray[100],
  neutralDark:   palette.gray[700],
};

// Used by the Tokens explorer in the demo
export const PALETTE_SCALES = [
  { name: "blue",   label: "Blue (Primary)",  scale: palette.blue },
  { name: "green",  label: "Green (Success)", scale: palette.green },
  { name: "red",    label: "Red (Danger)",    scale: palette.red },
  { name: "yellow", label: "Yellow (Warning)",scale: palette.yellow },
  { name: "purple", label: "Purple",          scale: palette.purple },
  { name: "gray",   label: "Gray (Neutral)",  scale: palette.gray },
] as const;
