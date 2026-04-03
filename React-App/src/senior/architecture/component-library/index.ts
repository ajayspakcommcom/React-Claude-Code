// REUSABLE COMPONENT LIBRARY — index.ts (Barrel Export / Public API)
//
// Consumers import from the library root — never from internal files:
//   ✅ import { Button, Modal, Alert } from "./component-library"
//   ❌ import { Button } from "./component-library/components/Button"
//
// This lets us move/rename internals without breaking any imports.

export { Button }              from "./components/Button";
export { Input }               from "./components/Input";
export { Select }              from "./components/Select";
export { Modal }               from "./components/Modal";
export { Alert }               from "./components/Alert";
export { Badge }               from "./components/Badge";
export { Avatar, AvatarGroup } from "./components/Avatar";

export type { ButtonProps }    from "./components/Button";
export type { InputProps }     from "./components/Input";
export type { SelectProps, SelectOption } from "./components/Select";
export type { AlertProps }     from "./components/Alert";
export type { BadgeProps }     from "./components/Badge";
export type { AvatarProps, AvatarGroupProps } from "./components/Avatar";

export type { Size, Variant, Color, AlertVariant, FormFieldProps } from "./types";
