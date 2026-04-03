// DESIGN SYSTEM — primitives/Stack.tsx
//
// Layout primitive — replaces ad-hoc flexbox across the codebase.
// Uses the spacing scale (space tokens) for consistent gaps.
//
// ✅  <Stack gap={4} direction="row">...</Stack>    → gap: 16px
// ❌  <div style={{ display:"flex", gap: 16 }}>...  → hardcoded

import React from "react";
import { space } from "../tokens/spacing";

type SpaceKey = keyof typeof space;

export interface StackProps {
  direction?: "row" | "column";
  gap?:       SpaceKey;
  align?:     React.CSSProperties["alignItems"];
  justify?:   React.CSSProperties["justifyContent"];
  wrap?:      boolean;
  style?:     React.CSSProperties;
  children?:  React.ReactNode;
}

export const Stack = ({
  direction = "column",
  gap       = 4,
  align,
  justify,
  wrap      = false,
  style,
  children,
}: StackProps) => (
  <div
    style={{
      display:        "flex",
      flexDirection:  direction,
      gap:            space[gap],
      alignItems:     align,
      justifyContent: justify,
      flexWrap:       wrap ? "wrap" : undefined,
      ...style,
    }}
  >
    {children}
  </div>
);

// Convenience shortcuts
export const HStack = (props: Omit<StackProps, "direction">) => (
  <Stack direction="row" align="center" {...props} />
);

export const VStack = (props: Omit<StackProps, "direction">) => (
  <Stack direction="column" {...props} />
);
