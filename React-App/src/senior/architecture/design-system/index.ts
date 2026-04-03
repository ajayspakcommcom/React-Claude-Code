// DESIGN SYSTEM — index.ts (Public API)
//
// Everything a consumer needs, exported from one place.

// Theme
export { ThemeProvider, useTheme } from "./theme/ThemeContext";
export { lightTheme, darkTheme }   from "./theme/themes";
export type { Theme }              from "./theme/themes";

// Primitives
export { Text }                    from "./primitives/Text";
export { Stack, HStack, VStack }   from "./primitives/Stack";
export { Card }                    from "./primitives/Card";
export type { TextProps }          from "./primitives/Text";
export type { StackProps }         from "./primitives/Stack";
export type { CardProps }          from "./primitives/Card";

// Tokens (for consumers who need raw values)
export { palette, semantic, PALETTE_SCALES } from "./tokens/colors";
export { fontSizes, fontWeights, lineHeights, TEXT_VARIANTS } from "./tokens/typography";
export { space, radii, SPACE_SCALE }         from "./tokens/spacing";
export { shadows }                           from "./tokens/shadows";
export type { TextVariant }                  from "./tokens/typography";
export type { ShadowKey }                    from "./tokens/shadows";
