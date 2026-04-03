// DESIGN SYSTEM — tokens/spacing.ts
//
// 4px base unit — every spacing value is a multiple of 4.
// This creates visual rhythm and consistency across the entire UI.
//
// Usage:  gap: space[4]   →  16px
//         padding: space[6] → 24px

export const space = {
  0:  0,
  px: 1,
  0.5: 2,
  1:  4,
  1.5: 6,
  2:  8,
  2.5: 10,
  3:  12,
  3.5: 14,
  4:  16,
  5:  20,
  6:  24,
  7:  28,
  8:  32,
  9:  36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  32: 128,
} as const;

export const radii = {
  none:  0,
  sm:    4,
  md:    8,
  lg:    12,
  xl:    16,
  "2xl": 20,
  full:  9999,
} as const;

// For the spacing scale explorer in the demo
export const SPACE_SCALE = Object.entries(space)
  .filter(([k]) => Number(k) >= 1 && Number(k) <= 16)
  .map(([key, value]) => ({ key, value }));
