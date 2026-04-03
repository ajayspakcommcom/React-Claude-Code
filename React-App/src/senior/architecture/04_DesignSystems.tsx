// TOPIC: Design Systems
// LEVEL: Senior — Architecture
//
// ─── WHAT IS A DESIGN SYSTEM? ────────────────────────────────────────────────
//
// A component library says HOW to build components (forwardRef, compound…).
// A design system says WHAT everything looks and feels like — consistently.
//
// The pipeline:
//
//   Global tokens        →  Semantic tokens       →  Theme         →  Component
//   (palette.blue[500])  →  (semantic.primary)    →  (theme.colors →  reads from
//                                                     .primary)        theme
//
// ─── THE 3-LEVEL TOKEN HIERARCHY ─────────────────────────────────────────────
//
//   Level 1: Global  — raw values, named after what they ARE
//              palette.blue[500] = "#3b82f6"
//
//   Level 2: Semantic — named after what they MEAN
//              semantic.primary = palette.blue[500]
//
//   Level 3: Theme  — named after where they're USED, changes per mode
//              theme.colors.surface = palette.white   (light)
//              theme.colors.surface = "#1e293b"        (dark)
//
// ─── WHY IT MATTERS ──────────────────────────────────────────────────────────
//
//   ❌ Without tokens:  each component has its own #3b82f6 — rebrand = 500 edits
//   ✅ With tokens:     change semantic.primary once → every component updates
//   ❌ Without theme:   dark mode = duplicate every component
//   ✅ With ThemeContext: every component reads theme automatically

import React, { useState } from "react";

import {
  ThemeProvider, useTheme,
  Text, Stack, HStack, VStack, Card,
  PALETTE_SCALES, SPACE_SCALE, TEXT_VARIANTS,
  fontSizes, fontWeights,
} from "./design-system";

import type { TextVariant } from "./design-system";

// ─── Root ─────────────────────────────────────────────────────────────────────

const DesignSystemsDemo = () => {
  const [activeTab, setActiveTab] = useState<"pipeline" | "tokens" | "themes">("pipeline");

  return (
    // ThemeProvider wraps the entire demo — all children can useTheme()
    <ThemeProvider>
      <DemoInner activeTab={activeTab} setActiveTab={setActiveTab} />
    </ThemeProvider>
  );
};

// Inner component can now call useTheme()
const DemoInner = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: "pipeline" | "tokens" | "themes";
  setActiveTab: (t: "pipeline" | "tokens" | "themes") => void;
}) => {
  const { theme } = useTheme();

  return (
    <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", padding: "32px 24px", maxWidth: 1200, margin: "0 auto", background: theme.colors.bg, minHeight: "100vh", transition: "background 0.3s, color 0.3s" }}>
      {/* Header */}
      <VStack gap={3} style={{ marginBottom: 28 }}>
        <Text variant="heading" as="h2">Design Systems</Text>
        <Text variant="body" color="muted">Senior Architecture — tokens → theme → components, all connected</Text>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, background: theme.colors.surface, borderRadius: 10, padding: 4, width: "fit-content", border: `1px solid ${theme.colors.border}` }}>
          {(["pipeline", "tokens", "themes"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 14, fontWeight: 600, fontFamily: "inherit",
                background: activeTab === tab ? theme.colors.primary : "transparent",
                color:      activeTab === tab ? theme.colors.primaryFg : theme.colors.textMuted,
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {tab === "pipeline" ? "📐 Pipeline" : tab === "tokens" ? "🎨 Tokens" : "🌙 Themes"}
            </button>
          ))}
        </div>
      </VStack>

      {activeTab === "pipeline" && <PipelineView />}
      {activeTab === "tokens"   && <TokensView />}
      {activeTab === "themes"   && <ThemesView />}
    </div>
  );
};

// ─── Pipeline view ────────────────────────────────────────────────────────────

const PipelineView = () => {
  const { theme } = useTheme();
  return (
    <VStack gap={6}>
      {/* Token hierarchy */}
      <Card>
        <VStack gap={4}>
          <Text variant="title" as="h3">The 3-Level Token Hierarchy</Text>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {PIPELINE_LEVELS.map((level, i) => (
              <div key={i} style={{ background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, borderRadius: 10, padding: 16 }}>
                <HStack gap={2} style={{ marginBottom: 8 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: level.color, color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span>
                  <Text variant="subheading">{level.title}</Text>
                </HStack>
                <Text variant="bodySmall" color="muted" style={{ marginBottom: 10 }}>{level.desc}</Text>
                <pre style={{ fontSize: 11.5, lineHeight: 1.75, background: "#0f172a", color: "#e2e8f0", padding: 12, borderRadius: 8, margin: 0, fontFamily: "monospace", overflow: "auto" }}>{level.code}</pre>
              </div>
            ))}
          </div>
        </VStack>
      </Card>

      {/* Principles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {PRINCIPLES.map((p, i) => (
          <Card key={i} style={{ borderLeft: `4px solid ${p.color}` }}>
            <VStack gap={2}>
              <HStack gap={2}>
                <span style={{ fontSize: 20 }}>{p.icon}</span>
                <Text variant="subheading">{p.title}</Text>
              </HStack>
              <Text variant="bodySmall" color="muted">{p.desc}</Text>
              <pre style={{ fontSize: 11, lineHeight: 1.7, background: "#0f172a", color: "#e2e8f0", padding: 10, borderRadius: 8, margin: 0, fontFamily: "monospace", overflow: "auto" }}>{p.code}</pre>
            </VStack>
          </Card>
        ))}
      </div>
    </VStack>
  );
};

// ─── Tokens view ──────────────────────────────────────────────────────────────

const TokensView = () => {
  const { theme } = useTheme();
  const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

  return (
    <VStack gap={6}>

      {/* Color palette */}
      <Card>
        <VStack gap={4}>
          <Text variant="title" as="h3">Color Palette</Text>
          <Text variant="bodySmall" color="muted">Global tokens — raw values. Components never reference these directly.</Text>
          {PALETTE_SCALES.map((row) => (
            <div key={row.name}>
              <Text variant="label" color="muted" style={{ marginBottom: 6 }}>{row.label}</Text>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {STEPS.map((step) => {
                  const hex = (row.scale as Record<number, string>)[step];
                  const isDark = step >= 500;
                  return (
                    <div key={step} title={`${row.name}[${step}] = ${hex}`} style={{ flex: 1, minWidth: 48 }}>
                      <div style={{ height: 36, borderRadius: 6, background: hex }} />
                      <div style={{ fontSize: 10, color: theme.colors.textMuted, marginTop: 3, textAlign: "center" }}>{step}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </VStack>
      </Card>

      {/* Typography scale */}
      <Card>
        <VStack gap={4}>
          <Text variant="title" as="h3">Typography Scale</Text>
          <Text variant="bodySmall" color="muted">Named variants — use these instead of raw font sizes.</Text>
          {(Object.keys(TEXT_VARIANTS) as TextVariant[]).map((variant) => (
            <div key={variant} style={{ display: "flex", alignItems: "baseline", gap: 16, paddingBottom: 12, borderBottom: `1px solid ${theme.colors.border}` }}>
              <Text variant="label" color="muted" style={{ width: 100, flexShrink: 0 }}>{variant}</Text>
              <Text variant={variant}>The quick brown fox jumps</Text>
              <Text variant="caption" color="muted" style={{ marginLeft: "auto", whiteSpace: "nowrap" }}>
                {(TEXT_VARIANTS[variant].fontSize as number)}px / {TEXT_VARIANTS[variant].fontWeight}
              </Text>
            </div>
          ))}
        </VStack>
      </Card>

      {/* Spacing scale */}
      <Card>
        <VStack gap={4}>
          <Text variant="title" as="h3">Spacing Scale</Text>
          <Text variant="bodySmall" color="muted">4px base unit — every gap and padding is a multiple of 4.</Text>
          {SPACE_SCALE.map(({ key, value }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Text variant="caption" color="muted" style={{ width: 32, textAlign: "right" }}>{key}</Text>
              <div style={{ width: value, height: 20, background: theme.colors.primary, borderRadius: 4, minWidth: 4 }} />
              <Text variant="caption" color="muted">{value}px</Text>
            </div>
          ))}
        </VStack>
      </Card>

    </VStack>
  );
};

// ─── Themes view — live light/dark toggle ─────────────────────────────────────

const ThemesView = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const [liked, setLiked] = useState(false);

  return (
    <VStack gap={6}>

      {/* Toggle */}
      <HStack gap={4} justify="space-between">
        <VStack gap={1}>
          <Text variant="title" as="h3">Live Theme Preview</Text>
          <Text variant="bodySmall" color="muted">
            Toggle dark mode — every component below uses <Text variant="code" as="span" color="primary">useTheme()</Text> and updates automatically.
          </Text>
        </VStack>
        <button
          onClick={toggleTheme}
          style={{
            padding: "10px 20px", borderRadius: 10, border: `1.5px solid ${theme.colors.border}`,
            background: theme.colors.surface, color: theme.colors.text,
            cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
            boxShadow: theme.shadows.sm,
          }}
        >
          {isDark ? "☀️ Light mode" : "🌙 Dark mode"}
        </button>
      </HStack>

      {/* Sample UI — everything reads from theme */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Profile card */}
        <Card shadow="lg">
          <VStack gap={4}>
            <HStack gap={3} justify="space-between">
              <HStack gap={3}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: theme.colors.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Text variant="title" color="inverse">A</Text>
                </div>
                <VStack gap={0}>
                  <Text variant="subheading">Ajay Spak</Text>
                  <Text variant="caption" color="muted">Senior Engineer</Text>
                </VStack>
              </HStack>
              <button
                onClick={() => setLiked((l) => !l)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20 }}
              >
                {liked ? "❤️" : "🤍"}
              </button>
            </HStack>

            <div style={{ height: 1, background: theme.colors.border }} />

            <Text variant="body" color="muted">
              Building scalable design systems and component libraries at production scale.
            </Text>

            <HStack gap={2} wrap>
              {["React", "TypeScript", "Design Systems"].map((tag) => (
                <span key={tag} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: theme.colors.surfaceHover, color: theme.colors.textMuted, border: `1px solid ${theme.colors.border}` }}>
                  {tag}
                </span>
              ))}
            </HStack>

            <HStack gap={2}>
              <button style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: theme.colors.primary, color: theme.colors.primaryFg, cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "inherit" }}>
                Follow
              </button>
              <button style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1.5px solid ${theme.colors.border}`, background: "transparent", color: theme.colors.text, cursor: "pointer", fontWeight: 600, fontSize: 14, fontFamily: "inherit" }}>
                Message
              </button>
            </HStack>
          </VStack>
        </Card>

        {/* Stats card */}
        <VStack gap={4}>
          <Card>
            <HStack gap={4} justify="space-between">
              {[
                { label: "Components", value: "48",   color: theme.colors.primary },
                { label: "Tokens",     value: "120",  color: theme.colors.success },
                { label: "Variants",   value: "3",    color: theme.colors.warning },
              ].map((stat) => (
                <VStack key={stat.label} gap={0} style={{ alignItems: "center" }}>
                  <Text variant="heading" style={{ color: stat.color }}>{stat.value}</Text>
                  <Text variant="caption" color="muted">{stat.label}</Text>
                </VStack>
              ))}
            </HStack>
          </Card>

          <Card variant="outline">
            <VStack gap={3}>
              <Text variant="subheading">Why tokens change automatically</Text>
              <pre style={{ fontSize: 11.5, lineHeight: 1.75, background: "#0f172a", color: "#e2e8f0", padding: 12, borderRadius: 8, margin: 0, fontFamily: "monospace", overflow: "auto" }}>{THEME_CODE}</pre>
            </VStack>
          </Card>
        </VStack>

      </div>

      {/* Semantic color row */}
      <Card>
        <VStack gap={3}>
          <Text variant="subheading">Semantic colors (update with theme)</Text>
          <HStack gap={3} wrap>
            {[
              { label: "primary",  color: theme.colors.primary },
              { label: "success",  color: theme.colors.success },
              { label: "warning",  color: theme.colors.warning },
              { label: "danger",   color: theme.colors.danger },
              { label: "text",     color: theme.colors.text },
              { label: "muted",    color: theme.colors.textMuted },
              { label: "surface",  color: theme.colors.surface, border: `1px solid ${theme.colors.border}` },
              { label: "bg",       color: theme.colors.bg, border: `1px solid ${theme.colors.border}` },
            ].map((item) => (
              <VStack key={item.label} gap={1} style={{ alignItems: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: item.color, border: item.border }} />
                <Text variant="caption" color="muted">{item.label}</Text>
              </VStack>
            ))}
          </HStack>
        </VStack>
      </Card>

    </VStack>
  );
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const PIPELINE_LEVELS = [
  {
    color: "#8b5cf6",
    title: "Global Tokens",
    desc:  "Raw values — named after what they ARE. Never used directly in components.",
    code:  `// tokens/colors.ts\nexport const palette = {\n  blue: {\n    500: "#3b82f6",\n    600: "#2563eb",\n  },\n  gray: {\n    50: "#f9fafb",\n    900: "#111827",\n  },\n};`,
  },
  {
    color: "#f59e0b",
    title: "Semantic Tokens",
    desc:  "Named after what they MEAN. Rebrand by changing semantic tokens only.",
    code:  `// tokens/colors.ts\nexport const semantic = {\n  primary: palette.blue[500],\n  success: palette.green[500],\n  danger:  palette.red[500],\n};\n// Rebrand to purple:\n// primary: palette.purple[500]`,
  },
  {
    color: "#3b82f6",
    title: "Theme Tokens",
    desc:  "Named after where they're USED. Light and dark themes map the same names to different values.",
    code:  `// theme/themes.ts\nexport const lightTheme = {\n  colors: {\n    surface: palette.white,\n    text:    palette.gray[900],\n    primary: semantic.primary,\n  }\n};\nexport const darkTheme = {\n  colors: {\n    surface: "#1e293b",\n    text:    "#f1f5f9",\n    primary: palette.blue[400],\n  }\n};`,
  },
];

const PRINCIPLES = [
  {
    icon:  "🔗",
    color: "#3b82f6",
    title: "ThemeProvider + useTheme",
    desc:  "Wrap the app once. Any component calls useTheme() and gets the current theme — no prop drilling.",
    code:  `<ThemeProvider>\n  <App />\n</ThemeProvider>\n\n// Any component:\nconst { theme, isDark, toggleTheme } = useTheme();\n<div style={{ background: theme.colors.surface }}>`,
  },
  {
    icon:  "🧱",
    color: "#10b981",
    title: "Primitives (Text, Stack, Card)",
    desc:  "Layout primitives enforce the spacing scale. Typography primitives enforce the type scale. No arbitrary values.",
    code:  `// ✅ Uses spacing token (gap = 4 → 16px)\n<Stack gap={4} direction="row">\n  <Text variant="heading">Title</Text>\n  <Text variant="body" color="muted">\n    Description\n  </Text>\n</Stack>`,
  },
  {
    icon:  "🌙",
    color: "#8b5cf6",
    title: "Dark Mode — zero extra code",
    desc:  "Components read from theme, not hardcoded hex. Dark mode = swap the theme object. No duplicate styles.",
    code:  `// Card reads from theme — works in both modes:\nconst Card = ({ children }) => {\n  const { theme } = useTheme();\n  return (\n    <div style={{\n      background: theme.colors.surface,\n      border: \`1px solid \${theme.colors.border}\`,\n    }}>\n      {children}\n    </div>\n  );\n};`,
  },
  {
    icon:  "📐",
    color: "#f59e0b",
    title: "4px Spacing Grid",
    desc:  "All gaps and padding are multiples of 4. This creates rhythm and makes designs feel cohesive.",
    code:  `// tokens/spacing.ts\nexport const space = {\n  1: 4, 2: 8, 3: 12, 4: 16,\n  5: 20, 6: 24, 8: 32,\n};\n\n// Usage:\n<Stack gap={4}>  // → 16px\n<Card padding={6} // → 24px`,
  },
];

const THEME_CODE = `// Card.tsx — theme-aware\nconst { theme } = useTheme();\n\n<div style={{\n  background: theme.colors.surface,  // white  / slate-800\n  border: theme.colors.border,         // gray-200 / slate-700\n  boxShadow: theme.shadows.md,         // light / dark shadow\n}}>`;

export default DesignSystemsDemo;
