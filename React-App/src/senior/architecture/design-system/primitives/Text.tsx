// DESIGN SYSTEM — primitives/Text.tsx
//
// Typography primitive — the correct way to render text in a design system.
// Instead of scattering fontSize/fontWeight everywhere, use a variant.
//
// ✅  <Text variant="heading">Title</Text>
// ❌  <p style={{ fontSize: 24, fontWeight: 700 }}>Title</p>
//
// Theme-aware: automatically uses the right text color for light/dark mode.

import React from "react";
import { useTheme } from "../theme/ThemeContext";
import { TEXT_VARIANTS } from "../tokens/typography";
import type { TextVariant } from "../tokens/typography";

type TextColor = "default" | "muted" | "primary" | "success" | "warning" | "danger" | "inverse";
type TextAs    = "p" | "span" | "h1" | "h2" | "h3" | "h4" | "label" | "code" | "div";

export interface TextProps {
  variant?:  TextVariant;
  color?:    TextColor;
  as?:       TextAs;
  children?: React.ReactNode;
  style?:    React.CSSProperties;
}

export const Text = ({
  variant = "body",
  color   = "default",
  as:     Tag = "span",
  children,
  style,
}: TextProps) => {
  const { theme } = useTheme();

  const colorMap: Record<TextColor, string> = {
    default: theme.colors.text,
    muted:   theme.colors.textMuted,
    primary: theme.colors.primary,
    success: theme.colors.success,
    warning: theme.colors.warning,
    danger:  theme.colors.danger,
    inverse: theme.colors.textInverse,
  };

  return (
    <Tag
      style={{
        margin:  0,
        padding: 0,
        ...TEXT_VARIANTS[variant],
        color: colorMap[color],
        ...style,
      }}
    >
      {children}
    </Tag>
  );
};
