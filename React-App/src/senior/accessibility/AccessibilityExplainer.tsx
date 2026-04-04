// Visual explainer for Senior — Accessibility
// Covers ARIA, Keyboard Navigation, Screen Readers

import React, { useState, useRef, useEffect, useId, useCallback } from "react";

// ─── LIVE DEMOS ───────────────────────────────────────────────────────────────

// Demo 1 — Semantic HTML vs ARIA div soup
const SemanticDemo: React.FC = () => {
  const [view, setView] = useState<"bad" | "good">("bad");

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        Semantic HTML vs div soup
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        A screen reader reads roles, names, and states — not visual appearance.
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {(["bad", "good"] as const).map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding: "6px 16px", borderRadius: 8, fontWeight: 600,
            fontSize: 12, cursor: "pointer", border: "2px solid",
            borderColor: view === v ? (v === "bad" ? "#ef4444" : "#22c55e") : "#e2e8f0",
            background: view === v ? (v === "bad" ? "#fef2f2" : "#f0fdf4") : "#f8fafc",
            color: view === v ? (v === "bad" ? "#dc2626" : "#16a34a") : "#64748b",
          }}>{v === "bad" ? "Inaccessible (div soup)" : "Accessible (semantic)"}</button>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, marginBottom: 6,
            color: view === "bad" ? "#dc2626" : "#94a3b8",
            textTransform: "uppercase", letterSpacing: 1,
          }}>HTML</div>
          <div style={{
            background: "#0f172a", borderRadius: 8, padding: 14,
            fontFamily: "monospace", fontSize: 11, color: view === "bad" ? "#fca5a5" : "#86efac",
            lineHeight: 1.7,
          }}>
            {view === "bad" ? (
              `<div onclick="submit()">Submit</div>\n<div onclick="...">✕</div>\n<div>Name</div>\n<input type="text" />\n<div class="error">Required</div>`
            ) : (
              `<button type="submit">Submit</button>\n<button aria-label="Close dialog">✕</button>\n<label htmlFor="name">Name</label>\n<input id="name" aria-required />\n<span role="alert">Required</span>`
            )}
          </div>
        </div>
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, marginBottom: 6,
            color: view === "bad" ? "#dc2626" : "#22c55e",
            textTransform: "uppercase", letterSpacing: 1,
          }}>Screen reader hears</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(view === "bad" ? [
              { text: '"Submit"', issue: "No role — not announced as button, not clickable by keyboard" },
              { text: '"✕"', issue: "No name — just a symbol with no meaning" },
              { text: '"Name" + "text input"', issue: "Disconnected — reader can't link label to input" },
              { text: '"Required"', issue: "No role=alert — not announced automatically on error" },
            ] : [
              { text: '"Submit, button"', issue: "Role = button — focusable, activatable with Enter/Space" },
              { text: '"Close dialog, button"', issue: "aria-label provides meaningful name" },
              { text: '"Name, required, text input"', issue: "htmlFor links label → reads as one unit" },
              { text: '"Required, alert"', issue: "role=alert — announced immediately when it appears" },
            ]).map((r, i) => (
              <div key={i} style={{
                padding: "8px 10px", borderRadius: 6,
                background: view === "bad" ? "#fef2f2" : "#f0fdf4",
                border: `1px solid ${view === "bad" ? "#fecaca" : "#bbf7d0"}`,
              }}>
                <code style={{ fontSize: 11, fontWeight: 700, color: view === "bad" ? "#dc2626" : "#16a34a" }}>
                  {r.text}
                </code>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{r.issue}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Demo 2 — ARIA states live demo
const AriaStatesDemo: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const [checked, setChecked] = useState(false);
  const [selected, setSelected] = useState("one");
  const [busy, setBusy] = useState(false);
  const uid = useId();

  const simulateBusy = () => {
    setBusy(true);
    setTimeout(() => setBusy(false), 1500);
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        ARIA States — live
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        Interact with each widget — watch the ARIA attribute update in real time.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* aria-expanded */}
        <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              aria-expanded={expanded}
              aria-controls={`${uid}-panel`}
              onClick={() => setExpanded(e => !e)}
              style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 13 }}
            >
              {expanded ? "▼" : "▶"} Details section
            </button>
            <code style={{ fontSize: 11, background: "#e2e8f0", padding: "2px 8px", borderRadius: 4, color: "#3b82f6" }}>
              aria-expanded="{String(expanded)}"
            </code>
          </div>
          {expanded && (
            <div id={`${uid}-panel`} style={{ marginTop: 8, fontSize: 12, color: "#475569" }}>
              Panel content — visible because aria-expanded is true.
            </div>
          )}
        </div>

        {/* aria-checked (custom checkbox) */}
        <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              role="checkbox"
              aria-checked={checked}
              tabIndex={0}
              onClick={() => setChecked(c => !c)}
              onKeyDown={e => (e.key === " " || e.key === "Enter") && setChecked(c => !c)}
              style={{
                width: 20, height: 20, borderRadius: 4, cursor: "pointer",
                border: `2px solid ${checked ? "#3b82f6" : "#cbd5e1"}`,
                background: checked ? "#3b82f6" : "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 12,
              }}
            >
              {checked ? "✓" : ""}
            </div>
            <span style={{ fontSize: 13 }}>Subscribe to newsletter</span>
          </div>
          <code style={{ fontSize: 11, background: "#e2e8f0", padding: "2px 8px", borderRadius: 4, color: "#3b82f6" }}>
            aria-checked="{String(checked)}"
          </code>
        </div>

        {/* aria-selected (radio group) */}
        <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Plan selection (role=radio group):</div>
          <div role="radiogroup" aria-label="Plan" style={{ display: "flex", gap: 8 }}>
            {["one", "two", "three"].map(opt => (
              <button
                key={opt}
                role="radio"
                aria-checked={selected === opt}
                onClick={() => setSelected(opt)}
                style={{
                  padding: "5px 14px", borderRadius: 8,
                  border: `2px solid ${selected === opt ? "#3b82f6" : "#e2e8f0"}`,
                  background: selected === opt ? "#eff6ff" : "#fff",
                  color: selected === opt ? "#2563eb" : "#64748b",
                  cursor: "pointer", fontWeight: 600, fontSize: 12,
                }}
              >
                Plan {opt}
              </button>
            ))}
          </div>
          <code style={{ fontSize: 11, color: "#3b82f6", marginTop: 6, display: "block" }}>
            aria-checked="{selected === "one" ? "true" : "false"}" / "false" / "false"
          </code>
        </div>

        {/* aria-busy */}
        <div style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div aria-busy={busy} aria-live="polite" style={{ fontSize: 13 }}>
              {busy ? "Loading data…" : "Data loaded"}
            </div>
            <button onClick={simulateBusy} disabled={busy} style={{
              padding: "4px 12px", borderRadius: 6, fontSize: 12,
              background: "#3b82f6", color: "#fff", border: "none",
              cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1,
            }}>Reload</button>
          </div>
          <code style={{ fontSize: 11, background: "#e2e8f0", padding: "2px 8px", borderRadius: 4, color: "#3b82f6" }}>
            aria-busy="{String(busy)}"
          </code>
        </div>
      </div>
    </div>
  );
};

// Demo 3 — Focus trap modal
const FocusTrapDemo: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [focusLog, setFocusLog] = useState<string[]>([]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const uid = useId();

  const log = useCallback((msg: string) => {
    setFocusLog(prev => [msg, ...prev].slice(0, 5));
  }, []);

  useEffect(() => {
    if (open) {
      log("Modal opened — focus moved inside");
      dialogRef.current?.focus();
    } else if (triggerRef.current) {
      log("Modal closed — focus restored to trigger");
      triggerRef.current.focus();
    }
  }, [open, log]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && open) setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const trapTab = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input, [tabindex]:not([tabindex='-1'])"
      )
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus(); log("Tab wraps → last item");
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus(); log("Tab wraps → first item");
    }
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        Focus Trap + Focus Restoration
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        Open the modal and press Tab — focus stays inside. Close it — focus returns to the button.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <button
            ref={triggerRef}
            onClick={() => setOpen(true)}
            style={{
              padding: "8px 18px", borderRadius: 8, background: "#7c3aed",
              color: "#fff", border: "none", cursor: "pointer",
              fontWeight: 600, fontSize: 13, marginBottom: 12,
            }}
          >
            Open modal
          </button>

          {open && (
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "fixed", inset: 0,
                  background: "rgba(0,0,0,0.4)", zIndex: 50,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <div
                  ref={dialogRef}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby={`${uid}-title`}
                  tabIndex={-1}
                  onKeyDown={trapTab}
                  style={{
                    background: "#fff", borderRadius: 12, padding: 24,
                    width: 320, boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                    outline: "none",
                  }}
                >
                  <h3 id={`${uid}-title`} style={{ margin: "0 0 12px", fontSize: 16, color: "#1e293b" }}>
                    Dialog — focus is trapped here
                  </h3>
                  <p style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>
                    Tab cycles through the buttons below. Escape closes the dialog.
                  </p>
                  <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                    <button onClick={() => log("First button")} style={dialogBtnStyle("#3b82f6")}>First</button>
                    <button onClick={() => log("Second button")} style={dialogBtnStyle("#7c3aed")}>Second</button>
                    <button onClick={() => { setOpen(false); }} style={dialogBtnStyle("#64748b")}>Close</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#64748b",
            textTransform: "uppercase", letterSpacing: 1, marginBottom: 6,
          }}>Focus event log</div>
          <div style={{
            background: "#0f172a", borderRadius: 8, padding: 12,
            minHeight: 100, fontFamily: "monospace", fontSize: 11,
          }}>
            {focusLog.length === 0 && <div style={{ color: "#475569" }}>Open the modal to see focus events…</div>}
            {focusLog.map((entry, i) => (
              <div key={i} style={{ color: i === 0 ? "#86efac" : "#64748b", marginBottom: 3 }}>
                {entry}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Demo 4 — Live region announcer
const LiveRegionDemo: React.FC = () => {
  const [polite, setPolite] = useState("");
  const [assertive, setAssertive] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const announceTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const announce = (msg: string, type: "polite" | "assertive") => {
    if (type === "polite") {
      setPolite(msg);
    } else {
      setAssertive(msg);
      // Clear assertive quickly so it can re-announce same message
      clearTimeout(announceTimerRef.current);
      announceTimerRef.current = setTimeout(() => setAssertive(""), 100);
    }
  };

  const addToCart = () => {
    const next = cartCount + 1;
    setCartCount(next);
    announce(`Item added. Cart now has ${next} item${next !== 1 ? "s" : ""}.`, "polite");
  };

  const showError = () => {
    announce("Error: Payment declined. Please check your card details.", "assertive");
    setAssertive("Error: Payment declined. Please check your card details.");
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        Live Regions — screen reader announcements
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        Screen readers monitor these regions and announce changes. Polite waits; assertive interrupts.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ padding: "12px 14px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            aria-live="polite"
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}>
            Waits for user to finish current interaction before announcing.
            Use for status updates, cart changes, search results.
          </div>
          <button onClick={addToCart} style={{ padding: "6px 14px", borderRadius: 8, background: "#22c55e", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
            Add to cart ({cartCount})
          </button>
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={{
              marginTop: 8, fontSize: 12, color: "#16a34a",
              minHeight: 18,
            }}
          >
            {polite}
          </div>
        </div>

        <div style={{ padding: "12px 14px", background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            aria-live="assertive"
          </div>
          <div style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}>
            Interrupts immediately. Use sparingly — only for critical errors that need immediate attention.
          </div>
          <button onClick={showError} style={{ padding: "6px 14px", borderRadius: 8, background: "#ef4444", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
            Trigger error
          </button>
          <div
            role="alert"
            aria-live="assertive"
            style={{ marginTop: 8, fontSize: 12, color: "#dc2626", minHeight: 18 }}
          >
            {assertive}
          </div>
        </div>
      </div>

      <div style={{
        padding: "10px 14px", background: "#fffbeb",
        borderRadius: 8, border: "1px solid #fde68a",
        fontSize: 12, color: "#92400e",
      }}>
        <strong>Rule:</strong> Almost always use <code>aria-live="polite"</code>.
        Only use <code>"assertive"</code> for errors that require the user to act immediately.
        Overusing assertive is disruptive — it interrupts whatever the screen reader was saying.
      </div>
    </div>
  );
};

// ─── HELPER ───────────────────────────────────────────────────────────────────
const dialogBtnStyle = (bg: string): React.CSSProperties => ({
  padding: "6px 14px", borderRadius: 8, background: bg,
  color: "#fff", border: "none", cursor: "pointer",
  fontWeight: 600, fontSize: 12,
});

// ─── CONCEPTS REFERENCE ───────────────────────────────────────────────────────

const ARIA_ATTRIBUTES = [
  { attr: "aria-label", use: "Provides an invisible name for elements with no visible label", example: '<button aria-label="Close dialog">✕</button>' },
  { attr: "aria-labelledby", use: "Points to another element that IS the label (by id)", example: '<h2 id="title">Settings</h2>\n<section aria-labelledby="title">' },
  { attr: "aria-describedby", use: "Points to supplementary description (hint text, error)", example: '<input aria-describedby="hint" />\n<p id="hint">Must be 8+ chars</p>' },
  { attr: "aria-expanded", use: "Whether a controlled region (accordion, dropdown) is open", example: '<button aria-expanded={open} aria-controls="panel">' },
  { attr: "aria-selected", use: "Whether an item is selected (tabs, listbox)", example: '<button role="tab" aria-selected={active}>' },
  { attr: "aria-checked", use: "State of checkbox, radio, or switch", example: '<div role="checkbox" aria-checked={checked}>' },
  { attr: "aria-required", use: "Field is required for form submission", example: '<input aria-required="true" />' },
  { attr: "aria-invalid", use: "Field has a validation error", example: '<input aria-invalid={!!error} />' },
  { attr: "aria-disabled", use: "Element is disabled but remains focusable (for AT awareness)", example: '<button aria-disabled={loading}>' },
  { attr: "aria-live", use: "Region that announces dynamic content to screen readers", example: '<div aria-live="polite" role="status">' },
  { attr: "aria-busy", use: "Content is being updated — AT waits before reading", example: '<table aria-busy={loading}>' },
  { attr: "aria-hidden", use: "Hides element from screen readers (decorative icons, duplicates)", example: '<span aria-hidden="true">★</span>' },
];

const KEYBOARD_PATTERNS = [
  { widget: "Button", keys: "Enter / Space — activate" },
  { widget: "Link", keys: "Enter — follow" },
  { widget: "Checkbox", keys: "Space — toggle" },
  { widget: "Radio group", keys: "Arrow keys — select; Tab — leave group" },
  { widget: "Tabs", keys: "Arrow keys — switch tab; Tab — enter panel" },
  { widget: "Dialog / Modal", keys: "Escape — close; Tab stays inside (focus trap)" },
  { widget: "Combobox / Select", keys: "Arrow keys — navigate options; Enter — select; Escape — close" },
  { widget: "Menu", keys: "Arrow keys — navigate; Enter/Space — activate; Escape — close" },
];

const ConceptsTab: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>("aria");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 3 pillars */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {[
          { icon: "🏷️", title: "ARIA & Semantic HTML", body: "Roles, names, states. Use real HTML elements first — <button>, <nav>, <main>. ARIA fills gaps when semantic elements aren't enough." },
          { icon: "⌨️", title: "Keyboard Navigation", body: "Every interactive element must be reachable and operable by keyboard. Focus order must be logical. Arrow-key patterns for widgets." },
          { icon: "📢", title: "Screen Readers", body: "Live regions announce dynamic changes. Labels connect inputs to names. aria-describedby adds hints. Role=alert fires immediately." },
        ].map(c => (
          <div key={c.title} style={{ border: "1px solid #d1fae5", borderRadius: 10, padding: 16, background: "#f0fdf4" }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 4 }}>{c.title}</div>
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{c.body}</div>
          </div>
        ))}
      </div>

      {/* ARIA attribute reference */}
      {[
        { id: "aria", label: "ARIA Attributes Reference" },
        { id: "keyboard", label: "Keyboard Patterns by Widget" },
      ].map(section => (
        <div key={section.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
          <button
            onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
            style={{
              width: "100%", padding: "14px 18px",
              background: openSection === section.id ? "#f0fdf4" : "#f8fafc",
              border: "none", textAlign: "left", cursor: "pointer",
              fontWeight: 700, fontSize: 14, color: "#1e293b",
              display: "flex", justifyContent: "space-between",
            }}
          >
            {section.label}
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              {openSection === section.id ? "▲" : "▼"}
            </span>
          </button>
          {openSection === section.id && (
            <div style={{ padding: 16, background: "#fff", borderTop: "1px solid #e2e8f0" }}>
              {section.id === "aria" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ARIA_ATTRIBUTES.map(a => (
                    <div key={a.attr} style={{
                      display: "grid", gridTemplateColumns: "180px 1fr 1fr",
                      gap: 12, padding: "8px 12px",
                      background: "#f8fafc", borderRadius: 6,
                      border: "1px solid #e2e8f0",
                    }}>
                      <code style={{ fontSize: 11, fontWeight: 700, color: "#059669" }}>{a.attr}</code>
                      <span style={{ fontSize: 12, color: "#475569" }}>{a.use}</span>
                      <code style={{ fontSize: 10, color: "#64748b", whiteSpace: "pre-wrap" }}>{a.example}</code>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {KEYBOARD_PATTERNS.map(p => (
                    <div key={p.widget} style={{
                      display: "flex", gap: 12,
                      padding: "8px 12px", background: "#f8fafc",
                      borderRadius: 6, border: "1px solid #e2e8f0",
                    }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", minWidth: 140 }}>{p.widget}</span>
                      <span style={{ fontSize: 12, color: "#475569" }}>{p.keys}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Testing strategy */}
      <div style={{
        background: "#0f172a", borderRadius: 12, padding: 20,
        border: "1px solid #1e293b",
      }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#94a3b8", marginBottom: 12 }}>
          Accessibility testing strategy
        </div>
        <pre style={{
          margin: 0, fontSize: 11, lineHeight: 1.75,
          color: "#e2e8f0", fontFamily: "monospace", overflow: "auto",
        }}>{`// 1. jest-axe on every component — catches ~30-40% of issues automatically
const { container } = render(<MyComponent />);
const results = await axe(container);
expect(results).toHaveNoViolations();

// 2. Use accessibility-first queries (what AT actually sees)
getByRole('button', { name: 'Submit' })   // ✓ best
getByLabelText('Email address')           // ✓ for form inputs
getByText('Submit')                       // ✓ for static text
getByTestId('submit-btn')                 // ✗ last resort only

// 3. Test keyboard navigation
await user.tab();
expect(emailInput).toHaveFocus();
await user.keyboard('{ArrowRight}');

// 4. Test ARIA states change correctly
expect(button).toHaveAttribute('aria-expanded', 'true');
expect(input).toHaveAttribute('aria-invalid', 'false');

// 5. Test live region content
await user.click(addButton);
expect(screen.getByRole('status')).toHaveTextContent('Item added');`}
        </pre>
      </div>
    </div>
  );
};

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export const AccessibilityExplainer: React.FC = () => {
  const [tab, setTab] = useState<"concepts" | "demo">("concepts");

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 860, margin: "0 auto", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{
            background: "#059669", color: "#fff", fontSize: 11,
            fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            textTransform: "uppercase", letterSpacing: 1,
          }}>Senior — Accessibility</span>
          <span style={{
            background: "#f0fdf4", color: "#065f46", fontSize: 11,
            fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            border: "1px solid #bbf7d0",
          }}>ARIA · Keyboard · Screen Readers</span>
        </div>
        <h2 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, color: "#0f172a" }}>
          Accessibility
        </h2>
        <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.6 }}>
          Building apps that work for everyone — semantic HTML, correct ARIA roles and states,
          keyboard navigation with focus management, and screen reader live regions.
          Tested with <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>jest-axe</code> + Testing Library.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid #e2e8f0" }}>
        {(["concepts", "demo"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 20px", background: "none", border: "none",
            cursor: "pointer", fontWeight: 600, fontSize: 14,
            color: tab === t ? "#059669" : "#64748b",
            borderBottom: `3px solid ${tab === t ? "#059669" : "transparent"}`,
            marginBottom: -2, textTransform: "capitalize",
          }}>{t}</button>
        ))}
      </div>

      {tab === "concepts" ? <ConceptsTab /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <SemanticDemo />
          <AriaStatesDemo />
          <FocusTrapDemo />
          <LiveRegionDemo />
        </div>
      )}
    </div>
  );
};
