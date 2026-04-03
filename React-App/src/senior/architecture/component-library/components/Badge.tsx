// REUSABLE COMPONENT LIBRARY — Badge.tsx
//
// Patterns:
//   ✅ Color prop — maps to design tokens (COLOR_MAP)
//   ✅ dot mode  — shows a colored dot instead of text (status indicator)
//   ✅ removable — shows ✕ button, fires onRemove callback

import React from "react";
import { COLOR_MAP } from "../tokens";
import type { Color } from "../types";

export interface BadgeProps {
  color?:     Color;
  dot?:       boolean;
  removable?: boolean;
  onRemove?:  () => void;
  children?:  React.ReactNode;
  style?:     React.CSSProperties;
}

export const Badge = ({
  color    = "blue",
  dot      = false,
  removable = false,
  onRemove,
  children,
  style,
}: BadgeProps) => {
  const c = COLOR_MAP[color];

  if (dot) {
    return (
      <span
        style={{
          display:      "inline-block",
          width:        8,
          height:       8,
          borderRadius: "50%",
          background:   c.text,
          ...style,
        }}
        aria-hidden
      />
    );
  }

  return (
    <span
      style={{
        display:      "inline-flex",
        alignItems:   "center",
        gap:          4,
        padding:      "2px 9px",
        borderRadius: 20,
        fontSize:     11,
        fontWeight:   700,
        background:   c.bg,
        color:        c.text,
        border:       `1px solid ${c.border}`,
        whiteSpace:   "nowrap",
        ...style,
      }}
    >
      {children}
      {removable && (
        <button
          onClick={onRemove}
          aria-label="Remove"
          style={{ background: "none", border: "none", cursor: "pointer", color: c.text, fontSize: 11, padding: 0, lineHeight: 1, opacity: 0.7 }}
        >
          ✕
        </button>
      )}
    </span>
  );
};
