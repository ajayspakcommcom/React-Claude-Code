// REUSABLE COMPONENT LIBRARY — tokens.ts
//
// Design tokens: single source of truth for colors, sizing, and spacing.
// Components import from here — change a token, update the whole library.
// In production these often become CSS custom properties (--color-primary: ...).

import type { Size, Variant, AlertVariant, Color } from "./types";

export const RADIUS: Record<Size, number> = {
  sm: 6, md: 8, lg: 10, xl: 12,
};

export const FONT_SIZE: Record<Size, number> = {
  sm: 12, md: 14, lg: 15, xl: 16,
};

// Button / badge padding per size
export const BTN_PADDING: Record<Size, string> = {
  sm: "5px 12px", md: "8px 16px", lg: "10px 20px", xl: "13px 26px",
};

// Semantic color sets used by Alert, Badge, etc.
export const COLOR_MAP: Record<Color, { bg: string; text: string; border: string }> = {
  blue:   { bg: "#dbeafe", text: "#1d4ed8", border: "#bfdbfe" },
  green:  { bg: "#dcfce7", text: "#166534", border: "#bbf7d0" },
  red:    { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" },
  yellow: { bg: "#fef3c7", text: "#92400e", border: "#fde68a" },
  gray:   { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" },
  purple: { bg: "#ede9fe", text: "#6d28d9", border: "#ddd6fe" },
};

// Button variant → fill colour
export const VARIANT_BASE: Record<Variant, { bg: string; color: string; border: string; hoverBg: string }> = {
  primary:   { bg: "#3b82f6", color: "#fff",     border: "#3b82f6", hoverBg: "#2563eb" },
  secondary: { bg: "#fff",    color: "#374151",   border: "#d1d5db", hoverBg: "#f9fafb" },
  danger:    { bg: "#ef4444", color: "#fff",     border: "#ef4444", hoverBg: "#dc2626" },
  ghost:     { bg: "transparent", color: "#374151", border: "transparent", hoverBg: "#f1f5f9" },
  link:      { bg: "transparent", color: "#3b82f6", border: "transparent", hoverBg: "transparent" },
};

export const ALERT_MAP: Record<AlertVariant, { bg: string; border: string; text: string; icon: string }> = {
  info:    { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", icon: "ℹ️" },
  success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", icon: "✅" },
  warning: { bg: "#fffbeb", border: "#fde68a", text: "#92400e", icon: "⚠️" },
  error:   { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", icon: "❌" },
};
