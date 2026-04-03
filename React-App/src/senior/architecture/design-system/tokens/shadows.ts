// DESIGN SYSTEM — tokens/shadows.ts
//
// Elevation levels — use shadow to communicate depth.
// sm = subtle float, xl = modal/overlay

export const shadows = {
  none: "none",
  sm:   "0 1px 2px rgba(0,0,0,0.05)",
  md:   "0 4px 12px rgba(0,0,0,0.08)",
  lg:   "0 8px 24px rgba(0,0,0,0.12)",
  xl:   "0 16px 48px rgba(0,0,0,0.16)",
  "2xl":"0 24px 64px rgba(0,0,0,0.22)",

  // Dark mode versions (stronger — needed on dark bg)
  darkSm:  "0 1px 3px rgba(0,0,0,0.3)",
  darkMd:  "0 4px 12px rgba(0,0,0,0.4)",
  darkLg:  "0 8px 24px rgba(0,0,0,0.5)",
  darkXl:  "0 16px 48px rgba(0,0,0,0.6)",
} as const;

export type ShadowKey = "none" | "sm" | "md" | "lg" | "xl" | "2xl";
