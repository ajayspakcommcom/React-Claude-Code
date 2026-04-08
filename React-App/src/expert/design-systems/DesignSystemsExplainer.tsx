// TOPIC: Design Systems — Visual Explainer
// Monorepos, Versioned Component Libraries, Theming & Tokens

import React, { useState, useContext, createContext, useMemo } from "react";

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  container: { fontFamily: "monospace", fontSize: 13, padding: 20, maxWidth: 900 } as React.CSSProperties,
  h2: { fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#1e293b" } as React.CSSProperties,
  h3: { fontSize: 15, fontWeight: 700, marginBottom: 8, color: "#334155" } as React.CSSProperties,
  tabs: { display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" as const },
  tab: (active: boolean): React.CSSProperties => ({
    padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
    background: active ? "#6366f1" : "#e2e8f0",
    color: active ? "#fff" : "#334155",
    fontFamily: "monospace", fontSize: 12, fontWeight: 600,
  }),
  code: {
    background: "#0f172a", color: "#e2e8f0", borderRadius: 8,
    padding: "14px 16px", overflowX: "auto" as const,
    lineHeight: 1.6, fontSize: 12, marginBottom: 12,
  } as React.CSSProperties,
  card: {
    background: "#f8fafc", border: "1px solid #e2e8f0",
    borderRadius: 8, padding: "12px 16px", marginBottom: 10,
  } as React.CSSProperties,
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 } as React.CSSProperties,
  label: (color: string): React.CSSProperties => ({
    display: "inline-block", padding: "2px 8px", borderRadius: 4,
    background: color, color: "#fff", fontSize: 11, fontWeight: 700, marginBottom: 6,
  }),
  note: {
    background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6,
    padding: "8px 12px", fontSize: 12, marginBottom: 10, color: "#78350f",
  } as React.CSSProperties,
  row: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 } as React.CSSProperties,
  btn: (color = "#6366f1"): React.CSSProperties => ({
    padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
    background: color, color: "#fff", fontFamily: "monospace",
    fontSize: 12, fontWeight: 600, marginRight: 6,
  }),
};

// ─── Demo 1: Monorepo ─────────────────────────────────────────────────────────

const MONO_TABS = ["structure", "dependency graph", "task pipeline"] as const;
type MonoTab = (typeof MONO_TABS)[number];

const MonorepoDemo: React.FC = () => {
  const [tab, setTab] = useState<MonoTab>("structure");
  const [changed, setChanged] = useState<string>("tokens");
  const [step, setStep] = useState(0);

  const packages = [
    { name: "tokens", deps: [] as string[], color: "#6366f1" },
    { name: "utils", deps: [] as string[], color: "#0891b2" },
    { name: "ui", deps: ["tokens", "utils"], color: "#7c3aed" },
    { name: "web", deps: ["ui"], color: "#059669" },
    { name: "docs", deps: ["ui"], color: "#d97706" },
    { name: "api", deps: ["utils"], color: "#dc2626" },
  ];

  const getAffected = (changed: string): Set<string> => {
    const affected = new Set<string>([changed]);
    let dirty = true;
    while (dirty) {
      dirty = false;
      for (const p of packages) {
        if (!affected.has(p.name) && p.deps.some(d => affected.has(d))) {
          affected.add(p.name);
          dirty = true;
        }
      }
    }
    return affected;
  };

  const affected = getAffected(changed);

  const pipelineSteps = [
    { pkg: "tokens", task: "build", cached: false },
    { pkg: "utils", task: "build", cached: true },
    { pkg: "ui", task: "build", cached: false },
    { pkg: "web", task: "build", cached: false },
    { pkg: "docs", task: "build", cached: true },
  ];

  return (
    <div>
      <div style={s.tabs}>
        {MONO_TABS.map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "structure" && (
        <>
          <div style={s.note}>
            A monorepo hosts all packages + apps in one repo. Shared tooling, atomic commits, easier cross-package refactoring.
          </div>
          <div style={s.code}>
            {`repo/
├── apps/
│   ├── web/               ← Next.js app (uses @acme/ui)
│   └── docs/              ← Storybook (showcases @acme/ui)
├── packages/
│   ├── ui/                ← Shared component library
│   ├── tokens/            ← Design tokens (source of truth)
│   ├── utils/             ← Shared utilities (formatters, hooks)
│   └── tsconfig/          ← Shared TypeScript configs
├── turbo.json             ← Turborepo task pipeline
├── pnpm-workspace.yaml    ← workspace: ["apps/*", "packages/*"]
└── package.json`}
          </div>
          <div style={s.grid2}>
            <div style={s.card}>
              <div style={s.label("#6366f1")}>Turborepo</div>
              <ul style={{ fontSize: 12, color: "#475569", margin: "4px 0 0", paddingLeft: 14 }}>
                <li>Task pipeline via <code>turbo.json</code></li>
                <li>Remote caching (Vercel)</li>
                <li>Only rebuilds changed packages</li>
                <li>Parallelises independent tasks</li>
              </ul>
            </div>
            <div style={s.card}>
              <div style={s.label("#0891b2")}>Nx</div>
              <ul style={{ fontSize: 12, color: "#475569", margin: "4px 0 0", paddingLeft: 14 }}>
                <li><code>nx affected:test --base=main</code></li>
                <li>Dependency graph visualiser</li>
                <li>Plugins for frameworks</li>
                <li>Distributed task execution</li>
              </ul>
            </div>
          </div>
          <div style={s.card}>
            <strong style={{ fontSize: 12 }}>turbo.json pipeline</strong>
            <div style={{ ...s.code, marginTop: 8, marginBottom: 0, fontSize: 11 }}>
              {`{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],   // run deps' build first
      "outputs": ["dist/**"]     // what to cache
    },
    "test":  { "dependsOn": ["build"] },
    "lint":  {}                  // no deps, runs immediately
  }
}`}
            </div>
          </div>
        </>
      )}

      {tab === "dependency graph" && (
        <>
          <div style={s.note}>
            Change a package → only it and its dependents need to be rebuilt/tested.
            Select a changed package to see which ones are affected.
          </div>
          <div style={s.tabs}>
            {["tokens", "utils", "ui", "api"].map(p => (
              <button
                key={p}
                style={{ ...s.btn(changed === p ? "#6366f1" : "#94a3b8") }}
                onClick={() => setChanged(p)}
              >
                {p} changed
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {packages.map(p => {
              const isAffected = affected.has(p.name);
              const isChanged = p.name === changed;
              return (
                <div
                  key={p.name}
                  style={{
                    padding: "8px 14px", borderRadius: 8,
                    background: isChanged ? p.color : isAffected ? "#fef3c7" : "#f1f5f9",
                    color: isChanged ? "#fff" : isAffected ? "#92400e" : "#64748b",
                    border: `2px solid ${isAffected ? p.color : "#e2e8f0"}`,
                    fontSize: 12, fontWeight: 700,
                  }}
                >
                  {isChanged ? "✏️" : isAffected ? "⚡" : "✓"} {p.name}
                  {p.deps.length > 0 && (
                    <div style={{ fontSize: 10, fontWeight: 400, marginTop: 2 }}>
                      deps: {p.deps.join(", ")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={s.card}>
            <strong style={{ fontSize: 12 }}>Affected: </strong>
            {Array.from(affected).map(p => (
              <span key={p} style={{ ...s.label("#6366f1"), marginRight: 4 }}>{p}</span>
            ))}
            <p style={{ fontSize: 12, color: "#475569", margin: "8px 0 0" }}>
              <strong>Not affected ({packages.filter(p => !affected.has(p.name)).map(p => p.name).join(", ")}):</strong> these packages skip build entirely — Turborepo serves them from cache.
            </p>
          </div>
        </>
      )}

      {tab === "task pipeline" && (
        <>
          <div style={s.note}>
            Turborepo runs tasks in dependency order and skips any package whose inputs (source files) haven't changed. Cache hits show as instant.
          </div>
          <div style={{ marginBottom: 12 }}>
            {pipelineSteps.slice(0, step + 1).map((s2, i) => (
              <div
                key={i}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "8px 12px", borderRadius: 6, marginBottom: 4,
                  background: s2.cached ? "#f0fdf4" : "#ede9fe",
                  border: `1px solid ${s2.cached ? "#bbf7d0" : "#c4b5fd"}`,
                }}
              >
                <span style={{ fontSize: 16 }}>{s2.cached ? "💾" : "⚙️"}</span>
                <code style={{ fontSize: 12, color: "#334155", minWidth: 80 }}>{s2.pkg}</code>
                <span style={{ fontSize: 11, color: s2.cached ? "#059669" : "#6d28d9", fontWeight: 700 }}>
                  {s2.cached ? "CACHE HIT — 0ms" : "BUILDING…"}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {step < pipelineSteps.length - 1 && (
              <button style={s.btn()} onClick={() => setStep(s => s + 1)}>Next task →</button>
            )}
            {step > 0 && (
              <button style={s.btn("#94a3b8")} onClick={() => setStep(0)}>Reset</button>
            )}
          </div>
          {step === pipelineSteps.length - 1 && (
            <div style={{ ...s.card, marginTop: 12, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              ✅ Pipeline complete — {pipelineSteps.filter(s => s.cached).length} cache hits, {pipelineSteps.filter(s => !s.cached).length} rebuilt
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ─── Demo 2: Versioned Component Library ─────────────────────────────────────

const SEMVER_TABS = ["semver", "changesets", "tree-shaking", "peer deps"] as const;
type SemverTab = (typeof SEMVER_TABS)[number];

const ComponentLibraryDemo: React.FC = () => {
  const [tab, setTab] = useState<SemverTab>("semver");
  const [version, setVersion] = useState("1.2.3");

  const bump = (type: "major" | "minor" | "patch") => {
    const [maj, min, pat] = version.split(".").map(Number);
    if (type === "major") setVersion(`${maj + 1}.0.0`);
    else if (type === "minor") setVersion(`${maj}.${min + 1}.0`);
    else setVersion(`${maj}.${min}.${pat + 1}`);
  };

  return (
    <div>
      <div style={s.tabs}>
        {SEMVER_TABS.map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "semver" && (
        <>
          <div style={s.note}>
            Semantic Versioning: <strong>MAJOR.MINOR.PATCH</strong> — consumers know what to expect from a version bump.
          </div>
          <div style={{ ...s.card, textAlign: "center" as const }}>
            <div style={{ fontSize: 40, fontWeight: 700, color: "#6366f1", letterSpacing: 4, marginBottom: 12 }}>
              {version}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
              <button
                style={s.btn("#dc2626")}
                onClick={() => bump("major")}
                title="Breaking change"
              >
                major +1 💥
              </button>
              <button
                style={s.btn("#0891b2")}
                onClick={() => bump("minor")}
                title="New feature"
              >
                minor +1 ✨
              </button>
              <button
                style={s.btn("#059669")}
                onClick={() => bump("patch")}
                title="Bug fix"
              >
                patch +1 🐛
              </button>
              <button style={s.btn("#94a3b8")} onClick={() => setVersion("1.2.3")}>reset</button>
            </div>
          </div>
          {[
            { bump: "PATCH — 1.2.3 → 1.2.4", color: "#059669", when: "Bug fix, backward-compatible. Consumers should auto-update." },
            { bump: "MINOR — 1.2.3 → 1.3.0", color: "#0891b2", when: "New feature, backward-compatible. Consumers opt in." },
            { bump: "MAJOR — 1.2.3 → 2.0.0", color: "#dc2626", when: "Breaking change. Consumers must migrate. Document in CHANGELOG." },
          ].map(({ bump: b, color, when }) => (
            <div key={b} style={{ ...s.card, borderLeft: `4px solid ${color}` }}>
              <div style={s.label(color)}>{b.split(" —")[0]}</div>
              <div style={{ fontSize: 12, color: "#475569" }}>{b.split("—")[1]?.trim()}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{when}</div>
            </div>
          ))}
          <div style={s.card}>
            <div style={s.label("#7c3aed")}>Pre-release tags</div>
            {[
              { tag: "2.0.0-alpha.1", desc: "Early unstable. May have known issues. Do not use in production." },
              { tag: "2.0.0-beta.3", desc: "Feature-complete. Needs testing. API may still change." },
              { tag: "2.0.0-rc.1", desc: "Release candidate. Stable unless bugs found." },
            ].map(({ tag, desc }) => (
              <div key={tag} style={s.row}>
                <code style={{ minWidth: 120, color: "#6366f1" }}>{tag}</code>
                <span style={{ fontSize: 11, color: "#64748b" }}>{desc}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "changesets" && (
        <>
          <div style={s.note}>
            Changesets automates versioning + changelogs in a monorepo. Developers declare intent; tooling handles the mechanics.
          </div>
          {[
            { n: "1", title: "Developer runs npx changeset", desc: "Interactive CLI asks: which packages changed? bump type? write a summary. Creates a .changeset/random-name.md file.", code: `---
"@acme/ui": minor
"@acme/utils": patch
---

Add Icon component. Fix utils formatDate timezone bug.` },
            { n: "2", title: "PR review", desc: "The .changeset file is committed. Reviewers see exactly what will be released and why.", code: null },
            { n: "3", title: "changeset version (on merge to main)", desc: "Reads all .changeset files, bumps package.json versions, writes CHANGELOG.md entries, deletes changeset files.", code: `# @acme/ui

## 1.3.0

### Minor Changes

- Add Icon component` },
            { n: "4", title: "changeset publish", desc: "Runs npm publish for each bumped package. Tags the git commit.", code: `npx changeset publish
→ Publishing @acme/ui@1.3.0
→ Publishing @acme/utils@1.0.4` },
          ].map(({ n, title, desc, code }) => (
            <div key={n} style={{ ...s.card, borderLeft: "4px solid #6366f1" }}>
              <div style={s.row}>
                <span style={{ ...s.label("#6366f1"), borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {n}
                </span>
                <strong style={{ fontSize: 12 }}>{title}</strong>
              </div>
              <p style={{ fontSize: 12, color: "#475569", margin: "4px 0 6px" }}>{desc}</p>
              {code && <div style={{ ...s.code, marginBottom: 0, fontSize: 11 }}>{code}</div>}
            </div>
          ))}
        </>
      )}

      {tab === "tree-shaking" && (
        <>
          <div style={s.note}>
            Tree-shaking removes unused exports from the final bundle. Requires ESM (ES modules) — CommonJS cannot be tree-shaken.
          </div>
          <div style={s.grid2}>
            <div style={{ ...s.card, borderTop: "3px solid #dc2626" }}>
              <div style={s.label("#dc2626")}>Cannot tree-shake</div>
              <div style={{ ...s.code, marginBottom: 0, fontSize: 11 }}>
                {`// CommonJS — entire file included
const { Button } = require('@acme/ui');

// Default export with spread — bundler can't
// statically analyse which keys are used
import UI from '@acme/ui';
const { Button } = UI;

// Side effects in module scope
import '@acme/ui/styles.css'; // entire file`}
              </div>
            </div>
            <div style={{ ...s.card, borderTop: "3px solid #059669" }}>
              <div style={s.label("#059669")}>Tree-shakeable ✅</div>
              <div style={{ ...s.code, marginBottom: 0, fontSize: 11 }}>
                {`// Named ESM imports
import { Button } from '@acme/ui';
// → only Button.js included in bundle

// package.json
{
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": "./dist/index.js"
  }
}
// → bundler knows no side effects,
//   safely eliminates unused exports`}
              </div>
            </div>
          </div>
          <div style={s.card}>
            <strong style={{ fontSize: 12 }}>What "sideEffects": false means</strong>
            <p style={{ fontSize: 12, color: "#475569", margin: "4px 0 0" }}>
              Tells the bundler: importing this package doesn't run any global code (no CSS injection, no polyfills, no DOM mutations). Safe to eliminate any module not explicitly imported. If you have CSS files, use <code>"sideEffects": ["*.css"]</code>.
            </p>
          </div>
        </>
      )}

      {tab === "peer deps" && (
        <>
          <div style={s.note}>
            Component libraries declare React as a <strong>peerDependency</strong>, not a dependency. This ensures the consumer's React instance is used, avoiding "two copies of React" bugs (invalid hook calls, context not shared).
          </div>
          <div style={s.code}>
            {`// @acme/ui/package.json
{
  "name": "@acme/ui",
  "version": "1.0.0",
  "peerDependencies": {
    "react": ">=17",
    "react-dom": ">=17"
  },
  "devDependencies": {
    "react": "18.3.1",       // for local development + testing
    "react-dom": "18.3.1"
  }
  // ❌ NOT in "dependencies"
}

// Consumer app/package.json
{
  "dependencies": {
    "@acme/ui": "^1.0.0",
    "react": "18.3.1"       // this React is used by both app and @acme/ui
  }
}`}
          </div>
          <div style={s.grid2}>
            <div style={s.card}>
              <div style={s.label("#dc2626")}>Two Reacts (bad)</div>
              <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>
                React in <code>dependencies</code> → library brings its own React → hooks throw "invalid hook call", context not shared across the boundary.
              </p>
            </div>
            <div style={s.card}>
              <div style={s.label("#059669")}>One React (good)</div>
              <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>
                React in <code>peerDependencies</code> → npm/pnpm resolves to the consumer's React → single instance, hooks + context work correctly.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Demo 3: Theming & Tokens ─────────────────────────────────────────────────

interface DesignTokens {
  color: { primary: string; surface: string; text: string; textMuted: string; border: string; error: string; success: string };
  spacing: { xs: number; sm: number; md: number; lg: number };
  font: { size: { sm: number; md: number; lg: number }; weight: { normal: number; bold: number } };
  radius: { md: number; full: number };
  shadow: { sm: string; md: string };
}

type ThemeName = "light" | "dark" | "high-contrast";

const themes: Record<ThemeName, DesignTokens> = {
  light: {
    color: { primary: "#6366f1", surface: "#ffffff", text: "#0f172a", textMuted: "#64748b", border: "#e2e8f0", error: "#dc2626", success: "#059669" },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
    font: { size: { sm: 12, md: 14, lg: 16 }, weight: { normal: 400, bold: 700 } },
    radius: { md: 8, full: 9999 },
    shadow: { sm: "0 1px 2px rgb(0 0 0 / 0.05)", md: "0 4px 6px -1px rgb(0 0 0 / 0.1)" },
  },
  dark: {
    color: { primary: "#818cf8", surface: "#0f172a", text: "#f1f5f9", textMuted: "#94a3b8", border: "#1e293b", error: "#f87171", success: "#34d399" },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
    font: { size: { sm: 12, md: 14, lg: 16 }, weight: { normal: 400, bold: 700 } },
    radius: { md: 8, full: 9999 },
    shadow: { sm: "0 1px 2px rgb(0 0 0 / 0.2)", md: "0 4px 6px -1px rgb(0 0 0 / 0.4)" },
  },
  "high-contrast": {
    color: { primary: "#4338ca", surface: "#ffffff", text: "#000000", textMuted: "#374151", border: "#000000", error: "#b91c1c", success: "#065f46" },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
    font: { size: { sm: 12, md: 14, lg: 16 }, weight: { normal: 400, bold: 700 } },
    radius: { md: 8, full: 9999 },
    shadow: { sm: "none", md: "none" },
  },
};

const ThemeCtx = createContext<{ theme: ThemeName; tokens: DesignTokens; setTheme: (t: ThemeName) => void }>({
  theme: "light", tokens: themes.light, setTheme: () => {},
});

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = React.useState<ThemeName>("light");
  const tokens = useMemo(() => themes[theme], [theme]);
  return (
    <ThemeCtx.Provider value={{ theme, tokens, setTheme }}>
      {children}
    </ThemeCtx.Provider>
  );
};

const useTokens = () => useContext(ThemeCtx);

const TokenButton: React.FC<{ variant?: "primary" | "danger"; size?: "sm" | "md" | "lg"; children: React.ReactNode }> = ({
  variant = "primary", size = "md", children,
}) => {
  const { tokens } = useTokens();
  const bg = variant === "danger" ? tokens.color.error : tokens.color.primary;
  const pad = { sm: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`, md: `${tokens.spacing.sm}px ${tokens.spacing.md}px`, lg: `${tokens.spacing.md}px ${tokens.spacing.lg}px` }[size];
  return (
    <button style={{ background: bg, color: "#fff", padding: pad, borderRadius: tokens.radius.md, border: "none", cursor: "pointer", fontSize: tokens.font.size[size], fontWeight: tokens.font.weight.bold, boxShadow: tokens.shadow.sm }}>
      {children}
    </button>
  );
};

const TokenCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const { tokens } = useTokens();
  return (
    <div style={{ background: tokens.color.surface, color: tokens.color.text, border: `1px solid ${tokens.color.border}`, borderRadius: tokens.radius.md, padding: tokens.spacing.md, boxShadow: tokens.shadow.md }}>
      <h4 style={{ margin: "0 0 8px", fontSize: tokens.font.size.lg, fontWeight: tokens.font.weight.bold, color: tokens.color.text }}>{title}</h4>
      <p style={{ margin: 0, fontSize: tokens.font.size.sm, color: tokens.color.textMuted }}>{children}</p>
    </div>
  );
};

const TOKEN_TABS = ["token tiers", "live preview", "CSS vars", "multi-theme"] as const;
type TokenTab = (typeof TOKEN_TABS)[number];

const ThemingDemo: React.FC = () => {
  const [tab, setTab] = useState<TokenTab>("token tiers");

  return (
    <ThemeProvider>
      <ThemingDemoInner tab={tab} setTab={setTab} />
    </ThemeProvider>
  );
};

const ThemingDemoInner: React.FC<{ tab: TokenTab; setTab: (t: TokenTab) => void }> = ({ tab, setTab }) => {
  const { theme, tokens, setTheme } = useTokens();

  const cssVars = {
    "--color-primary": tokens.color.primary,
    "--color-surface": tokens.color.surface,
    "--color-text": tokens.color.text,
    "--color-border": tokens.color.border,
    "--spacing-md": `${tokens.spacing.md}px`,
    "--radius-md": `${tokens.radius.md}px`,
    "--shadow-md": tokens.shadow.md,
  };

  return (
    <div>
      <div style={s.tabs}>
        {TOKEN_TABS.map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "token tiers" && (
        <>
          <div style={s.note}>
            Three-tier token architecture: primitives → semantics → components. Only semantic tokens are consumed by components — primitives are never used directly.
          </div>
          <div style={{ ...s.card, borderLeft: "4px solid #94a3b8" }}>
            <div style={s.label("#94a3b8")}>Tier 1 — Primitive (global) tokens</div>
            <p style={{ fontSize: 12, color: "#475569", margin: "4px 0 6px" }}>Raw values. Named by scale, not purpose. Never used directly in components.</p>
            <div style={{ ...s.code, marginBottom: 0, fontSize: 11 }}>
              {`color.purple.500  = #6366f1
color.purple.400  = #818cf8
color.slate.900   = #0f172a
color.slate.50    = #f8fafc
spacing.4         = 16px   (base × 4)
font.size.14      = 14px`}
            </div>
          </div>
          <div style={{ ...s.card, borderLeft: "4px solid #6366f1" }}>
            <div style={s.label("#6366f1")}>Tier 2 — Semantic tokens</div>
            <p style={{ fontSize: 12, color: "#475569", margin: "4px 0 6px" }}>Reference primitives. Named by <em>purpose</em>. These change between themes.</p>
            <div style={{ ...s.code, marginBottom: 0, fontSize: 11 }}>
              {`color.interactive.default  = {color.purple.500}
color.surface.default      = {color.slate.50}
color.text.default         = {color.slate.900}
color.feedback.error       = {color.red.600}

// In dark theme:
color.interactive.default  = {color.purple.400}
color.surface.default      = {color.slate.900}`}
            </div>
          </div>
          <div style={{ ...s.card, borderLeft: "4px solid #059669" }}>
            <div style={s.label("#059669")}>Tier 3 — Component tokens</div>
            <p style={{ fontSize: 12, color: "#475569", margin: "4px 0 6px" }}>Reference semantic tokens. Scoped to one component. Enables per-component theming.</p>
            <div style={{ ...s.code, marginBottom: 0, fontSize: 11 }}>
              {`button.background.primary  = {color.interactive.default}
button.text.primary        = {color.white}
button.radius              = {radius.md}
card.background            = {color.surface.default}
card.border                = {color.border.default}`}
            </div>
          </div>
        </>
      )}

      {tab === "live preview" && (
        <>
          <div style={s.note}>
            Components consume tokens via <code>useTheme()</code>. Switching theme updates all tokens simultaneously — no prop drilling, no re-export of each color.
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {(["light", "dark", "high-contrast"] as ThemeName[]).map(t => (
              <button key={t} style={s.tab(theme === t)} onClick={() => setTheme(t)}>{t}</button>
            ))}
          </div>
          <div style={{ background: theme === "dark" ? "#1e293b" : "#f1f5f9", padding: 20, borderRadius: 12, marginBottom: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <TokenCard title="Card Component">
                This card reads <code>surface</code>, <code>text</code>, <code>border</code> tokens.
              </TokenCard>
              <TokenCard title="Another Card">
                All colors update when theme switches — zero prop changes.
              </TokenCard>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <TokenButton size="sm">Small</TokenButton>
              <TokenButton size="md">Medium</TokenButton>
              <TokenButton size="lg">Large</TokenButton>
              <TokenButton variant="danger" size="md">Danger</TokenButton>
            </div>
          </div>
          <div style={s.card}>
            <strong style={{ fontSize: 12 }}>Current theme: </strong>
            <code style={{ color: "#6366f1" }}>{theme}</code>
            <div style={{ marginTop: 6, fontSize: 11, color: "#475569" }}>
              primary: <strong>{tokens.color.primary}</strong> &nbsp;|&nbsp;
              surface: <strong>{tokens.color.surface}</strong> &nbsp;|&nbsp;
              text: <strong>{tokens.color.text}</strong>
            </div>
          </div>
        </>
      )}

      {tab === "CSS vars" && (
        <>
          <div style={s.note}>
            CSS custom properties are the most efficient way to theme: a single <code>data-theme</code> attribute swap changes all vars instantly — no JS re-render cascade needed for purely visual changes.
          </div>
          <div style={s.code}>
            {`/* Light theme (default) */
:root {
  --color-primary: #6366f1;
  --color-surface: #ffffff;
  --color-text: #0f172a;
  --spacing-md: 16px;
}

/* Dark theme */
[data-theme="dark"] {
  --color-primary: #818cf8;
  --color-surface: #0f172a;
  --color-text: #f1f5f9;
}

/* Components reference variables — never raw values */
.button-primary {
  background: var(--color-primary);
  padding: var(--spacing-sm) var(--spacing-md);
}

/* Switch theme: just set the attribute */
document.documentElement.setAttribute('data-theme', 'dark');`}
          </div>
          <div style={{ ...s.card, marginBottom: 8 }}>
            <strong style={{ fontSize: 12 }}>Current CSS variable values ({theme} theme)</strong>
            <div style={{ marginTop: 8 }}>
              {Object.entries(cssVars).map(([key, val]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                  <code style={{ minWidth: 180, fontSize: 11, color: "#6366f1" }}>{key}</code>
                  <code style={{ fontSize: 11, color: "#334155" }}>{val}</code>
                  {key.startsWith("--color") && (
                    <span style={{ width: 16, height: 16, borderRadius: 4, background: val, border: "1px solid #e2e8f0", display: "inline-block" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "multi-theme" && (
        <>
          <div style={s.note}>
            Design tokens make supporting multiple themes trivial: define a token map per theme, swap on a single context update.
          </div>
          <div style={s.grid2}>
            {(["light", "dark", "high-contrast"] as ThemeName[]).map(t => (
              <div key={t} style={{ ...s.card, borderTop: `4px solid ${themes[t].color.primary}`, background: themes[t].color.surface, color: themes[t].color.text }}>
                <strong style={{ fontSize: 12 }}>{t}</strong>
                <div style={{ marginTop: 6, fontSize: 11 }}>
                  {Object.entries(themes[t].color).slice(0, 4).map(([k, v]) => (
                    <div key={k} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                      <span style={{ width: 12, height: 12, background: v, borderRadius: 2, border: "1px solid " + themes[t].color.border, display: "inline-block", flexShrink: 0 }} />
                      <code style={{ color: themes[t].color.textMuted, fontSize: 10 }}>{k}: {v}</code>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={s.card}>
            <strong style={{ fontSize: 12 }}>Theming approaches comparison</strong>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
              {[
                { name: "CSS vars + Context", pro: "No re-render cascade, works with any CSS", con: "Requires CSS knowledge, server-render needs care" },
                { name: "CSS-in-JS (styled-components)", pro: "Co-located styles, TypeScript types", con: "Runtime overhead, larger bundle" },
                { name: "Tailwind + CSS vars", pro: "Utility-first, token integration", con: "Long class names, learning curve" },
              ].map(({ name, pro, con }) => (
                <div key={name} style={{ ...s.card, marginBottom: 0 }}>
                  <strong style={{ fontSize: 11 }}>{name}</strong>
                  <div style={{ fontSize: 11, color: "#059669", marginTop: 4 }}>✅ {pro}</div>
                  <div style={{ fontSize: 11, color: "#dc2626", marginTop: 2 }}>⚠ {con}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Main Explainer ───────────────────────────────────────────────────────────

const MAIN_TABS = ["Monorepos", "Component Library", "Theming & Tokens"] as const;
type MainTab = (typeof MAIN_TABS)[number];

export const DesignSystemsExplainer: React.FC = () => {
  const [tab, setTab] = useState<MainTab>("Monorepos");

  return (
    <div style={s.container}>
      <h2 style={s.h2}>Expert — Design Systems</h2>
      <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
        Monorepos (Nx / Turborepo) · Versioned Component Libraries · Theming & Tokens
      </p>
      <div style={s.tabs}>
        {MAIN_TABS.map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "Monorepos" && <><h3 style={s.h3}>Monorepos — Nx / Turborepo</h3><MonorepoDemo /></>}
      {tab === "Component Library" && <><h3 style={s.h3}>Versioned Component Libraries</h3><ComponentLibraryDemo /></>}
      {tab === "Theming & Tokens" && <><h3 style={s.h3}>Theming & Design Tokens</h3><ThemingDemo /></>}
    </div>
  );
};

export default DesignSystemsExplainer;
