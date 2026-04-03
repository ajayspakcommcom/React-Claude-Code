// DESIGN SYSTEM — theme/ThemeContext.tsx
//
// ThemeProvider wraps the app (or a section of it).
// useTheme() gives any child component instant access to the current theme.
//
// Pattern:
//   1. Wrap your root:  <ThemeProvider><App /></ThemeProvider>
//   2. Read in components: const { theme, toggleTheme, isDark } = useTheme();
//   3. Apply tokens:  style={{ background: theme.colors.surface }}

import React, { createContext, useContext, useState } from "react";
import { lightTheme, darkTheme } from "./themes";
import type { Theme } from "./themes";

// ── Context ───────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme:       Theme;
  isDark:      boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme:       lightTheme,
  isDark:      false,
  toggleTheme: () => {},
});

// ── Provider ──────────────────────────────────────────────────────────────────

export const ThemeProvider = ({
  children,
  defaultDark = false,
}: {
  children:    React.ReactNode;
  defaultDark?: boolean;
}) => {
  const [isDark, setIsDark] = useState(defaultDark);

  const value: ThemeContextValue = {
    theme:       isDark ? darkTheme : lightTheme,
    isDark,
    toggleTheme: () => setIsDark((d) => !d),
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export const useTheme = () => useContext(ThemeContext);
