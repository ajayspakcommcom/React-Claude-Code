// DESIGN SYSTEM — tokens/typography.ts
//
// A systematic type scale based on a 1.25 ratio (Major Third).
// Every size is intentional — no arbitrary pixel values in components.

export const fontSizes = {
  "2xs":  10,
  xs:     11,
  sm:     12,
  md:     14,  // default body
  lg:     16,
  xl:     20,
  "2xl":  24,
  "3xl":  30,
  "4xl":  36,
  "5xl":  48,
} as const;

export const fontWeights = {
  regular:   400,
  medium:    500,
  semibold:  600,
  bold:      700,
  extrabold: 800,
} as const;

export const lineHeights = {
  none:    1,
  tight:   1.25,
  snug:    1.375,
  normal:  1.5,
  relaxed: 1.625,
  loose:   2,
} as const;

export const letterSpacings = {
  tighter: "-0.05em",
  tight:   "-0.025em",
  normal:  "0em",
  wide:    "0.025em",
  wider:   "0.05em",
  widest:  "0.1em",
} as const;

export const fontFamilies = {
  sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'SF Mono', 'Fira Code', 'Fira Mono', 'Roboto Mono', monospace",
} as const;

// ── Named text variants ───────────────────────────────────────────────────────
// Used by the Text primitive — maps a semantic name to token values.

export type TextVariant = "display" | "heading" | "title" | "subheading" | "body" | "bodySmall" | "caption" | "label" | "code";

export const TEXT_VARIANTS: Record<TextVariant, React.CSSProperties> = {
  display:    { fontSize: fontSizes["4xl"], fontWeight: fontWeights.extrabold, lineHeight: lineHeights.tight,   letterSpacing: letterSpacings.tight },
  heading:    { fontSize: fontSizes["2xl"], fontWeight: fontWeights.bold,      lineHeight: lineHeights.snug },
  title:      { fontSize: fontSizes.xl,    fontWeight: fontWeights.bold,      lineHeight: lineHeights.snug },
  subheading: { fontSize: fontSizes.lg,    fontWeight: fontWeights.semibold,  lineHeight: lineHeights.normal },
  body:       { fontSize: fontSizes.md,    fontWeight: fontWeights.regular,   lineHeight: lineHeights.relaxed },
  bodySmall:  { fontSize: fontSizes.sm,    fontWeight: fontWeights.regular,   lineHeight: lineHeights.normal },
  caption:    { fontSize: fontSizes.xs,    fontWeight: fontWeights.regular,   lineHeight: lineHeights.normal },
  label:      { fontSize: fontSizes.xs,    fontWeight: fontWeights.semibold,  lineHeight: lineHeights.normal, letterSpacing: letterSpacings.wider, textTransform: "uppercase" },
  code:       { fontSize: fontSizes.sm,    fontWeight: fontWeights.regular,   lineHeight: lineHeights.relaxed, fontFamily: fontFamilies.mono },
};

import React from "react";
