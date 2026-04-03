// REUSABLE COMPONENT LIBRARY — Button.tsx
//
// Patterns demonstrated:
//   ✅ React.forwardRef — caller can access the DOM button (e.g. to .focus() it)
//   ✅ displayName    — shows "Button" in React DevTools instead of "ForwardRef"
//   ✅ Variant + Size — consistent prop names shared across the library
//   ✅ loading state  — disables + shows spinner, sets aria-busy
//   ✅ leftIcon / rightIcon — flexible icon slots
//   ✅ fullWidth      — stretches to container
//   ✅ ...rest spread — passes through href, onClick, type, etc.

import React from "react";
import { VARIANT_BASE, BTN_PADDING, FONT_SIZE, RADIUS } from "../tokens";
import type { Variant, Size } from "../types";

// ── Spinner ───────────────────────────────────────────────────────────────────

const Spinner = ({ size }: { size: Size }) => {
  const px = size === "sm" ? 12 : size === "lg" || size === "xl" ? 16 : 14;
  return (
    <svg
      width={px} height={px} viewBox="0 0 24 24" fill="none"
      style={{ animation: "cl-spin 0.7s linear infinite", flexShrink: 0 }}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
};

// ── Props ─────────────────────────────────────────────────────────────────────

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   Variant;
  size?:      Size;
  loading?:   boolean;
  fullWidth?: boolean;
  leftIcon?:  React.ReactNode;
  rightIcon?: React.ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant   = "primary",
      size      = "md",
      loading   = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      style,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const colors     = VARIANT_BASE[variant];

    const base: React.CSSProperties = {
      display:        "inline-flex",
      alignItems:     "center",
      justifyContent: "center",
      gap:            6,
      padding:        variant === "link" ? "0" : BTN_PADDING[size],
      fontSize:       FONT_SIZE[size],
      fontWeight:     600,
      fontFamily:     "inherit",
      borderRadius:   variant === "link" ? 0 : RADIUS[size],
      border:         `2px solid ${colors.border}`,
      background:     colors.bg,
      color:          colors.color,
      cursor:         isDisabled ? "not-allowed" : "pointer",
      opacity:        isDisabled ? 0.55 : 1,
      width:          fullWidth ? "100%" : undefined,
      textDecoration: variant === "link" ? "underline" : "none",
      transition:     "background 0.15s, opacity 0.15s",
      whiteSpace:     "nowrap",
      ...style,
    };

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        style={base}
        {...rest}
      >
        {loading ? <Spinner size={size} /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
