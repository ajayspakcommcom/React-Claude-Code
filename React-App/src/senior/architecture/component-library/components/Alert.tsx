// REUSABLE COMPONENT LIBRARY — Alert.tsx
//
// Patterns:
//   ✅ Variant prop  — info/success/warning/error map to colors via ALERT_MAP token
//   ✅ Dismissible   — controlled: onDismiss callback, not internal state
//                      (parent decides if/when to hide; component stays pure)
//   ✅ role="alert"  — screen readers announce immediately on mount

import React from "react";
import { ALERT_MAP } from "../tokens";
import type { AlertVariant } from "../types";

export interface AlertProps {
  variant?:    AlertVariant;
  title?:      string;
  children?:   React.ReactNode;
  dismissible?: boolean;
  onDismiss?:  () => void;
  style?:      React.CSSProperties;
}

export const Alert = ({
  variant    = "info",
  title,
  children,
  dismissible = false,
  onDismiss,
  style,
}: AlertProps) => {
  const t = ALERT_MAP[variant];

  return (
    <div
      role="alert"
      style={{
        display:      "flex",
        gap:          12,
        padding:      "12px 16px",
        borderRadius: 10,
        border:       `1.5px solid ${t.border}`,
        background:   t.bg,
        color:        t.text,
        fontSize:     14,
        lineHeight:   1.5,
        ...style,
      }}
    >
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{t.icon}</span>

      <div style={{ flex: 1 }}>
        {title && <div style={{ fontWeight: 700, marginBottom: children ? 4 : 0 }}>{title}</div>}
        {children}
      </div>

      {dismissible && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{ background: "none", border: "none", cursor: "pointer", color: t.text, fontSize: 16, padding: "0 2px", opacity: 0.7, flexShrink: 0, alignSelf: "flex-start" }}
        >
          ✕
        </button>
      )}
    </div>
  );
};
