// TOPIC: Accessibility (Senior)
// LEVEL: Senior — Accessibility
//
// ─── WHY ACCESSIBILITY MATTERS ───────────────────────────────────────────────
//
//   ~15% of people worldwide have a disability affecting how they use software.
//   Accessibility (a11y) ensures your app works for:
//   - Screen reader users (blind / low vision)
//   - Keyboard-only users (motor impairment, power users)
//   - Users who need captions, sufficient colour contrast, etc.
//
//   Legal requirement in many countries (ADA, EN 301 549, WCAG 2.1 AA).
//
// ─── THREE PILLARS COVERED ───────────────────────────────────────────────────
//
//   1. ARIA & Semantic HTML   — correct roles, labels, states
//   2. Keyboard Navigation    — focus management, trap, logical order
//   3. Screen Reader Support  — live regions, announcements, descriptions
//
// ─── ARIA GOLDEN RULES ───────────────────────────────────────────────────────
//
//   1. Use semantic HTML first — <button> beats role="button" on a <div>
//   2. Every interactive element needs an accessible name
//      - Visible label:           <label htmlFor="id">
//      - Invisible label:         aria-label="Close dialog"
//      - Described by element:    aria-labelledby="heading-id"
//   3. Communicate STATE:
//      - aria-expanded  (accordion, dropdown)
//      - aria-selected  (tabs, listbox)
//      - aria-checked   (checkbox, switch)
//      - aria-disabled  (when disabled but still focusable)
//      - aria-pressed   (toggle buttons)
//   4. Communicate LIVE changes:
//      - role="alert"           — polite or assertive announcement
//      - aria-live="polite"     — wait for user to finish
//      - aria-live="assertive"  — interrupt immediately
//   5. Describe relationships:
//      - aria-controls="panel-id"   (tab → panel)
//      - aria-describedby="hint-id" (input → hint text)
//      - aria-owns / aria-haspopup
//
// ─── KEYBOARD NAVIGATION RULES ────────────────────────────────────────────────
//
//   Tab          → move focus between interactive elements
//   Shift+Tab    → move focus backwards
//   Enter/Space  → activate button or link
//   Arrow keys   → navigate within a widget (tabs, radio, listbox, menu)
//   Escape       → close dialog, tooltip, dropdown
//
//   Focus trap: when a modal is open, Tab must stay inside it.
//   Focus restoration: when modal closes, return focus to the trigger element.
//
// ─── TESTING TOOLS ───────────────────────────────────────────────────────────
//
//   jest-axe       — automated axe-core audit on rendered HTML (catches ~30-40% of issues)
//   @testing-library — getByRole / getByLabel / getByLabelText (accessibility-first queries)
//   Tab simulation — userEvent.tab() simulates keyboard navigation
//   Manual testing — NVDA (Windows), VoiceOver (Mac), browser DevTools

import React, { useState, useRef, useEffect, useId } from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS UNDER TEST
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. Accessible Form ────────────────────────────────────────────────────────

interface FormData { name: string; email: string; role: string }

const AccessibleForm: React.FC<{ onSubmit?: (data: FormData) => void }> = ({ onSubmit }) => {
  const [data, setData] = useState<FormData>({ name: "", email: "", role: "" });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitted, setSubmitted] = useState(false);
  const nameId = useId();
  const emailId = useId();
  const roleId = useId();
  const nameErrorId = useId();
  const emailErrorId = useId();

  const validate = (): boolean => {
    const errs: Partial<FormData> = {};
    if (!data.name.trim()) errs.name = "Name is required";
    if (!data.email.includes("@")) errs.email = "Valid email required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSubmitted(true);
      onSubmit?.(data);
    }
  };

  if (submitted) {
    return (
      <div role="status" aria-live="polite">
        Form submitted successfully! Welcome, {data.name}.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} aria-label="User registration form" noValidate>
      <div>
        <label htmlFor={nameId}>
          Full Name <span aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <input
          id={nameId}
          type="text"
          value={data.name}
          onChange={e => setData(d => ({ ...d, name: e.target.value }))}
          aria-required="true"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? nameErrorId : undefined}
          autoComplete="name"
        />
        {errors.name && (
          <span id={nameErrorId} role="alert">{errors.name}</span>
        )}
      </div>

      <div>
        <label htmlFor={emailId}>
          Email <span aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <input
          id={emailId}
          type="email"
          value={data.email}
          onChange={e => setData(d => ({ ...d, email: e.target.value }))}
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? emailErrorId : undefined}
          autoComplete="email"
        />
        {errors.email && (
          <span id={emailErrorId} role="alert">{errors.email}</span>
        )}
      </div>

      <div>
        <label htmlFor={roleId}>Role</label>
        <select
          id={roleId}
          value={data.role}
          onChange={e => setData(d => ({ ...d, role: e.target.value }))}
          autoComplete="organization-title"
        >
          <option value="">Select a role…</option>
          <option value="dev">Developer</option>
          <option value="design">Designer</option>
          <option value="pm">Product Manager</option>
        </select>
      </div>

      <button type="submit">Register</button>
    </form>
  );
};

// ── 2. Accessible Tabs ────────────────────────────────────────────────────────

const AccessibleTabs: React.FC = () => {
  const [active, setActive] = useState("overview");
  const uid = useId();

  const tabs = [
    { id: "overview", label: "Overview", content: "Overview panel content." },
    { id: "details", label: "Details", content: "Details panel content." },
    { id: "settings", label: "Settings", content: "Settings panel content." },
  ];

  // Arrow key navigation within tablist
  const handleKeyDown = (e: React.KeyboardEvent, currentId: string) => {
    const ids = tabs.map(t => t.id);
    const idx = ids.indexOf(currentId);
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = ids[(idx + 1) % ids.length];
      setActive(next);
      document.getElementById(`${uid}-tab-${next}`)?.focus();
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = ids[(idx - 1 + ids.length) % ids.length];
      setActive(prev);
      document.getElementById(`${uid}-tab-${prev}`)?.focus();
    }
    if (e.key === "Home") { e.preventDefault(); setActive(ids[0]); document.getElementById(`${uid}-tab-${ids[0]}`)?.focus(); }
    if (e.key === "End") { e.preventDefault(); setActive(ids[ids.length - 1]); document.getElementById(`${uid}-tab-${ids[ids.length - 1]}`)?.focus(); }
  };

  return (
    <div>
      <div role="tablist" aria-label="Content sections">
        {tabs.map(tab => (
          <button
            key={tab.id}
            id={`${uid}-tab-${tab.id}`}
            role="tab"
            aria-selected={active === tab.id}
            aria-controls={`${uid}-panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)}
            onKeyDown={e => handleKeyDown(e, tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map(tab => (
        <div
          key={tab.id}
          id={`${uid}-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-${tab.id}`}
          hidden={active !== tab.id}
          tabIndex={0}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
};

// ── 3. Accessible Modal with Focus Trap ───────────────────────────────────────

const AccessibleModal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ open, onClose, title, children }) => {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Trap focus inside modal
  useEffect(() => {
    if (!open) return;
    // Save the element that triggered the modal
    triggerRef.current = document.activeElement as HTMLButtonElement;
    // Focus the modal itself
    ref.current?.focus();
  }, [open]);

  // Restore focus on close
  useEffect(() => {
    if (!open && triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Focus trap on Tab
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !ref.current) return;
    const focusable = Array.from(
      ref.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  if (!open) return null;

  return (
    <div role="presentation" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)" }}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        style={{ background: "#fff", padding: 24, maxWidth: 480, margin: "10vh auto", borderRadius: 8 }}
      >
        <h2 id={titleId}>{title}</h2>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

// ── 4. Live Region (announcer) ────────────────────────────────────────────────

const LiveRegionDemo: React.FC = () => {
  const [message, setMessage] = useState("");
  const [count, setCount] = useState(0);

  const addItem = () => {
    const next = count + 1;
    setCount(next);
    setMessage(`Item added. You now have ${next} item${next !== 1 ? "s" : ""} in your cart.`);
  };

  return (
    <div>
      <button onClick={addItem}>Add to cart</button>
      <span data-testid="cart-count">{count}</span>
      {/* Screen readers announce changes to aria-live regions */}
      <div role="status" aria-live="polite" aria-atomic="true">
        {message}
      </div>
    </div>
  );
};

// ── 5. Accessible Toggle (switch) ────────────────────────────────────────────

const AccessibleToggle: React.FC<{ label: string; initial?: boolean }> = ({ label, initial = false }) => {
  const [on, setOn] = useState(initial);
  const id = useId();

  return (
    <div>
      <span id={id}>{label}</span>
      <button
        role="switch"
        aria-checked={on}
        aria-labelledby={id}
        onClick={() => setOn(v => !v)}
      >
        {on ? "On" : "Off"}
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. jest-axe AUTOMATED AUDITS
// ═══════════════════════════════════════════════════════════════════════════════

describe("1 — jest-axe automated audits", () => {
  it("accessible form has no axe violations", async () => {
    const { container } = render(<AccessibleForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("accessible tabs have no axe violations", async () => {
    const { container } = render(<AccessibleTabs />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("live region component has no axe violations", async () => {
    const { container } = render(<LiveRegionDemo />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("accessible toggle switch has no axe violations", async () => {
    const { container } = render(<AccessibleToggle label="Dark mode" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("detects axe violation — button with no accessible name", async () => {
    // This deliberately inaccessible component should fail axe
    const Bad = () => <button><img src="x.png" /></button>;
    const { container } = render(<Bad />);
    const results = await axe(container);
    // Expect violations to exist
    expect(results.violations.length).toBeGreaterThan(0);
    expect(results.violations.some(v => v.id === "button-name")).toBe(true);
  });

  it("detects axe violation — input with no label and no placeholder", async () => {
    // No label, no placeholder, no aria-label — genuinely unlabelled
    const Bad = () => <form><input type="text" /></form>;
    const { container } = render(<Bad />);
    const results = await axe(container);
    expect(results.violations.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ARIA ROLES AND STATES
// ═══════════════════════════════════════════════════════════════════════════════

describe("2 — ARIA roles and states", () => {
  it("form inputs have correct aria-required and aria-invalid", async () => {
    const user = userEvent.setup();
    render(<AccessibleForm />);

    const nameInput = screen.getByRole("textbox", { name: /full name/i });
    const emailInput = screen.getByRole("textbox", { name: /email/i });

    // Initially valid (aria-invalid=false)
    expect(nameInput).toHaveAttribute("aria-invalid", "false");

    // Submit empty form — triggers validation
    await user.click(screen.getByRole("button", { name: "Register" }));

    // Now invalid
    expect(nameInput).toHaveAttribute("aria-invalid", "true");
    expect(emailInput).toHaveAttribute("aria-invalid", "true");
  });

  it("error messages are linked via aria-describedby", async () => {
    const user = userEvent.setup();
    render(<AccessibleForm />);

    await user.click(screen.getByRole("button", { name: "Register" }));

    const nameInput = screen.getByRole("textbox", { name: /full name/i });
    const describedBy = nameInput.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();

    // The element with that id should contain the error text
    const errorEl = document.getElementById(describedBy!);
    expect(errorEl).toHaveTextContent("Name is required");
  });

  it("tabs have correct role, aria-selected, aria-controls", () => {
    render(<AccessibleTabs />);

    const tablist = screen.getByRole("tablist");
    const tabs = within(tablist).getAllByRole("tab");

    expect(tabs).toHaveLength(3);

    // First tab selected by default
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");

    // Each tab controls its panel
    tabs.forEach(tab => {
      const controls = tab.getAttribute("aria-controls");
      expect(controls).toBeTruthy();
      expect(document.getElementById(controls!)).not.toBeNull();
    });
  });

  it("inactive tabs are not in tab order (tabIndex=-1)", () => {
    render(<AccessibleTabs />);

    const tabs = screen.getAllByRole("tab");
    // Active tab: tabIndex=0, others: tabIndex=-1
    expect(tabs[0]).toHaveAttribute("tabindex", "0");
    expect(tabs[1]).toHaveAttribute("tabindex", "-1");
    expect(tabs[2]).toHaveAttribute("tabindex", "-1");
  });

  it("toggle switch has correct role and aria-checked", async () => {
    const user = userEvent.setup();
    render(<AccessibleToggle label="Notifications" initial={false} />);

    const toggle = screen.getByRole("switch", { name: "Notifications" });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("modal has role=dialog, aria-modal, aria-labelledby", () => {
    const App = () => {
      const [open, setOpen] = useState(true);
      return (
        <AccessibleModal open={open} onClose={() => setOpen(false)} title="Confirm deletion">
          <p>Are you sure?</p>
        </AccessibleModal>
      );
    };
    render(<App />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");

    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy!)).toHaveTextContent("Confirm deletion");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. KEYBOARD NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════

describe("3 — Keyboard navigation", () => {
  it("tab moves focus between form elements in order", async () => {
    const user = userEvent.setup();
    render(<AccessibleForm />);

    const nameInput = screen.getByRole("textbox", { name: /full name/i });
    const emailInput = screen.getByRole("textbox", { name: /email/i });
    const selectEl = screen.getByRole("combobox", { name: /role/i });
    const submitBtn = screen.getByRole("button", { name: "Register" });

    nameInput.focus();
    expect(nameInput).toHaveFocus();

    await user.tab();
    expect(emailInput).toHaveFocus();

    await user.tab();
    expect(selectEl).toHaveFocus();

    await user.tab();
    expect(submitBtn).toHaveFocus();
  });

  it("arrow keys navigate between tabs", async () => {
    const user = userEvent.setup();
    render(<AccessibleTabs />);

    const tabs = screen.getAllByRole("tab");
    tabs[0].focus();
    expect(tabs[0]).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(tabs[1]).toHaveFocus();

    await user.keyboard("{ArrowRight}");
    expect(tabs[2]).toHaveFocus();

    // Wraps around at end
    await user.keyboard("{ArrowRight}");
    expect(tabs[0]).toHaveFocus();

    // ArrowLeft goes back
    await user.keyboard("{ArrowLeft}");
    expect(tabs[2]).toHaveFocus();
  });

  it("Home/End keys jump to first/last tab", async () => {
    const user = userEvent.setup();
    render(<AccessibleTabs />);

    const tabs = screen.getAllByRole("tab");
    tabs[0].focus();

    await user.keyboard("{End}");
    expect(tabs[2]).toHaveFocus();

    await user.keyboard("{Home}");
    expect(tabs[0]).toHaveFocus();
  });

  it("Escape closes the modal", async () => {
    const onClose = jest.fn();
    const App = () => {
      const [open, setOpen] = useState(true);
      return (
        <AccessibleModal open={open} onClose={() => { setOpen(false); onClose(); }} title="Test dialog">
          <p>Content</p>
        </AccessibleModal>
      );
    };
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("focus is trapped inside open modal", async () => {
    const user = userEvent.setup();
    const App = () => {
      const [open, setOpen] = useState(true);
      return (
        <div>
          <button>Outside button</button>
          <AccessibleModal open={open} onClose={() => setOpen(false)} title="Trap test">
            <button>First inside</button>
            <button>Second inside</button>
          </AccessibleModal>
        </div>
      );
    };
    render(<App />);

    const dialog = screen.getByRole("dialog");
    const insideButtons = within(dialog).getAllByRole("button");
    // Last button is Close
    const closeBtn = insideButtons[insideButtons.length - 1];

    // Focus the last focusable element and Tab forward — should wrap to first inside
    closeBtn.focus();
    await user.tab();
    // Focus stays inside dialog (first focusable)
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("form can be submitted with Enter key", async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(<AccessibleForm onSubmit={onSubmit} />);

    await user.type(screen.getByRole("textbox", { name: /full name/i }), "Alice");
    await user.type(screen.getByRole("textbox", { name: /email/i }), "alice@test.com");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Alice", email: "alice@test.com" })
    ));
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SCREEN READER SUPPORT — live regions, announcements
// ═══════════════════════════════════════════════════════════════════════════════

describe("4 — Screen reader support", () => {
  it("live region announces cart update", async () => {
    const user = userEvent.setup();
    render(<LiveRegionDemo />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("");

    await user.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(status).toHaveTextContent("Item added. You now have 1 item in your cart.");

    await user.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(status).toHaveTextContent("Item added. You now have 2 items in your cart.");
  });

  it("form success message uses role=status for screen reader announcement", async () => {
    const user = userEvent.setup();
    render(<AccessibleForm />);

    await user.type(screen.getByRole("textbox", { name: /full name/i }), "Bob");
    await user.type(screen.getByRole("textbox", { name: /email/i }), "bob@test.com");
    await user.click(screen.getByRole("button", { name: "Register" }));

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Form submitted successfully! Welcome, Bob.");
  });

  it("validation errors are announced with role=alert", async () => {
    const user = userEvent.setup();
    render(<AccessibleForm />);

    await user.click(screen.getByRole("button", { name: "Register" }));

    const alerts = screen.getAllByRole("alert");
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0]).toHaveTextContent("Name is required");
  });

  it("sr-only content is present in DOM but hidden visually", () => {
    render(<AccessibleForm />);

    // The "(required)" hint should be in the DOM for screen readers
    const srOnlyEls = document.querySelectorAll(".sr-only");
    expect(srOnlyEls.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. ACCESSIBLE QUERIES (Testing Library best practices)
// ═══════════════════════════════════════════════════════════════════════════════

describe("5 — Accessible query priorities", () => {
  // Testing Library query priority:
  // 1. getByRole       — most accessible (what the user / AT sees)
  // 2. getByLabelText  — for form elements
  // 3. getByPlaceholder — avoid (placeholders disappear when typing)
  // 4. getByText       — for non-interactive elements
  // 5. getByTestId     — last resort (not user-visible)

  it("prefers getByRole over getByTestId", () => {
    render(<AccessibleForm />);
    // Role-based queries reflect what assistive tech sees
    expect(screen.getByRole("form", { name: /registration/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /full name/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /role/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Register" })).toBeInTheDocument();
  });

  it("getByLabelText finds inputs by their label", () => {
    render(<AccessibleForm />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("querying by role finds hidden panels (hidden attribute)", () => {
    render(<AccessibleTabs />);
    // getAllByRole with hidden:true finds all panels including inactive ones
    const allPanels = screen.getAllByRole("tabpanel", { hidden: true });
    expect(allPanels).toHaveLength(3);
    // Only one visible
    const visiblePanels = screen.getAllByRole("tabpanel");
    expect(visiblePanels).toHaveLength(1);
  });
});
