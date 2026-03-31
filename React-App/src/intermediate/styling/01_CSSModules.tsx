// TOPIC: CSS Modules
//
// CSS Modules solve the global scope problem of plain CSS.
// Every class name is automatically scoped to the file it's defined in.
//
// HOW IT WORKS:
//   You write:   styles.card
//   Webpack outputs: Card__card--xK3p9   (filename + classname + hash)
//   Result: .card in this file NEVER conflicts with .card in any other file
//
// KEY FEATURES COVERED:
//   Import syntax        → import styles from './file.module.css'
//   Basic usage          → className={styles.card}
//   Multiple classes     → className={`${styles.card} ${styles.primary}`}
//   Dynamic classes      → className={styles[variant]}  (bracket notation)
//   Conditional classes  → className={`${styles.input} ${error ? styles.inputError : ""}`}
//   composes             → reuse styles from another class (CSS-side inheritance)
//   :global              → opt out of scoping for a specific selector
//   TypeScript support   → via declarations.d.ts (*.module.css → Record<string,string>)

import React, { useState } from "react";
import styles from "./01_CSSModules.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Basic usage + variants
// ─────────────────────────────────────────────────────────────────────────────

type Variant = "default" | "primary" | "success" | "danger";

interface CardProps {
  title:    string;
  desc:     string;
  variant?: Variant;
  badge?:   string;
}

function Card({ title, desc, variant = "default", badge }: CardProps) {
  // Multiple classes: base card + optional variant class
  // styles[variant] → bracket notation for dynamic class lookup
  const cardClass = variant === "default"
    ? styles.card
    : `${styles.card} ${styles[variant]}`;

  const badgeClass = {
    primary: styles.badgePrimary,
    success: styles.badgeSuccess,
    danger:  styles.badgeDanger,
    default: "",
  }[variant];

  return (
    <div className={cardClass}>
      <p className={styles.title}>
        {title}
        {badge && <span className={`${styles.badge} ${badgeClass}`}>{badge}</span>}
      </p>
      <p className={styles.description}>{desc}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Dynamic classes — pick class by variable
// ─────────────────────────────────────────────────────────────────────────────

function ButtonRow() {
  const [active, setActive] = useState<string>("primary");

  return (
    <div className={styles.section}>
      <p className={styles.sectionTitle}>2. Dynamic classes — <code>styles[variant]</code></p>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {(["btnPrimary", "btnSuccess", "btnOutline"] as const).map((variant) => (
          <button
            key={variant}
            // Dynamic: className={styles[variant]} — picks class at runtime
            className={`${styles.btn} ${styles[variant]} ${active === variant ? styles.btnLarge : ""}`}
            onClick={() => setActive(variant)}
          >
            {variant} {active === variant && "(active — btnLarge via composes)"}
          </button>
        ))}
      </div>
      <p style={{ fontSize: "11px", color: "#888", marginTop: "8px" }}>
        Active button uses <code>styles.btnLarge</code> which is defined as
        <code> composes: btn; composes: btnPrimary;</code> in the CSS file.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Conditional classes — add/remove a class based on state
// ─────────────────────────────────────────────────────────────────────────────

function FormDemo() {
  const [values, setValues] = useState({ name: "", email: "" });
  const [touched, setTouched] = useState({ name: false, email: false });
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    name:  values.name.trim().length < 2   ? "Name must be at least 2 characters" : "",
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) ? "Enter a valid email" : "",
  };

  const showError = (field: keyof typeof errors) =>
    (touched[field] || submitted) && !!errors[field];

  return (
    <div className={styles.section}>
      <p className={styles.sectionTitle}>3. Conditional classes — error state styling</p>
      <form
        onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
        style={{ maxWidth: "360px" }}
        noValidate
      >
        {(["name", "email"] as const).map((field) => (
          <div key={field} className={styles.formGroup}>
            <label className={styles.label}>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
            <input
              type={field === "email" ? "email" : "text"}
              value={values[field]}
              onChange={(e) => setValues(v => ({ ...v, [field]: e.target.value }))}
              onBlur={() => setTouched(t => ({ ...t, [field]: true }))}
              placeholder={field === "email" ? "you@example.com" : "Jane Doe"}
              // Conditional: add inputError class when field has an error
              className={`${styles.input} ${showError(field) ? styles.inputError : ""}`}
            />
            {showError(field) && (
              <p className={styles.errorText}>{errors[field]}</p>
            )}
          </div>
        ))}
        <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>Submit</button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Grid layout with CSS Modules
// ─────────────────────────────────────────────────────────────────────────────

const CARDS: CardProps[] = [
  { title: "Default Card",  desc: "No variant — base styles only", variant: "default" },
  { title: "Primary Card",  desc: "Uses .primary class composition", variant: "primary", badge: "New" },
  { title: "Success Card",  desc: "Uses .success class composition", variant: "success", badge: "Done" },
  { title: "Danger Card",   desc: "Uses .danger class composition",  variant: "danger",  badge: "Error" },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function CSSModulesDemo() {
  return (
    <div>
      <h2>CSS Modules</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
        Locally scoped CSS — every class name gets a unique hash suffix so names never clash across files.
        <code> import styles from './file.module.css'</code> — use as <code>className=&#123;styles.card&#125;</code>.
      </p>

      <div className={styles.section}>
        <p className={styles.sectionTitle}>1. Basic usage + variants — <code>styles.card</code>, bracket notation <code>styles[variant]</code></p>
        <div className={styles.grid}>
          {CARDS.map((card) => <Card key={card.title} {...card} />)}
        </div>
        <p style={{ fontSize: "11px", color: "#888" }}>
          Inspect element → class names look like <strong>Card__card--xK3p9</strong> — scoped automatically.
        </p>
      </div>

      <ButtonRow />
      <FormDemo />

      <div style={{ padding: "12px", background: "#f5f5f5", borderRadius: "6px", fontSize: "13px" }}>
        <strong>CSS Modules reference:</strong>
        <ul style={{ margin: "6px 0 0", paddingLeft: "18px", lineHeight: "1.9" }}>
          <li>File must end in <code>.module.css</code> — Webpack applies scoping</li>
          <li><code>import styles from './file.module.css'</code></li>
          <li><code>className=&#123;styles.card&#125;</code> — single class</li>
          <li><code>className=&#123;`$&#123;styles.card&#125; $&#123;styles.primary&#125;`&#125;</code> — multiple classes</li>
          <li><code>className=&#123;styles[variant]&#125;</code> — dynamic class from variable</li>
          <li><code>className=&#123;`$&#123;styles.input&#125; $&#123;error ? styles.inputError : ""&#125;`&#125;</code> — conditional</li>
          <li><code>composes: otherClass;</code> — inherit styles from another class (CSS-side)</li>
          <li><code>:global(.someClass) &#123; &#125;</code> — opt out of scoping (rare)</li>
        </ul>
      </div>
    </div>
  );
}
