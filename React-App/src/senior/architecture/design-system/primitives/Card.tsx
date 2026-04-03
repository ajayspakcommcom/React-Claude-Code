// DESIGN SYSTEM — primitives/Card.tsx
//
// Surface primitive — a themed container.
// Background, border, and shadow all come from the current theme.
// Switch to dark mode: every Card updates automatically.
//
// Variants:
//   default  — standard surface (white / slate-800)
//   outline  — border only, transparent bg
//   elevated — stronger shadow, used for modals / dropdowns

import React from "react";
import { useTheme } from "../theme/ThemeContext";
import { space, radii } from "../tokens/spacing";

type SpaceKey  = keyof typeof space;
type ShadowKey = "sm" | "md" | "lg" | "xl";
type CardVariant = "default" | "outline" | "elevated";

export interface CardProps {
  variant?:  CardVariant;
  padding?:  SpaceKey;
  shadow?:   ShadowKey;
  radius?:   keyof typeof radii;
  style?:    React.CSSProperties;
  children?: React.ReactNode;
}

export const Card = ({
  variant = "default",
  padding = 6,
  shadow  = "md",
  radius  = "lg",
  style,
  children,
}: CardProps) => {
  const { theme } = useTheme();

  const variantStyles: Record<CardVariant, React.CSSProperties> = {
    default: {
      background: theme.colors.surface,
      border:     `1px solid ${theme.colors.border}`,
      boxShadow:  theme.shadows[shadow] ?? "none",
    },
    outline: {
      background: "transparent",
      border:     `1.5px solid ${theme.colors.borderStrong}`,
      boxShadow:  "none",
    },
    elevated: {
      background: theme.colors.surface,
      border:     `1px solid ${theme.colors.border}`,
      boxShadow:  theme.shadows.xl,
    },
  };

  return (
    <div
      style={{
        borderRadius: radii[radius],
        padding:      space[padding],
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </div>
  );
};
