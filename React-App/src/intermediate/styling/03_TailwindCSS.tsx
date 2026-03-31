// TOPIC: Tailwind CSS
//
// Tailwind is a utility-first CSS framework — instead of writing CSS files,
// you compose pre-built utility classes directly in your JSX.
//
// SETUP (already done):
//   1. npm install tailwindcss postcss autoprefixer postcss-loader
//   2. tailwind.config.js — content: ["./src/**/*.{tsx,ts}"]
//   3. postcss.config.js  — plugins: { tailwindcss, autoprefixer }
//   4. src/tailwind.css   — @tailwind base/components/utilities
//   5. Import tailwind.css in this file
//
// KEY FEATURES COVERED:
//   Utility classes        → bg-blue-500, text-white, p-4, rounded-lg
//   Responsive design      → sm:, md:, lg:, xl: prefixes
//   Dark mode              → dark: prefix (class strategy — toggle "dark" on <html>)
//   Hover / focus states   → hover:, focus:, active:, disabled:
//   Flexbox & Grid         → flex, grid, gap, justify, items
//   Spacing                → p-*, m-*, gap-*, space-*
//   Typography             → text-*, font-*, leading-*, tracking-*
//   Borders & shadows      → border, rounded-*, shadow-*
//   Arbitrary values       → bg-[#ff6b6b], w-[320px], text-[13px]
//   @apply                 → extract utility combos into reusable CSS classes
//   cn() helper            → conditional class joining (industry standard pattern)

import "../../tailwind.css";
import React, { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// cn() — simple class name joiner (industry uses clsx or tailwind-merge)
// In real projects: npm install clsx tailwind-merge
// ─────────────────────────────────────────────────────────────────────────────

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Utility classes — building a Card
// ─────────────────────────────────────────────────────────────────────────────

type Variant = "default" | "primary" | "success" | "danger" | "warning";

const variantMap: Record<Variant, { border: string; bg: string; badge: string; title: string }> = {
  default: { border: "border-gray-200",  bg: "bg-white",       badge: "bg-gray-400",    title: "text-gray-800" },
  primary: { border: "border-blue-400",  bg: "bg-blue-50",     badge: "bg-blue-500",    title: "text-blue-800" },
  success: { border: "border-green-400", bg: "bg-green-50",    badge: "bg-green-500",   title: "text-green-800" },
  danger:  { border: "border-red-400",   bg: "bg-red-50",      badge: "bg-red-500",     title: "text-red-800" },
  warning: { border: "border-yellow-400",bg: "bg-yellow-50",   badge: "bg-yellow-500",  title: "text-yellow-800" },
};

function Card({ title, desc, badge, variant = "default" }: { title: string; desc: string; badge?: string; variant?: Variant }) {
  const v = variantMap[variant];
  return (
    <div className={cn(
      "rounded-lg border p-4 mb-3 transition-all duration-200",
      "hover:-translate-y-0.5 hover:shadow-md",
      v.border, v.bg,
    )}>
      <h4 className={cn("text-sm font-bold mb-1", v.title)}>
        {title}
        {badge && (
          <span className={cn("ml-2 inline-block px-2 py-0.5 rounded-full text-[11px] text-white font-bold", v.badge)}>
            {badge}
          </span>
        )}
      </h4>
      <p className="text-xs text-gray-500 leading-relaxed m-0">{desc}</p>
    </div>
  );
}

function CardSection() {
  return (
    <div className="p-4 bg-gray-50 rounded-xl mb-4">
      <h4 className="text-sm font-bold mb-3 text-gray-600 border-b border-gray-200 pb-2">
        1. Utility classes — Card with variants
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Card title="Default"  desc="Base utility classes" />
        <Card title="Primary"  desc="border-blue-400 bg-blue-50"  badge="New"   variant="primary" />
        <Card title="Success"  desc="border-green-400 bg-green-50" badge="Done"  variant="success" />
        <Card title="Danger"   desc="border-red-400 bg-red-50"    badge="Error" variant="danger" />
        <Card title="Warning"  desc="border-yellow-400 bg-yellow-50" badge="Warn" variant="warning" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Button component — hover, focus, disabled, size, variant
// ─────────────────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "success" | "danger" | "outline" | "ghost";
  size?:    "sm" | "md" | "lg";
  loading?: boolean;
}

function Button({ variant = "primary", size = "md", loading, children, className, disabled, ...rest }: ButtonProps) {
  const base = "inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-2.5 text-base",
  };

  const variants = {
    primary: "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 focus:ring-blue-400",
    success: "bg-green-500 text-white hover:bg-green-600 active:bg-green-700 focus:ring-green-400",
    danger:  "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus:ring-red-400",
    outline: "bg-transparent border border-blue-500 text-blue-500 hover:bg-blue-50 focus:ring-blue-400",
    ghost:   "bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300",
  };

  return (
    <button
      className={cn(base, sizes[size], variants[variant], loading && "opacity-60 cursor-wait", className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-3 w-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      )}
      {children}
    </button>
  );
}

function ButtonSection() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-4 bg-gray-50 rounded-xl mb-4">
      <h4 className="text-sm font-bold mb-3 text-gray-600 border-b border-gray-200 pb-2">
        2. Button — hover:, focus:, active:, disabled:, animate-spin
      </h4>
      <div className="flex flex-wrap gap-2 mb-3">
        {(["primary","success","danger","outline","ghost"] as const).map((v) => (
          <Button key={v} variant={v}>{v}</Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {(["sm","md","lg"] as const).map((s) => (
          <Button key={s} size={s}>{s} size</Button>
        ))}
      </div>
      <div className="flex gap-2">
        <Button loading={loading} onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 2000); }}>
          {loading ? "Loading…" : "Trigger loading"}
        </Button>
        <Button variant="outline" disabled>Disabled</Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Responsive design — sm:, md:, lg: breakpoints
// ─────────────────────────────────────────────────────────────────────────────

function ResponsiveSection() {
  return (
    <div className="p-4 bg-gray-50 rounded-xl mb-4">
      <h4 className="text-sm font-bold mb-3 text-gray-600 border-b border-gray-200 pb-2">
        3. Responsive design — sm: md: lg: prefixes (resize the window)
      </h4>

      {/* Layout changes: stacked → 2col → 3col */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {["A","B","C","D"].map((l) => (
          <div key={l} className="bg-blue-100 text-blue-800 rounded-lg p-3 text-center text-sm font-bold">
            {l}
          </div>
        ))}
      </div>

      {/* Text size changes per breakpoint */}
      <p className="text-xs sm:text-sm md:text-base lg:text-lg font-medium text-gray-700">
        This text is: <code>text-xs</code> → <code>sm:text-sm</code> → <code>md:text-base</code> → <code>lg:text-lg</code>
      </p>

      {/* Hidden / visible at different breakpoints */}
      <div className="mt-2 flex gap-2 text-xs">
        <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded block sm:hidden">visible: mobile only</span>
        <span className="bg-blue-200 text-blue-700 px-2 py-1 rounded hidden sm:block lg:hidden">visible: sm–lg</span>
        <span className="bg-green-200 text-green-700 px-2 py-1 rounded hidden lg:block">visible: lg+</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Dark mode — dark: prefix
// ─────────────────────────────────────────────────────────────────────────────

function DarkModeSection() {
  const [dark, setDark] = useState(false);

  return (
    // Toggling "dark" class on the wrapper enables dark: utilities
    <div className={cn("p-4 rounded-xl mb-4", dark ? "dark" : "")}>
      <div className={cn(
        "p-4 rounded-xl transition-colors duration-300",
        "bg-gray-50 text-gray-800",
        "dark:bg-gray-900 dark:text-gray-100",
      )}>
        <div className="flex items-center justify-between mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
          <h4 className="text-sm font-bold">4. Dark mode — dark: prefix</h4>
          <button
            onClick={() => setDark(d => !d)}
            className="text-xs px-3 py-1.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {dark ? "☀ Light" : "🌙 Dark"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { title: "Card title",   desc: "bg-white dark:bg-gray-800",   classes: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" },
            { title: "Muted text",   desc: "text-gray-500 dark:text-gray-400", classes: "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" },
            { title: "Primary bg",  desc: "bg-blue-50 dark:bg-blue-900/30", classes: "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800" },
          ].map(({ title, desc, classes }) => (
            <div key={title} className={cn("rounded-lg p-3", classes)}>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100 m-0">{title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 m-0">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 mb-0">
          Add <code>class="dark"</code> to a parent element to activate <code>dark:</code> utilities (class strategy in tailwind.config.js).
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Arbitrary values — escape hatch for one-off values
// ─────────────────────────────────────────────────────────────────────────────

function ArbitrarySection() {
  return (
    <div className="p-4 bg-gray-50 rounded-xl mb-4">
      <h4 className="text-sm font-bold mb-3 text-gray-600 border-b border-gray-200 pb-2">
        5. Arbitrary values — bg-[#color], w-[px], text-[size]
      </h4>
      <div className="flex flex-wrap gap-3">
        <div className="bg-[#6c63ff] text-white px-4 py-2 rounded-lg text-sm">bg-[#6c63ff]</div>
        <div className="w-[140px] h-[40px] bg-[#ff6b6b] text-white flex items-center justify-center rounded-lg text-[13px]">
          w-[140px] h-[40px]
        </div>
        <div className="border-[3px] border-[#f1c40f] p-2 rounded text-[12px] text-gray-700">
          border-[3px] border-[#f1c40f]
        </div>
        <div className="mt-[7px] grid grid-cols-[2fr_1fr] gap-2">
          <div className="bg-green-200 text-green-800 p-2 rounded text-xs">grid-cols-[2fr_1fr] — col 1</div>
          <div className="bg-green-100 text-green-800 p-2 rounded text-xs">col 2</div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2 mb-0">
        Use <code>[value]</code> for any one-off value not in the Tailwind scale.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Form with Tailwind
// ─────────────────────────────────────────────────────────────────────────────

function FormSection() {
  const [values, setValues] = useState({ name: "", email: "", role: "viewer" });
  const [touched, setTouched] = useState({ name: false, email: false });

  const errors = {
    name:  values.name.trim().length < 2 ? "Name too short" : "",
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) ? "Invalid email" : "",
  };

  return (
    <div className="p-4 bg-gray-50 rounded-xl mb-4">
      <h4 className="text-sm font-bold mb-3 text-gray-600 border-b border-gray-200 pb-2">
        6. Form — focus:ring, peer, error states
      </h4>
      <form className="max-w-sm space-y-3" noValidate onSubmit={(e) => e.preventDefault()}>
        {(["name","email"] as const).map((field) => {
          const hasErr = touched[field] && !!errors[field];
          return (
            <div key={field}>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                type={field === "email" ? "email" : "text"}
                value={values[field]}
                onChange={(e) => setValues(v => ({ ...v, [field]: e.target.value }))}
                onBlur={() => setTouched(t => ({ ...t, [field]: true }))}
                placeholder={field === "email" ? "you@example.com" : "Jane Doe"}
                className={cn(
                  "block w-full px-3 py-2 text-sm rounded-md border outline-none transition-all",
                  "placeholder:text-gray-400",
                  hasErr
                    ? "border-red-400 focus:ring-2 focus:ring-red-300 bg-red-50"
                    : "border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-400",
                )}
              />
              {hasErr && <p className="mt-1 text-xs text-red-500">{errors[field]}</p>}
            </div>
          );
        })}

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Role</label>
          <select
            value={values.role}
            onChange={(e) => setValues(v => ({ ...v, role: e.target.value }))}
            className="block w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none bg-white"
          >
            {["viewer","editor","admin"].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <Button variant="primary" className="w-full justify-center">Save</Button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export default function TailwindCSSDemo() {
  return (
    <div>
      <h2>Tailwind CSS</h2>
      <p className="text-sm text-gray-500 mb-4">
        Utility-first CSS framework. Compose pre-built classes directly in JSX — no separate CSS files needed.
        Purges unused classes in production (only ships what you use).
      </p>

      <CardSection />
      <ButtonSection />
      <ResponsiveSection />
      <DarkModeSection />
      <ArbitrarySection />
      <FormSection />

      <div className="p-3 bg-gray-100 rounded-xl text-sm">
        <strong>Tailwind reference:</strong>
        <ul className="mt-2 pl-5 space-y-1 text-xs text-gray-600 list-disc leading-relaxed">
          <li><code>p-4 m-2 gap-3</code> — spacing (1 unit = 4px)</li>
          <li><code>text-sm font-bold text-gray-700 leading-relaxed</code> — typography</li>
          <li><code>bg-blue-500 text-white border border-gray-200 rounded-lg shadow-md</code> — visual</li>
          <li><code>flex items-center justify-between gap-2</code> — flexbox</li>
          <li><code>grid grid-cols-3 gap-4</code> — grid</li>
          <li><code>hover:bg-blue-600 focus:ring-2 active:scale-95 disabled:opacity-50</code> — state variants</li>
          <li><code>sm:grid-cols-2 md:text-base lg:hidden</code> — responsive (mobile-first)</li>
          <li><code>dark:bg-gray-900 dark:text-white</code> — dark mode (class strategy)</li>
          <li><code>bg-[#ff6b6b] w-[320px] text-[13px]</code> — arbitrary values</li>
          <li><code>transition-all duration-200 ease-in-out</code> — transitions</li>
          <li><code>animate-spin animate-pulse animate-bounce</code> — built-in animations</li>
          <li><code>cn(...classes)</code> — conditional class joining (use clsx + tailwind-merge in production)</li>
        </ul>
      </div>
    </div>
  );
}
