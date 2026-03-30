// TOPIC: Composition Patterns
//
// Composition = building complex UIs by combining small, focused components.
// React favours composition over inheritance.
//
// Key patterns covered:
//   1. children prop         — pass JSX into a component as content
//   2. Specialisation        — generic component + specific variant
//   3. Slot pattern          — named props for specific regions (header, footer…)
//   4. Wrapper / Container   — shared layout or behaviour around any children
//   5. Compound components   — group of components that share implicit state

import { useState, createContext, useContext } from "react";

// ════════════════════════════════════════════════════════════
// 1. children prop — most fundamental composition tool
// ════════════════════════════════════════════════════════════

const Card = ({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => (
  <div style={{ border: "1px solid #ddd", borderRadius: "8px", padding: "16px", marginBottom: "12px", ...style }}>
    {children}
  </div>
);

const ChildrenPropExample = () => (
  <div style={{ marginBottom: "20px" }}>
    <h3>1 — children Prop</h3>
    <Card>
      <h4>Card Title</h4>
      <p>Any JSX can be passed as children. The Card doesn't care what's inside.</p>
    </Card>
    <Card style={{ background: "#f0f7ff" }}>
      <strong>Another card</strong> with completely different content.
    </Card>
  </div>
);

// ════════════════════════════════════════════════════════════
// 2. Specialisation — generic Button → specific variants
// ════════════════════════════════════════════════════════════

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "ghost";
  children: React.ReactNode;
}

const Button = ({ variant = "primary", children, style, ...rest }: ButtonProps) => {
  const variants = {
    primary: { background: "#4a90e2", color: "#fff", border: "none" },
    danger:  { background: "#e74c3c", color: "#fff", border: "none" },
    ghost:   { background: "transparent", color: "#4a90e2", border: "1px solid #4a90e2" },
  };
  return (
    <button style={{ padding: "8px 16px", borderRadius: "6px", cursor: "pointer", ...variants[variant], ...style }} {...rest}>
      {children}
    </button>
  );
};

// Specialised versions — compose by passing props, not by subclassing
const SaveButton    = (props: Omit<ButtonProps, "variant">) => <Button variant="primary" {...props}>Save</Button>;
const DeleteButton  = (props: Omit<ButtonProps, "variant">) => <Button variant="danger"  {...props}>Delete</Button>;
const CancelButton  = (props: Omit<ButtonProps, "variant">) => <Button variant="ghost"   {...props}>Cancel</Button>;

const SpecialisationExample = () => (
  <div style={{ marginBottom: "20px" }}>
    <h3>2 — Specialisation</h3>
    <p style={{ fontSize: "13px", color: "#666" }}>Generic Button → specialised variants via props, no inheritance.</p>
    <div style={{ display: "flex", gap: "8px" }}>
      <SaveButton />
      <DeleteButton />
      <CancelButton />
      <Button variant="primary">Custom Label</Button>
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════
// 3. Slot pattern — named content regions
// ════════════════════════════════════════════════════════════

interface ModalProps {
  header: React.ReactNode;
  body: React.ReactNode;
  footer: React.ReactNode;
}

const Modal = ({ header, body, footer }: ModalProps) => (
  <div style={{ border: "1px solid #ccc", borderRadius: "8px", overflow: "hidden", maxWidth: "360px" }}>
    <div style={{ padding: "12px 16px", background: "#4a90e2", color: "#fff" }}>{header}</div>
    <div style={{ padding: "16px" }}>{body}</div>
    <div style={{ padding: "10px 16px", background: "#f5f5f5", display: "flex", justifyContent: "flex-end", gap: "8px" }}>{footer}</div>
  </div>
);

const SlotPatternExample = () => (
  <div style={{ marginBottom: "20px" }}>
    <h3>3 — Slot Pattern (named content regions)</h3>
    <p style={{ fontSize: "13px", color: "#666" }}>Named props act as "slots" — caller decides what goes in each region.</p>
    <Modal
      header={<strong>Confirm Action</strong>}
      body={<p style={{ margin: 0 }}>Are you sure you want to delete this item? This cannot be undone.</p>}
      footer={<><CancelButton /><DeleteButton /></>}
    />
  </div>
);

// ════════════════════════════════════════════════════════════
// 4. Wrapper / Container — adds behaviour around any children
// ════════════════════════════════════════════════════════════

const ErrorBoundaryDemo = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section style={{ border: "2px dashed #4a90e2", borderRadius: "8px", padding: "12px", marginBottom: "8px" }}>
    <small style={{ color: "#4a90e2", fontWeight: "bold" }}>{title}</small>
    <div style={{ marginTop: "8px" }}>{children}</div>
  </section>
);

const WrapperExample = () => (
  <div style={{ marginBottom: "20px" }}>
    <h3>4 — Wrapper / Container</h3>
    <p style={{ fontSize: "13px", color: "#666" }}>The wrapper adds a border/label — the children are completely flexible.</p>
    <ErrorBoundaryDemo title="User Profile Section">
      <p>Name: Alice | Role: Admin</p>
    </ErrorBoundaryDemo>
    <ErrorBoundaryDemo title="Settings Section">
      <p>Theme: Dark | Language: English</p>
    </ErrorBoundaryDemo>
  </div>
);

// ════════════════════════════════════════════════════════════
// 5. Compound Components — group sharing implicit state via Context
// ════════════════════════════════════════════════════════════

// Internal context — not exported; only used by the compound components
const TabsContext = createContext<{ active: string; setActive: (t: string) => void }>({
  active: "", setActive: () => {},
});

// Parent — owns state, provides it via context
const Tabs = ({ defaultTab, children }: { defaultTab: string; children: React.ReactNode }) => {
  const [active, setActive] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
};

// TabList — renders the tab buttons
const TabList = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "flex", borderBottom: "2px solid #ddd", marginBottom: "12px" }}>{children}</div>
);

// Tab — reads/writes to Tabs context
const Tab = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { active, setActive } = useContext(TabsContext);
  return (
    <button
      onClick={() => setActive(id)}
      style={{
        padding: "8px 16px", border: "none", cursor: "pointer",
        borderBottom: active === id ? "3px solid #4a90e2" : "3px solid transparent",
        background: "none", fontWeight: active === id ? "bold" : "normal",
        color: active === id ? "#4a90e2" : "#555",
      }}
    >
      {children}
    </button>
  );
};

// TabPanel — only renders when its id matches the active tab
const TabPanel = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const { active } = useContext(TabsContext);
  if (active !== id) return null;
  return <div style={{ padding: "10px" }}>{children}</div>;
};

// Attach sub-components to Tabs for clean consumer API: <Tabs.List>, <Tabs.Tab>…
Tabs.List  = TabList;
Tabs.Tab   = Tab;
Tabs.Panel = TabPanel;

const CompoundComponentExample = () => (
  <div style={{ marginBottom: "20px" }}>
    <h3>5 — Compound Components</h3>
    <p style={{ fontSize: "13px", color: "#666" }}>
      Tabs, TabList, Tab, TabPanel share state implicitly via Context. The consumer API is clean.
    </p>
    <Tabs defaultTab="about">
      <Tabs.List>
        <Tabs.Tab id="about">About</Tabs.Tab>
        <Tabs.Tab id="skills">Skills</Tabs.Tab>
        <Tabs.Tab id="contact">Contact</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel id="about"><p>I'm a React developer learning advanced patterns.</p></Tabs.Panel>
      <Tabs.Panel id="skills"><p>React, TypeScript, Node.js, CSS</p></Tabs.Panel>
      <Tabs.Panel id="contact"><p>Email: dev@example.com</p></Tabs.Panel>
    </Tabs>
  </div>
);

// ─── Main export ──────────────────────────────────────────────────────────────
const CompositionPatternsDemo = () => (
  <div>
    <h2>Composition Patterns</h2>
    <ChildrenPropExample />
    <SpecialisationExample />
    <SlotPatternExample />
    <WrapperExample />
    <CompoundComponentExample />
  </div>
);

export default CompositionPatternsDemo;
