// REUSABLE COMPONENT LIBRARY — types.ts
//
// Shared primitive types used by every component.
// Consistent naming = consistent API = developers can predict props.

export type Size    = "sm" | "md" | "lg" | "xl";
export type Variant = "primary" | "secondary" | "danger" | "ghost" | "link";
export type Color   = "blue" | "green" | "red" | "yellow" | "gray" | "purple";
export type AlertVariant = "info" | "success" | "warning" | "error";

// All form components share this shape — label, error, helperText
export interface FormFieldProps {
  label?:      string;
  error?:      string;
  helperText?: string;
  id?:         string;
}
