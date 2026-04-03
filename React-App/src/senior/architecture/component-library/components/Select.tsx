// REUSABLE COMPONENT LIBRARY — Select.tsx
//
// Patterns:
//   ✅ forwardRef — ref lands on the <select> element
//   ✅ useId      — auto-links label + select
//   ✅ options[]  — declarative array API instead of <option> children
//   ✅ Same FormFieldProps as Input — predictable API across all form controls

import React, { useId } from "react";
import type { FormFieldProps } from "../types";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "id">,
    FormFieldProps {
  options:     SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, id, options, placeholder, disabled, style, ...rest }, ref) => {
    const autoId  = useId();
    const selId   = id ?? autoId;
    const errorId = `${selId}-error`;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {label && (
          <label htmlFor={selId} style={s.label}>{label}</label>
        )}

        <select
          ref={ref}
          id={selId}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          style={{
            ...s.select,
            borderColor: error ? "#f87171" : "#d1d5db",
            background:  disabled ? "#f9fafb" : "#fff",
            color:       disabled ? "#9ca3af" : "#111827",
            cursor:      disabled ? "not-allowed" : "pointer",
            ...style,
          }}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {error && (
          <span id={errorId} role="alert" style={s.error}>{error}</span>
        )}
        {!error && helperText && (
          <span style={s.helper}>{helperText}</span>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

const s: Record<string, React.CSSProperties> = {
  label:  { fontSize: 13, fontWeight: 600, color: "#374151" },
  select: { width: "100%", padding: "8px 10px", fontSize: 14, border: "1.5px solid", borderRadius: 8, outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.15s" },
  error:  { fontSize: 12, color: "#dc2626" },
  helper: { fontSize: 12, color: "#6b7280" },
};
