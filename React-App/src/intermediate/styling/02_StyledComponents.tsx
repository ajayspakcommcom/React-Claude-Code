// TOPIC: Styled Components
//
// styled-components lets you write actual CSS inside JavaScript using
// tagged template literals. The component IS the style — no class names needed.
//
// KEY FEATURES COVERED:
//   Basic styled component     → styled.div`css`
//   Props-based styles         → ${(p) => p.variant === 'primary' ? ... : ...}
//   Extending styles           → styled(BaseComponent)`extra css`
//   Theming                    → ThemeProvider + useTheme hook
//   Global styles              → createGlobalStyle
//   Keyframe animations        → keyframes
//   as prop                    → render a Button as an <a> tag
//   css helper                 → reusable CSS snippets
//   attrs()                    → set default HTML attributes
//   shouldForwardProp          → prevent custom props from reaching the DOM
//   Nesting & pseudo-selectors → &:hover, &::before, & + &

import React, { useState } from "react";
import styled, {
  ThemeProvider,
  createGlobalStyle,
  keyframes,
  css,
  useTheme,
  DefaultTheme,
} from "styled-components";

// ─────────────────────────────────────────────────────────────────────────────
// 1. THEME — define once, use everywhere via ThemeProvider
// ─────────────────────────────────────────────────────────────────────────────

const lightTheme: DefaultTheme = {
  colors: {
    primary:    "#4a90e2",
    success:    "#27ae60",
    danger:     "#e74c3c",
    warning:    "#e67e22",
    bg:         "#ffffff",
    bgAlt:      "#f8f9fa",
    text:       "#333333",
    textMuted:  "#888888",
    border:     "#e0e0e0",
  },
  radii:   { sm: "4px",  md: "8px",  lg: "12px" },
  spacing: { xs: "4px",  sm: "8px",  md: "16px", lg: "24px" },
  fonts:   { body: "sans-serif", mono: "monospace" },
};

const darkTheme: DefaultTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    bg:        "#1a1a2e",
    bgAlt:     "#16213e",
    text:      "#e0e0e0",
    textMuted: "#aaaaaa",
    border:    "#333366",
  },
};

// Extend DefaultTheme so TypeScript knows the shape
declare module "styled-components" {
  export interface DefaultTheme {
    colors:  { primary: string; success: string; danger: string; warning: string; bg: string; bgAlt: string; text: string; textMuted: string; border: string };
    radii:   { sm: string; md: string; lg: string };
    spacing: { xs: string; sm: string; md: string; lg: string };
    fonts:   { body: string; mono: string };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. GLOBAL STYLES — applied to the whole document
// ─────────────────────────────────────────────────────────────────────────────

const DemoGlobalStyle = createGlobalStyle`
  /* Scoped to the demo wrapper only — use :root for real apps */
  .styled-demo-wrapper * {
    box-sizing: border-box;
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// 3. KEYFRAME ANIMATION
// ─────────────────────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.05); }
`;

// ─────────────────────────────────────────────────────────────────────────────
// 4. CSS HELPER — reusable CSS snippets (like mixins)
// ─────────────────────────────────────────────────────────────────────────────

const flexCenter = css`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const truncate = css`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

// ─────────────────────────────────────────────────────────────────────────────
// 5. STYLED COMPONENTS — the building blocks
// ─────────────────────────────────────────────────────────────────────────────

// Basic styled div — uses theme via props.theme
const Card = styled.div`
  background:    ${(p) => p.theme.colors.bg};
  border:        1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.md};
  padding:       ${(p) => p.theme.spacing.md};
  margin-bottom: ${(p) => p.theme.spacing.sm};
  animation:     ${fadeIn} 0.3s ease;
  transition:    box-shadow 0.2s, transform 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transform:  translateY(-2px);
  }
`;

// Props-based styles — variant prop controls colour
interface ButtonProps {
  variant?: "primary" | "success" | "danger" | "outline";
  size?:    "sm" | "md" | "lg";
  $loading?: boolean;   // $ prefix = transient prop (not forwarded to DOM)
}

const Button = styled.button<ButtonProps>`
  border:        none;
  border-radius: ${(p) => p.theme.radii.sm};
  cursor:        ${(p) => p.$loading ? "not-allowed" : "pointer"};
  font-family:   ${(p) => p.theme.fonts.body};
  font-size:     ${(p) => p.size === "lg" ? "15px" : p.size === "sm" ? "11px" : "13px"};
  opacity:       ${(p) => p.$loading ? 0.6 : 1};
  transition:    opacity 0.15s, transform 0.1s;

  /* Size-based padding */
  padding: ${(p) =>
    p.size === "lg" ? "10px 24px" :
    p.size === "sm" ? "4px 10px"  :
    "7px 16px"};

  /* Variant-based colour */
  ${(p) => p.variant === "primary" && css`
    background: ${p.theme.colors.primary};
    color: #fff;
  `}
  ${(p) => p.variant === "success" && css`
    background: ${p.theme.colors.success};
    color: #fff;
  `}
  ${(p) => p.variant === "danger" && css`
    background: ${p.theme.colors.danger};
    color: #fff;
  `}
  ${(p) => p.variant === "outline" && css`
    background: transparent;
    color: ${p.theme.colors.primary};
    border: 1px solid ${p.theme.colors.primary};
  `}
  ${(p) => !p.variant && css`
    background: ${p.theme.colors.bgAlt};
    color: ${p.theme.colors.text};
    border: 1px solid ${p.theme.colors.border};
  `}

  &:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
  &:active              { transform: translateY(0); }
`;

// Extending a styled component — adds animation on top of Button
const PulseButton = styled(Button)`
  animation: ${pulse} 2s infinite;
`;

// Styled input with focus ring
const Input = styled.input<{ $hasError?: boolean }>`
  display:       block;
  width:         100%;
  padding:       7px 10px;
  border:        1px solid ${(p) => p.$hasError ? p.theme.colors.danger : p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.sm};
  font-size:     13px;
  background:    ${(p) => p.theme.colors.bg};
  color:         ${(p) => p.theme.colors.text};
  outline:       none;
  transition:    border-color 0.15s, box-shadow 0.15s;

  &:focus {
    border-color: ${(p) => p.$hasError ? p.theme.colors.danger : p.theme.colors.primary};
    box-shadow: 0 0 0 3px ${(p) =>
      p.$hasError
        ? "rgba(231,76,60,0.15)"
        : "rgba(74,144,226,0.15)"};
  }

  &::placeholder { color: ${(p) => p.theme.colors.textMuted}; }
`;

// Badge — uses $color transient prop to avoid forwarding to DOM
const Badge = styled.span<{ $color: string }>`
  ${flexCenter}
  display:       inline-flex;
  padding:       2px 10px;
  border-radius: 12px;
  font-size:     11px;
  font-weight:   bold;
  background:    ${(p) => p.$color};
  color:         #fff;
  margin-left:   8px;
`;

// Title with truncate mixin
const CardTitle = styled.h4`
  ${truncate}
  margin:      0 0 6px;
  font-size:   15px;
  color:       ${(p) => p.theme.colors.text};
  max-width:   200px;
`;

const CardDesc = styled.p`
  margin:      0;
  font-size:   13px;
  color:       ${(p) => p.theme.colors.textMuted};
  line-height: 1.5;
`;

// Section header that reads from theme
const SectionHeader = styled.h4`
  font-size:     13px;
  font-weight:   bold;
  margin:        0 0 12px;
  color:         ${(p) => p.theme.colors.text};
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  padding-bottom: 6px;
`;

const Section = styled.div`
  padding:       ${(p) => p.theme.spacing.md};
  background:    ${(p) => p.theme.colors.bgAlt};
  border-radius: ${(p) => p.theme.radii.md};
  margin-bottom: ${(p) => p.theme.spacing.md};
`;

const Grid = styled.div`
  display:               grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap:                   12px;
  margin-bottom:         12px;
`;

const Row = styled.div`
  display:     flex;
  gap:         8px;
  flex-wrap:   wrap;
  align-items: center;
`;

const Label = styled.label`
  display:     block;
  font-size:   12px;
  font-weight: bold;
  margin-bottom: 4px;
  color:       ${(p) => p.theme.colors.textMuted};
`;

const ErrorText = styled.p`
  margin:    3px 0 0;
  font-size: 11px;
  color:     ${(p) => p.theme.colors.danger};
`;

const FormGroup = styled.div`
  margin-bottom: 12px;
`;

// attrs() — set default HTML attributes on a styled component
const RequiredInput = styled(Input).attrs({ required: true, autoComplete: "off" })`
  /* extra styles beyond Input */
`;

// ─────────────────────────────────────────────────────────────────────────────
// 6. COMPONENTS using styled-components
// ─────────────────────────────────────────────────────────────────────────────

function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  const theme = useTheme();
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
      <Button onClick={onToggle} variant="outline" size="sm">
        {dark ? "☀ Light" : "🌙 Dark"} theme (useTheme: bg={theme.colors.bg})
      </Button>
    </div>
  );
}

function CardGrid() {
  const theme = useTheme();
  return (
    <Section>
      <SectionHeader>1. Basic + Props-based styles + Theme</SectionHeader>
      <Grid>
        {[
          { title: "Default Card", desc: "Base styled component, theme-aware bg + border", color: theme.colors.textMuted },
          { title: "Primary variant", desc: "Button with variant='primary' prop", color: theme.colors.primary },
          { title: "Success variant", desc: "Button with variant='success' prop", color: theme.colors.success },
          { title: "Danger variant",  desc: "Button with variant='danger' prop",  color: theme.colors.danger },
        ].map(({ title, desc, color }) => (
          <Card key={title}>
            <CardTitle>
              {title}
              <Badge $color={color}>badge</Badge>
            </CardTitle>
            <CardDesc>{desc}</CardDesc>
          </Card>
        ))}
      </Grid>
    </Section>
  );
}

function ButtonShowcase() {
  const [loading, setLoading] = useState(false);
  return (
    <Section>
      <SectionHeader>2. Button variants + sizes + transient $loading prop + extending</SectionHeader>
      <Row style={{ marginBottom: "10px" }}>
        {(["primary","success","danger","outline",undefined] as const).map((v, i) => (
          <Button key={i} variant={v}>{v ?? "default"}</Button>
        ))}
      </Row>
      <Row style={{ marginBottom: "10px" }}>
        {(["sm","md","lg"] as const).map((size) => (
          <Button key={size} variant="primary" size={size}>{size} size</Button>
        ))}
      </Row>
      <Row>
        <Button variant="primary" $loading={loading} disabled={loading}
          onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 2000); }}>
          {loading ? "Loading…" : "$loading transient prop"}
        </Button>
        <PulseButton variant="success">Extended — PulseButton (animated)</PulseButton>
        {/* as prop — renders Button as an <a> tag */}
        <Button as="a" href="#" variant="outline" size="sm" onClick={(e) => e.preventDefault()}>
          as="a" (renders as anchor)
        </Button>
      </Row>
    </Section>
  );
}

function FormDemo() {
  const [values, setValues] = useState({ name: "", email: "" });
  const [touched, setTouched] = useState({ name: false, email: false });
  const errors = {
    name:  values.name.trim().length < 2   ? "Name too short" : "",
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) ? "Invalid email" : "",
  };

  return (
    <Section>
      <SectionHeader>3. Themed Input + attrs() + focus ring + error state</SectionHeader>
      <div style={{ maxWidth: "360px" }}>
        {(["name","email"] as const).map((field) => (
          <FormGroup key={field}>
            <Label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1)}</Label>
            {/* RequiredInput = Input.attrs({ required, autoComplete }) + extra CSS */}
            <RequiredInput
              id={field}
              type={field === "email" ? "email" : "text"}
              value={values[field]}
              onChange={(e) => setValues(v => ({ ...v, [field]: e.target.value }))}
              onBlur={() => setTouched(t => ({ ...t, [field]: true }))}
              $hasError={touched[field] && !!errors[field]}
              placeholder={field === "email" ? "you@example.com" : "Jane Doe"}
            />
            {touched[field] && errors[field] && <ErrorText>{errors[field]}</ErrorText>}
          </FormGroup>
        ))}
        <Button variant="primary">Submit</Button>
      </div>
    </Section>
  );
}

function AnimationDemo() {
  const [show, setShow] = useState(true);
  return (
    <Section>
      <SectionHeader>4. keyframes + css helper (flexCenter, truncate)</SectionHeader>
      <Row>
        <Button variant="outline" size="sm" onClick={() => setShow(s => !s)}>
          Toggle animation
        </Button>
      </Row>
      {show && (
        <div style={{ marginTop: "10px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <Card style={{ animation: `${fadeIn} 0.4s ease`, width: "180px" }}>
            <CardTitle>fadeIn animation</CardTitle>
            <CardDesc>keyframes`from…to`</CardDesc>
          </Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
            width: "80px", height: "80px", background: "#4a90e2", borderRadius: "8px",
            animation: `${pulse} 2s infinite`, color: "#fff", fontSize: "12px", textAlign: "center" }}>
            pulse
          </div>
        </div>
      )}
      <p style={{ fontSize: "11px", color: "#888", marginTop: "10px" }}>
        <code>css`display:flex; align-items:center;`</code> — the <code>flexCenter</code> mixin is
        composed into Badge using the <code>css</code> helper.
      </p>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — ThemeProvider wraps all demos
// ─────────────────────────────────────────────────────────────────────────────

export default function StyledComponentsDemo() {
  const [dark, setDark] = useState(false);

  return (
    <ThemeProvider theme={dark ? darkTheme : lightTheme}>
      <DemoGlobalStyle />
      <div className="styled-demo-wrapper">
        <h2>Styled Components</h2>
        <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
          CSS-in-JS: write real CSS inside JS using tagged template literals.
          Components carry their own styles — no class names needed.
        </p>

        <ThemeToggle dark={dark} onToggle={() => setDark(d => !d)} />
        <CardGrid />
        <ButtonShowcase />
        <FormDemo />
        <AnimationDemo />

        <div style={{ padding: "12px", background: dark ? "#16213e" : "#f5f5f5", borderRadius: "8px", fontSize: "13px", color: dark ? "#e0e0e0" : "#333" }}>
          <strong>Styled Components reference:</strong>
          <ul style={{ margin: "6px 0 0", paddingLeft: "18px", lineHeight: "1.9" }}>
            <li><code>styled.div`css`</code> — basic styled component</li>
            <li><code>styled(Component)`css`</code> — extend any component</li>
            <li><code>{"${(p) => p.variant === 'primary' && css`...`}"}</code> — props-based styles</li>
            <li><code>{"${(p) => p.theme.colors.primary}"}</code> — access theme</li>
            <li><code>ThemeProvider theme=&#123;themeObj&#125;</code> — inject theme to entire tree</li>
            <li><code>useTheme()</code> — read theme inside any component</li>
            <li><code>createGlobalStyle`body &#123; ... &#125;`</code> — global CSS</li>
            <li><code>keyframes`from &#123; &#125; to &#123; &#125;`</code> — CSS animations</li>
            <li><code>css`...`</code> — reusable CSS snippets (mixins)</li>
            <li><code>.attrs(&#123; required: true &#125;)</code> — default HTML attributes</li>
            <li><code>as="a"</code> — render as a different HTML tag</li>
            <li><code>$propName</code> — transient prop (not forwarded to DOM)</li>
          </ul>
        </div>
      </div>
    </ThemeProvider>
  );
}
