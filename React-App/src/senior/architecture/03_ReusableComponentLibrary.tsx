// TOPIC: Reusable Component Libraries
// LEVEL: Senior — Architecture
//
// ─── WHY BUILD A COMPONENT LIBRARY ──────────────────────────────────────────
//
//   The problem without one:
//   ❌ Every developer writes their own Button with different padding/colors
//   ❌ Accessibility is inconsistent — some have aria-labels, others don't
//   ❌ Changing the brand color requires editing 50 files
//   ❌ No consistent keyboard navigation across the app
//
//   With a component library:
//   ✅ One Button component → consistent across 100 features
//   ✅ Accessibility baked in once — all consumers get it for free
//   ✅ Change design token → whole app updates
//   ✅ New developers are productive immediately (just import and compose)
//
// ─── THE 6 PRINCIPLES ────────────────────────────────────────────────────────
//
//   1. CONSISTENT API     — same props (variant, size, disabled) across all
//   2. FORWARDREF         — always wrap interactive elements with forwardRef
//   3. COMPOUND COMPONENTS— Modal.Header / Modal.Body / Modal.Footer
//   4. DESIGN TOKENS      — colours/spacing in tokens.ts, not hardcoded
//   5. ACCESSIBILITY      — ARIA, focus management, keyboard nav baked in
//   6. BARREL EXPORT      — one index.ts, consumers import from there only

import React, { useState, useRef } from "react";

// ── Import from the barrel — one import, many components ─────────────────────
import {
  Button, Input, Select, Modal, Alert, Badge, Avatar, AvatarGroup,
} from "./component-library";

// ── Inject spinner keyframe once ─────────────────────────────────────────────

const SpinnerStyle = () => (
  <style>{`@keyframes cl-spin { to { transform: rotate(360deg); } }`}</style>
);

// ─── Root component ───────────────────────────────────────────────────────────

const ReusableComponentLibraryDemo = () => {
  const [activeTab, setActiveTab] = useState<"principles" | "gallery">("principles");

  return (
    <div style={s.page}>
      <SpinnerStyle />
      <div style={s.header}>
        <h2 style={s.h2}>Reusable Component Libraries</h2>
        <p style={s.subtitle}>Senior Architecture — build once, use everywhere, consistent forever</p>
        <div style={s.tabs}>
          {(["principles", "gallery"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ ...s.tab, ...(activeTab === tab ? s.tabActive : {}) }}
            >
              {tab === "principles" ? "📐 Principles" : "🎨 Gallery"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "principles" ? <PrinciplesView /> : <GalleryView />}
    </div>
  );
};

// ─── Principles view ──────────────────────────────────────────────────────────

const PrinciplesView = () => (
  <div style={s.principlesWrap}>
    {PRINCIPLES.map((p, i) => (
      <div key={i} style={{ ...s.principleCard, borderLeftColor: p.color }}>
        <div style={s.principleTop}>
          <span style={{ ...s.principleNum, background: p.color }}>{i + 1}</span>
          <div style={s.principleTitle}>{p.title}</div>
        </div>
        <div style={s.principleDesc}>{p.desc}</div>
        <pre style={s.principleCode}>{p.code}</pre>
      </div>
    ))}
  </div>
);

// ─── Gallery view — live interactive demo of every component ──────────────────

const GalleryView = () => {
  const [modalOpen,      setModalOpen]      = useState(false);
  const [confirmOpen,    setConfirmOpen]    = useState(false);
  const [loadingBtn,     setLoadingBtn]     = useState(false);
  const [inputVal,       setInputVal]       = useState("");
  const [inputErr,       setInputErr]       = useState("");
  const [selectVal,      setSelectVal]      = useState("");
  const [alerts,         setAlerts]         = useState({ info: true, success: true, warning: true, error: true });
  const [badges,         setBadges]         = useState(["Design", "Frontend", "React", "TypeScript"]);
  const inputRef = useRef<HTMLInputElement>(null);

  const simulateLoad = () => {
    setLoadingBtn(true);
    setTimeout(() => setLoadingBtn(false), 2000);
  };

  const validateInput = (v: string) => {
    setInputVal(v);
    setInputErr(v.length > 0 && v.length < 3 ? "Minimum 3 characters" : "");
  };

  return (
    <div style={s.gallery}>

      {/* ── Button ── */}
      <Section title="Button" subtitle="forwardRef · 5 variants · 3 sizes · loading · icon slots">
        <Row label="Variants">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </Row>
        <Row label="Sizes">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </Row>
        <Row label="States">
          <Button disabled>Disabled</Button>
          <Button loading={loadingBtn} onClick={simulateLoad}>
            {loadingBtn ? "Saving…" : "Click to load"}
          </Button>
          <Button leftIcon="🚀">With left icon</Button>
          <Button rightIcon="→">With right icon</Button>
          <Button
            variant="secondary"
            onClick={() => inputRef.current?.focus()}
          >
            Focus input below ↓
          </Button>
        </Row>
      </Section>

      {/* ── Input & Select ── */}
      <Section title="Input & Select" subtitle="forwardRef · useId · aria-invalid · aria-describedby">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input
            ref={inputRef}
            label="Username"
            placeholder="Enter username…"
            value={inputVal}
            onChange={(e) => validateInput(e.target.value)}
            error={inputErr}
            helperText={!inputErr ? "Must be at least 3 characters" : undefined}
          />
          <Input
            label="Search"
            placeholder="Search…"
            leadingIcon={<span style={{ fontSize: 14 }}>🔍</span>}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            trailingIcon={<span style={{ fontSize: 13 }}>👁</span>}
          />
          <Input
            label="Disabled field"
            value="Cannot edit"
            disabled
          />
          <Select
            label="Framework"
            value={selectVal}
            onChange={(e) => setSelectVal(e.target.value)}
            placeholder="Choose one…"
            helperText="Pick your favourite"
            options={[
              { value: "react",  label: "React" },
              { value: "vue",    label: "Vue" },
              { value: "svelte", label: "Svelte" },
              { value: "solid",  label: "SolidJS" },
            ]}
          />
          <Select
            label="Disabled select"
            value=""
            disabled
            options={[{ value: "", label: "Nothing here" }]}
          />
        </div>
      </Section>

      {/* ── Modal ── */}
      <Section title="Modal" subtitle="Compound pattern · ReactDOM.createPortal · focus trap · Escape key · aria-modal">
        <Row label="Open a modal">
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Delete something
          </Button>
        </Row>

        {/* Info modal */}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
          <Modal.Header>Feature-Based Architecture</Modal.Header>
          <Modal.Body>
            <p>This modal uses three patterns:</p>
            <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              <li><strong>Compound components</strong> — Modal.Header / Modal.Body / Modal.Footer</li>
              <li><strong>Context</strong> — ModalContext shares onClose without prop drilling</li>
              <li><strong>createPortal</strong> — renders outside the React tree into document.body</li>
            </ul>
            <Alert variant="info" title="Accessibility" style={{ marginTop: 16 }}>
              Tab key is trapped inside. Escape closes the dialog. aria-modal and role="dialog" are set.
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => setModalOpen(false)}>Got it</Button>
          </Modal.Footer>
        </Modal>

        {/* Confirm modal */}
        <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} size="sm">
          <Modal.Header>Delete this item?</Modal.Header>
          <Modal.Body>This action cannot be undone. Are you sure?</Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => setConfirmOpen(false)}>Delete</Button>
          </Modal.Footer>
        </Modal>
      </Section>

      {/* ── Alert ── */}
      <Section title="Alert" subtitle="4 variants · dismissible (controlled) · role=alert">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {alerts.info && (
            <Alert variant="info" title="Information" dismissible onDismiss={() => setAlerts((a) => ({ ...a, info: false }))}>
              Here's some helpful information about this feature.
            </Alert>
          )}
          {alerts.success && (
            <Alert variant="success" title="Saved!" dismissible onDismiss={() => setAlerts((a) => ({ ...a, success: false }))}>
              Your changes have been saved successfully.
            </Alert>
          )}
          {alerts.warning && (
            <Alert variant="warning" title="Heads up" dismissible onDismiss={() => setAlerts((a) => ({ ...a, warning: false }))}>
              This action will affect 24 other records.
            </Alert>
          )}
          {alerts.error && (
            <Alert variant="error" title="Something went wrong" dismissible onDismiss={() => setAlerts((a) => ({ ...a, error: false }))}>
              Failed to connect to the server. Please try again.
            </Alert>
          )}
          {!Object.values(alerts).some(Boolean) && (
            <Button variant="secondary" onClick={() => setAlerts({ info: true, success: true, warning: true, error: true })}>
              Reset alerts
            </Button>
          )}
        </div>
      </Section>

      {/* ── Badge ── */}
      <Section title="Badge" subtitle="6 colors · dot mode · removable">
        <Row label="Colors">
          {(["blue","green","red","yellow","gray","purple"] as const).map((c) => (
            <Badge key={c} color={c}>{c}</Badge>
          ))}
        </Row>
        <Row label="Dot (status)">
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <Badge color="green" dot /> Online
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <Badge color="yellow" dot /> Away
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <Badge color="gray" dot /> Offline
          </span>
        </Row>
        <Row label="Removable tags">
          {badges.map((b) => (
            <Badge key={b} color="blue" removable onRemove={() => setBadges((prev) => prev.filter((x) => x !== b))}>
              {b}
            </Badge>
          ))}
          {badges.length === 0 && (
            <Button size="sm" variant="ghost" onClick={() => setBadges(["Design","Frontend","React","TypeScript"])}>
              Reset tags
            </Button>
          )}
        </Row>
      </Section>

      {/* ── Avatar ── */}
      <Section title="Avatar & AvatarGroup" subtitle="initials fallback · deterministic color · sizes · overlap group">
        <Row label="Sizes">
          {(["sm","md","lg","xl"] as const).map((sz) => (
            <div key={sz} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <Avatar name="Ajay Spak" size={sz} />
              <span style={{ fontSize: 11, color: "#6b7280" }}>{sz}</span>
            </div>
          ))}
        </Row>
        <Row label="Multiple people">
          {[
            { name: "Alice Martin" },
            { name: "Bob Chen" },
            { name: "Carlos Rivas" },
            { name: "Diana Park" },
          ].map((a) => (
            <div key={a.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <Avatar name={a.name} />
              <span style={{ fontSize: 11, color: "#6b7280" }}>{a.name.split(" ")[0]}</span>
            </div>
          ))}
        </Row>
        <Row label="AvatarGroup">
          <AvatarGroup
            size="md"
            max={4}
            avatars={[
              { name: "Alice Martin" },
              { name: "Bob Chen" },
              { name: "Carlos Rivas" },
              { name: "Diana Park" },
              { name: "Eve Taylor" },
              { name: "Frank Wu" },
            ]}
          />
          <span style={{ fontSize: 13, color: "#6b7280", marginLeft: 8 }}>6 team members (+2 overflow)</span>
        </Row>
      </Section>

    </div>
  );
};

// ─── Helper components ────────────────────────────────────────────────────────

const Section = ({
  title, subtitle, children,
}: { title: string; subtitle: string; children: React.ReactNode }) => (
  <div style={s.section}>
    <div style={s.sectionHeader}>
      <h3 style={s.sectionTitle}>{title}</h3>
      <span style={s.sectionSub}>{subtitle}</span>
    </div>
    {children}
  </div>
);

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={s.rowLabel}>{label}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      {children}
    </div>
  </div>
);

// ─── Data ─────────────────────────────────────────────────────────────────────

const PRINCIPLES = [
  {
    color: "#3b82f6",
    title: "Consistent API",
    desc:  "Every component uses the same prop names: variant, size, disabled, style. Developers can predict how any component works after learning one.",
    code:  `// ✅ Same shape for every interactive component
<Button  variant="primary" size="md" disabled />
<Input   variant="primary" size="md" disabled />
<Select  variant="primary" size="md" disabled />`,
  },
  {
    color: "#8b5cf6",
    title: "React.forwardRef",
    desc:  "Wrap every interactive element with forwardRef. This lets callers access the DOM node — e.g. to programmatically focus an input after a dialog opens.",
    code:  `export const Button = React.forwardRef<
  HTMLButtonElement, ButtonProps
>((props, ref) => <button ref={ref} {...props} />);

Button.displayName = "Button"; // shows in DevTools`,
  },
  {
    color: "#10b981",
    title: "Compound Components",
    desc:  "Group related sub-components under one namespace. Consumers compose the layout freely; the root provides shared context (like onClose) via React.createContext.",
    code:  `<Modal isOpen={open} onClose={close}>
  <Modal.Header>Title</Modal.Header>
  <Modal.Body>Content goes here</Modal.Body>
  <Modal.Footer>
    <Button onClick={close}>OK</Button>
  </Modal.Footer>
</Modal>`,
  },
  {
    color: "#f59e0b",
    title: "Design Tokens",
    desc:  "Colours, spacing, and radii live in tokens.ts — not hardcoded inside components. Change a token once, the whole library updates.",
    code:  `// tokens.ts
export const COLOR_MAP = {
  blue: { bg: "#dbeafe", text: "#1d4ed8", ... },
};

// Badge.tsx — uses token, not hardcoded hex
const c = COLOR_MAP[color];
<span style={{ background: c.bg, color: c.text }}>`,
  },
  {
    color: "#ef4444",
    title: "Accessibility Baked In",
    desc:  "Every component handles a11y internally: useId auto-links labels, aria-invalid fires on errors, focus traps keep keyboard users inside modals.",
    code:  `// Input.tsx — useId links label ↔ input
const autoId = useId();
<label htmlFor={autoId}>Email</label>
<input id={autoId} aria-invalid={!!error}
       aria-describedby={errorId} />

// Modal.tsx — focus stays inside
useFocusTrap(dialogRef, isOpen);`,
  },
  {
    color: "#06b6d4",
    title: "Barrel Export",
    desc:  "index.ts is the library's public API. Consumers import from one place. Internal file paths can change freely without breaking any callers.",
    code:  `// ✅ import from the barrel
import { Button, Modal, Alert } from "./component-library"

// ❌ never import from internal files
import { Button } from "./component-library/components/Button"`,
  },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page:           { fontFamily: "system-ui,-apple-system,sans-serif", padding: "32px 24px", maxWidth: 1200, margin: "0 auto" },
  header:         { marginBottom: 28 },
  h2:             { fontSize: 26, fontWeight: 800, color: "#111827", margin: "0 0 6px" },
  subtitle:       { color: "#6b7280", margin: "0 0 20px" },
  tabs:           { display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, width: "fit-content" },
  tab:            { padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: "transparent", color: "#6b7280" },
  tabActive:      { background: "#fff", color: "#111827", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" },

  // Principles
  principlesWrap: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  principleCard:  { background: "#fff", border: "1px solid #e5e7eb", borderLeft: "4px solid", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 10 },
  principleTop:   { display: "flex", alignItems: "center", gap: 10 },
  principleNum:   { width: 26, height: 26, borderRadius: 6, color: "#fff", fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  principleTitle: { fontSize: 15, fontWeight: 700, color: "#111827" },
  principleDesc:  { fontSize: 13, color: "#374151", lineHeight: 1.65 },
  principleCode:  { fontSize: 11.5, lineHeight: 1.75, background: "#0f172a", color: "#e2e8f0", padding: "12px 14px", borderRadius: 8, margin: 0, fontFamily: "monospace", overflow: "auto" },

  // Gallery
  gallery:        { display: "flex", flexDirection: "column", gap: 20 },
  section:        { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "20px 24px" },
  sectionHeader:  { marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid #f1f5f9" },
  sectionTitle:   { fontSize: 16, fontWeight: 700, color: "#111827", margin: "0 0 4px" },
  sectionSub:     { fontSize: 12, color: "#6b7280", fontFamily: "monospace" },
  rowLabel:       { fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 },
};

export default ReusableComponentLibraryDemo;
