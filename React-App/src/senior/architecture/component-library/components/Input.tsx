// REUSABLE COMPONENT LIBRARY — Input.tsx
//
// Patterns demonstrated:
//   ✅ React.forwardRef  — parent can call inputRef.current.focus()
//   ✅ useId (React 18) — auto-generates unique id so label htmlFor always matches
//   ✅ aria-invalid      — screen readers announce "invalid" on error
//   ✅ aria-describedby  — links input → error/helper text for screen readers
//   ✅ Leading / trailing icon slots
//   ✅ Consistent FormFieldProps (label, error, helperText) shared across library

import React, { useId } from "react";
import type { FormFieldProps } from "../types";

// ── Props ─────────────────────────────────────────────────────────────────────

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id">,
    FormFieldProps {
  leadingIcon?:  React.ReactNode;
  trailingIcon?: React.ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { label, error, helperText, id, leadingIcon, trailingIcon, disabled, style, ...rest },
    ref
  ) => {
    const autoId     = useId();
    const inputId    = id ?? autoId;
    const errorId    = `${inputId}-error`;
    const helperId   = `${inputId}-helper`;
    const describedBy = [
      error      ? errorId  : null,
      helperText ? helperId : null,
    ].filter(Boolean).join(" ") || undefined;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {label && (
          <label htmlFor={inputId} style={s.label}>
            {label}
          </label>
        )}

        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          {leadingIcon && <span style={s.leadIcon}>{leadingIcon}</span>}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            style={{
              ...s.input,
              paddingLeft:  leadingIcon  ? 36 : 10,
              paddingRight: trailingIcon ? 36 : 10,
              borderColor:  error ? "#f87171" : "#d1d5db",
              background:   disabled ? "#f9fafb" : "#fff",
              cursor:       disabled ? "not-allowed" : "text",
              color:        disabled ? "#9ca3af" : "#111827",
              ...style,
            }}
            {...rest}
          />

          {trailingIcon && <span style={s.trailIcon}>{trailingIcon}</span>}
        </div>

        {error && (
          <span id={errorId} role="alert" style={s.error}>{error}</span>
        )}
        {!error && helperText && (
          <span id={helperId} style={s.helper}>{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  label:     { fontSize: 13, fontWeight: 600, color: "#374151" },
  input:     { width: "100%", padding: "8px 10px", fontSize: 14, border: "1.5px solid", borderRadius: 8, outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.15s" },
  leadIcon:  { position: "absolute", left: 10, color: "#9ca3af", display: "flex", alignItems: "center", pointerEvents: "none" },
  trailIcon: { position: "absolute", right: 10, color: "#9ca3af", display: "flex", alignItems: "center", pointerEvents: "none" },
  error:     { fontSize: 12, color: "#dc2626" },
  helper:    { fontSize: 12, color: "#6b7280" },
};
