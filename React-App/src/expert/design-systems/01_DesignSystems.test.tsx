// TOPIC: Design Systems (Expert)
// LEVEL: Expert — Design Systems
//
// ─── THREE TOPICS ─────────────────────────────────────────────────────────────
//
//   1. Monorepos (Nx / Turborepo)  — workspace structure, task pipelines, caching
//   2. Versioned Component Libraries — semver, changelogs, publishing, tree-shaking
//   3. Theming & Tokens            — design tokens, CSS custom properties, multi-theme
//
// ─── MONOREPOS ────────────────────────────────────────────────────────────────
//
//   A monorepo hosts multiple packages/apps in a single git repository.
//   Benefits: shared tooling, atomic commits across packages, easier refactoring.
//
//   Workspace managers:
//     npm workspaces / yarn workspaces / pnpm workspaces
//     — npm install hoists shared deps to root node_modules
//     — pnpm uses symlinks + content-addressable store (no phantom deps)
//
//   Build orchestrators:
//     Turborepo (Vercel)  — task pipeline via turbo.json, remote caching
//     Nx (Nrwl)          — affected commands, dependency graph, plugins
//
//   Turborepo turbo.json pipeline:
//     {
//       "pipeline": {
//         "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
//         "test":  { "dependsOn": ["build"] },
//         "lint":  {}
//       }
//     }
//   "^build" means: run all dependencies' build tasks before this package's build.
//   Turborepo caches task outputs — unchanged packages are never rebuilt.
//
//   Nx affected:
//     nx affected:test --base=main
//     — only runs tests for packages affected by changes since main branch
//     — derived from dependency graph analysis
//
//   Typical monorepo structure:
//     repo/
//     ├── apps/
//     │   ├── web/           ← Next.js app
//     │   └── docs/          ← Storybook / Docusaurus
//     ├── packages/
//     │   ├── ui/            ← shared component library
//     │   ├── tokens/        ← design tokens
//     │   ├── utils/         ← shared utilities
//     │   └── tsconfig/      ← shared TypeScript configs
//     ├── turbo.json         ← Turborepo pipeline
//     └── package.json       ← workspaces: ["apps/*", "packages/*"]
//
// ─── VERSIONED COMPONENT LIBRARIES ───────────────────────────────────────────
//
//   Semantic Versioning (semver):
//     MAJOR.MINOR.PATCH  →  2.1.3
//     PATCH: bug fix, backward-compatible
//     MINOR: new feature, backward-compatible
//     MAJOR: breaking change
//
//   Pre-release tags:
//     2.0.0-alpha.1    → early unstable
//     2.0.0-beta.3     → feature-complete, testing
//     2.0.0-rc.1       → release candidate
//
//   Changesets workflow (most popular for monorepos):
//     1. Developer runs: npx changeset
//        → selects affected packages, bump level (patch/minor/major), writes summary
//     2. PR includes .changeset/random-id.md file
//     3. On merge to main: changeset version → bumps package.json, updates CHANGELOG.md
//     4. changeset publish → npm publish for each bumped package
//
//   Tree-shaking (dead code elimination):
//   - Bundlers (webpack, rollup, esbuild) remove unused exports
//   - Requires ESM (ES modules) — CommonJS cannot be tree-shaken
//   - package.json: { "type": "module", "exports": { ".": "./dist/index.js" } }
//   - Avoid side-effects in module scope (set "sideEffects": false in package.json)
//   - Named exports tree-shake better than default exports with object spreads
//
//   Peer dependencies:
//   - Component libraries declare React as peerDependency (not dependency)
//   - Consumer's React instance is used — avoids multiple React copies
//   - package.json: { "peerDependencies": { "react": ">=17" } }
//
// ─── THEMING & TOKENS ─────────────────────────────────────────────────────────
//
//   Design tokens are named values representing design decisions — color, spacing,
//   typography, shadow, border-radius. They are the single source of truth shared
//   across design tools (Figma) and code.
//
//   Token categories (W3C Design Tokens spec):
//     color.primary.500     → #6366f1
//     spacing.4             → 16px  (4 × 4px base unit)
//     font.size.md          → 16px
//     font.weight.bold      → 700
//     border.radius.md      → 8px
//     shadow.md             → 0 4px 6px -1px rgb(0 0 0 / 0.1)
//
//   Token tiers:
//     Primitive (global) tokens:  color.purple.500 = #6366f1
//     Semantic tokens:            color.interactive.default = {color.purple.500}
//     Component tokens:           button.background = {color.interactive.default}
//
//   CSS custom properties (variables):
//     :root {
//       --color-primary: #6366f1;
//       --spacing-4: 16px;
//     }
//     .button { background: var(--color-primary); }
//
//   Multi-theme (light/dark/brand):
//     [data-theme="dark"] { --color-primary: #818cf8; }
//     [data-theme="brand-blue"] { --color-primary: #2563eb; }
//
//   React theming patterns:
//     Context + CSS variables:  ThemeProvider sets data-theme on :root,
//                               CSS vars update automatically — no re-render cascade
//     CSS-in-JS (styled-components): theme object passed via ThemeProvider,
//                                    component reads via useTheme()
//     Tailwind CSS:  config.theme.extend.colors wires tokens into utility classes

import React, { useState, useContext, createContext, useCallback, useMemo } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ═══════════════════════════════════════════════════════════════════════════════
// 1. MONOREPO UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

// ── Package dependency graph ──────────────────────────────────────────────────

interface Package {
  name: string;
  version: string;
  dependencies: string[];
}

type PackageGraph = Map<string, Package>;

const buildDependencyGraph = (packages: Package[]): PackageGraph => {
  const graph: PackageGraph = new Map();
  packages.forEach(pkg => graph.set(pkg.name, pkg));
  return graph;
};

// Returns the set of packages affected by a change in `changed`
// (the changed package + anything that (transitively) depends on it)
const getAffectedPackages = (graph: PackageGraph, changed: string[]): Set<string> => {
  const affected = new Set<string>(changed);

  let dirty = true;
  while (dirty) {
    dirty = false;
    for (const [name, pkg] of graph) {
      if (!affected.has(name) && pkg.dependencies.some(dep => affected.has(dep))) {
        affected.add(name);
        dirty = true;
      }
    }
  }

  return affected;
};

// Topological sort for build order (dependencies before dependents)
const getTopologicalOrder = (graph: PackageGraph): string[] => {
  const visited = new Set<string>();
  const order: string[] = [];

  const visit = (name: string) => {
    if (visited.has(name)) return;
    visited.add(name);
    const pkg = graph.get(name);
    if (pkg) pkg.dependencies.forEach(dep => visit(dep));
    order.push(name);
  };

  for (const name of graph.keys()) visit(name);
  return order;
};

// ── Turborepo task pipeline simulation ───────────────────────────────────────

interface TaskResult {
  package: string;
  task: string;
  cached: boolean;
  duration: number;
}

type TaskCache = Map<string, string>; // "pkg:task:inputHash" → "outputHash"

const runPipeline = (
  packages: string[],
  task: string,
  inputHashes: Map<string, string>,
  cache: TaskCache
): TaskResult[] => {
  return packages.map(pkg => {
    const key = `${pkg}:${task}:${inputHashes.get(pkg) ?? ""}`;
    const cached = cache.has(key);
    if (!cached) {
      cache.set(key, `output-${pkg}-${task}`);
    }
    return { package: pkg, task, cached, duration: cached ? 0 : 100 };
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. VERSIONED COMPONENT LIBRARY UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

// ── Semver parsing + comparison ───────────────────────────────────────────────

interface SemVer {
  major: number;
  minor: number;
  patch: number;
  preRelease?: string;
}

const parseSemVer = (version: string): SemVer => {
  const [mainPart, preRelease] = version.split("-");
  const [major, minor, patch] = mainPart.split(".").map(Number);
  return { major, minor, patch, preRelease };
};

type BumpType = "major" | "minor" | "patch";

const bumpVersion = (version: string, bump: BumpType): string => {
  const { major, minor, patch } = parseSemVer(version);
  if (bump === "major") return `${major + 1}.0.0`;
  if (bump === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
};

const isBreakingChange = (from: string, to: string): boolean => {
  return parseSemVer(to).major > parseSemVer(from).major;
};

const isBackwardCompatible = (from: string, to: string): boolean => {
  const f = parseSemVer(from);
  const t = parseSemVer(to);
  return t.major === f.major && (t.minor > f.minor || (t.minor === f.minor && t.patch > f.patch));
};

// ── Changeset simulation ──────────────────────────────────────────────────────

interface Changeset {
  id: string;
  packages: { name: string; bump: BumpType }[];
  summary: string;
}

interface ChangelogEntry {
  version: string;
  date: string;
  added: string[];
  fixed: string[];
  breaking: string[];
}

const applyChangesets = (
  packages: { name: string; version: string }[],
  changesets: Changeset[]
): { name: string; from: string; to: string }[] => {
  const bumps = new Map<string, BumpType>();

  // Accumulate highest bump per package
  for (const cs of changesets) {
    for (const { name, bump } of cs.packages) {
      const current = bumps.get(name);
      const priority: Record<BumpType, number> = { major: 3, minor: 2, patch: 1 };
      if (!current || priority[bump] > priority[current]) {
        bumps.set(name, bump);
      }
    }
  }

  return packages
    .filter(p => bumps.has(p.name))
    .map(p => ({
      name: p.name,
      from: p.version,
      to: bumpVersion(p.version, bumps.get(p.name)!),
    }));
};

// ── Tree-shaking analysis ─────────────────────────────────────────────────────

interface ModuleExport {
  name: string;
  isUsed: boolean;
  sideEffects: boolean;
}

const analyzeTreeShaking = (
  exports: ModuleExport[],
  usedExports: string[]
): { included: string[]; eliminated: string[]; bundleSavings: number } => {
  const usedSet = new Set(usedExports);
  const included: string[] = [];
  const eliminated: string[] = [];

  exports.forEach(exp => {
    if (exp.sideEffects || usedSet.has(exp.name)) {
      included.push(exp.name);
    } else {
      eliminated.push(exp.name);
    }
  });

  const savingsPercent = Math.round((eliminated.length / exports.length) * 100);
  return { included, eliminated, bundleSavings: savingsPercent };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. THEMING & TOKENS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Design token system ───────────────────────────────────────────────────────

type TokenValue = string | number;

interface DesignTokens {
  color: {
    primary: string;
    secondary: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    error: string;
    success: string;
  };
  spacing: {
    xs: number;   // px
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  font: {
    size: { sm: number; md: number; lg: number; xl: number };
    weight: { normal: number; medium: number; bold: number };
    family: string;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
  shadow: {
    sm: string;
    md: string;
    lg: string;
  };
}

const lightTokens: DesignTokens = {
  color: {
    primary: "#6366f1",
    secondary: "#0891b2",
    surface: "#ffffff",
    text: "#0f172a",
    textMuted: "#64748b",
    border: "#e2e8f0",
    error: "#dc2626",
    success: "#059669",
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  font: {
    size: { sm: 12, md: 14, lg: 16, xl: 20 },
    weight: { normal: 400, medium: 500, bold: 700 },
    family: "Inter, system-ui, sans-serif",
  },
  radius: { sm: 4, md: 8, lg: 12, full: 9999 },
  shadow: {
    sm: "0 1px 2px rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
  },
};

const darkTokens: DesignTokens = {
  ...lightTokens,
  color: {
    primary: "#818cf8",
    secondary: "#22d3ee",
    surface: "#0f172a",
    text: "#f1f5f9",
    textMuted: "#94a3b8",
    border: "#1e293b",
    error: "#f87171",
    success: "#34d399",
  },
};

const highContrastTokens: DesignTokens = {
  ...lightTokens,
  color: {
    primary: "#4338ca",
    secondary: "#0369a1",
    surface: "#ffffff",
    text: "#000000",
    textMuted: "#374151",
    border: "#000000",
    error: "#b91c1c",
    success: "#065f46",
  },
};

// ── Theme Context ─────────────────────────────────────────────────────────────

type ThemeName = "light" | "dark" | "high-contrast";

interface ThemeContext {
  theme: ThemeName;
  tokens: DesignTokens;
  setTheme: (t: ThemeName) => void;
}

const ThemeCtx = createContext<ThemeContext>({
  theme: "light",
  tokens: lightTokens,
  setTheme: () => {},
});

const tokensByTheme: Record<ThemeName, DesignTokens> = {
  light: lightTokens,
  dark: darkTokens,
  "high-contrast": highContrastTokens,
};

const ThemeProvider: React.FC<{ children: React.ReactNode; initial?: ThemeName }> = ({
  children,
  initial = "light",
}) => {
  const [theme, setTheme] = useState<ThemeName>(initial);
  const tokens = useMemo(() => tokensByTheme[theme], [theme]);
  return (
    <ThemeCtx.Provider value={{ theme, tokens, setTheme }}>
      <div data-testid="theme-root" data-theme={theme}>
        {children}
      </div>
    </ThemeCtx.Provider>
  );
};

const useTheme = () => useContext(ThemeCtx);

// ── Themed components ─────────────────────────────────────────────────────────

const Button: React.FC<{
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}> = ({ variant = "primary", size = "md", disabled = false, onClick, children }) => {
  const { tokens } = useTheme();

  const bgColor =
    variant === "primary"
      ? tokens.color.primary
      : variant === "secondary"
        ? tokens.color.secondary
        : tokens.color.error;

  const padding = {
    sm: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
    md: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    lg: `${tokens.spacing.md}px ${tokens.spacing.lg}px`,
  }[size];

  const fontSize = tokens.font.size[size];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={`btn-${variant}-${size}`}
      style={{
        background: bgColor,
        color: "#ffffff",
        padding,
        fontSize,
        fontWeight: tokens.font.weight.medium,
        borderRadius: tokens.radius.md,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: tokens.shadow.sm,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
};

const Card: React.FC<{
  title: string;
  children: React.ReactNode;
  elevation?: "sm" | "md" | "lg";
}> = ({ title, children, elevation = "md" }) => {
  const { tokens } = useTheme();

  return (
    <div
      data-testid="card"
      style={{
        background: tokens.color.surface,
        color: tokens.color.text,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.lg,
        padding: tokens.spacing.lg,
        boxShadow: tokens.shadow[elevation],
      }}
    >
      <h3
        style={{
          color: tokens.color.text,
          fontSize: tokens.font.size.lg,
          fontWeight: tokens.font.weight.bold,
          margin: 0,
        }}
        data-testid="card-title"
      >
        {title}
      </h3>
      <div style={{ color: tokens.color.textMuted }}>{children}</div>
    </div>
  );
};

const Badge: React.FC<{
  label: string;
  status?: "default" | "error" | "success";
}> = ({ label, status = "default" }) => {
  const { tokens } = useTheme();

  const color =
    status === "error"
      ? tokens.color.error
      : status === "success"
        ? tokens.color.success
        : tokens.color.primary;

  return (
    <span
      data-testid={`badge-${status}`}
      style={{
        display: "inline-block",
        background: color,
        color: "#fff",
        fontSize: tokens.font.size.sm,
        padding: `${tokens.spacing.xs / 2}px ${tokens.spacing.sm}px`,
        borderRadius: tokens.radius.full,
        fontWeight: tokens.font.weight.medium,
      }}
    >
      {label}
    </span>
  );
};

// ── CSS custom property token serialiser ─────────────────────────────────────

const tokensToCSSVars = (tokens: DesignTokens): Record<string, string> => {
  return {
    "--color-primary": tokens.color.primary,
    "--color-secondary": tokens.color.secondary,
    "--color-surface": tokens.color.surface,
    "--color-text": tokens.color.text,
    "--color-border": tokens.color.border,
    "--color-error": tokens.color.error,
    "--color-success": tokens.color.success,
    "--spacing-xs": `${tokens.spacing.xs}px`,
    "--spacing-sm": `${tokens.spacing.sm}px`,
    "--spacing-md": `${tokens.spacing.md}px`,
    "--spacing-lg": `${tokens.spacing.lg}px`,
    "--font-size-sm": `${tokens.font.size.sm}px`,
    "--font-size-md": `${tokens.font.size.md}px`,
    "--radius-md": `${tokens.radius.md}px`,
    "--radius-full": `${tokens.radius.full}px`,
    "--shadow-sm": tokens.shadow.sm,
    "--shadow-md": tokens.shadow.md,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. MONOREPO TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("1 — Monorepo: dependency graph & task pipeline", () => {
  const packages: Package[] = [
    { name: "tokens", version: "1.0.0", dependencies: [] },
    { name: "utils", version: "1.0.0", dependencies: [] },
    { name: "ui", version: "2.0.0", dependencies: ["tokens", "utils"] },
    { name: "web", version: "1.5.0", dependencies: ["ui"] },
    { name: "docs", version: "1.0.0", dependencies: ["ui"] },
    { name: "api", version: "1.0.0", dependencies: ["utils"] },
  ];

  let graph: PackageGraph;

  beforeEach(() => {
    graph = buildDependencyGraph(packages);
  });

  it("detects packages directly affected by a token change", () => {
    const affected = getAffectedPackages(graph, ["tokens"]);
    expect(affected.has("tokens")).toBe(true);
    expect(affected.has("ui")).toBe(true);     // depends on tokens
    expect(affected.has("web")).toBe(true);    // depends on ui
    expect(affected.has("docs")).toBe(true);   // depends on ui
    expect(affected.has("api")).toBe(false);   // no tokens dependency
    expect(affected.has("utils")).toBe(false); // no tokens dependency
  });

  it("detects packages affected by a utils change", () => {
    const affected = getAffectedPackages(graph, ["utils"]);
    expect(affected.has("utils")).toBe(true);
    expect(affected.has("ui")).toBe(true);    // depends on utils
    expect(affected.has("api")).toBe(true);   // depends on utils
    expect(affected.has("web")).toBe(true);   // depends on ui
  });

  it("a change to a leaf package only affects itself", () => {
    const affected = getAffectedPackages(graph, ["api"]);
    expect(affected.has("api")).toBe(true);
    expect(affected.size).toBe(1);            // nothing depends on api
  });

  it("topological order puts dependencies before dependents", () => {
    const order = getTopologicalOrder(graph);

    const idx = (name: string) => order.indexOf(name);

    // tokens and utils must come before ui
    expect(idx("tokens")).toBeLessThan(idx("ui"));
    expect(idx("utils")).toBeLessThan(idx("ui"));

    // ui must come before web and docs
    expect(idx("ui")).toBeLessThan(idx("web"));
    expect(idx("ui")).toBeLessThan(idx("docs"));
  });

  it("Turborepo: cached tasks are skipped (zero duration)", () => {
    const cache: TaskCache = new Map();
    const hashes = new Map([["tokens", "abc"], ["utils", "def"]]);

    // First run — nothing cached
    const first = runPipeline(["tokens", "utils"], "build", hashes, cache);
    expect(first.every(r => !r.cached)).toBe(true);

    // Second run — same hashes → all cached
    const second = runPipeline(["tokens", "utils"], "build", hashes, cache);
    expect(second.every(r => r.cached)).toBe(true);
    expect(second.every(r => r.duration === 0)).toBe(true);
  });

  it("Turborepo: changed hash invalidates cache for that package only", () => {
    const cache: TaskCache = new Map();
    const hashes = new Map([["tokens", "hash1"], ["utils", "hash2"]]);

    // Warm the cache
    runPipeline(["tokens", "utils"], "build", hashes, cache);

    // tokens changed
    const newHashes = new Map([["tokens", "hash1-changed"], ["utils", "hash2"]]);
    const third = runPipeline(["tokens", "utils"], "build", newHashes, cache);

    const tokensResult = third.find(r => r.package === "tokens")!;
    const utilsResult = third.find(r => r.package === "utils")!;

    expect(tokensResult.cached).toBe(false); // hash changed → cache miss
    expect(utilsResult.cached).toBe(true);   // unchanged → cache hit
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. VERSIONED COMPONENT LIBRARY TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("2 — Versioned component library: semver & changesets", () => {
  it("parses semver correctly", () => {
    const v = parseSemVer("2.3.1");
    expect(v).toEqual({ major: 2, minor: 3, patch: 1, preRelease: undefined });
  });

  it("parses semver with pre-release tag", () => {
    const v = parseSemVer("3.0.0-beta.2");
    expect(v.major).toBe(3);
    expect(v.preRelease).toBe("beta.2");
  });

  it("bumps patch version", () => {
    expect(bumpVersion("1.2.3", "patch")).toBe("1.2.4");
  });

  it("bumps minor version and resets patch", () => {
    expect(bumpVersion("1.2.3", "minor")).toBe("1.3.0");
  });

  it("bumps major version and resets minor + patch", () => {
    expect(bumpVersion("1.2.3", "major")).toBe("2.0.0");
  });

  it("detects breaking changes (major bump)", () => {
    expect(isBreakingChange("1.5.0", "2.0.0")).toBe(true);
    expect(isBreakingChange("1.5.0", "1.6.0")).toBe(false);
    expect(isBreakingChange("1.5.0", "1.5.1")).toBe(false);
  });

  it("detects backward-compatible changes (minor or patch bump)", () => {
    expect(isBackwardCompatible("1.5.0", "1.6.0")).toBe(true);
    expect(isBackwardCompatible("1.5.0", "1.5.1")).toBe(true);
    expect(isBackwardCompatible("1.5.0", "2.0.0")).toBe(false);
  });

  it("changeset applies highest bump when multiple changesets touch same package", () => {
    const pkgs = [
      { name: "@acme/ui", version: "1.0.0" },
      { name: "@acme/utils", version: "2.1.0" },
    ];

    const changesets: Changeset[] = [
      {
        id: "cs-1",
        packages: [{ name: "@acme/ui", bump: "patch" }],
        summary: "Fix button hover state",
      },
      {
        id: "cs-2",
        packages: [
          { name: "@acme/ui", bump: "minor" },     // minor > patch → wins
          { name: "@acme/utils", bump: "major" },
        ],
        summary: "Add Icon component, refactor utils API",
      },
    ];

    const bumped = applyChangesets(pkgs, changesets);

    const ui = bumped.find(b => b.name === "@acme/ui")!;
    expect(ui.from).toBe("1.0.0");
    expect(ui.to).toBe("1.1.0"); // minor wins over patch

    const utils = bumped.find(b => b.name === "@acme/utils")!;
    expect(utils.from).toBe("2.1.0");
    expect(utils.to).toBe("3.0.0"); // major bump
  });

  it("changeset only bumps packages listed in changesets", () => {
    const pkgs = [
      { name: "@acme/ui", version: "1.0.0" },
      { name: "@acme/tokens", version: "1.0.0" },
    ];

    const changesets: Changeset[] = [
      {
        id: "cs-1",
        packages: [{ name: "@acme/ui", bump: "patch" }],
        summary: "Fix",
      },
    ];

    const bumped = applyChangesets(pkgs, changesets);
    expect(bumped.map(b => b.name)).toEqual(["@acme/ui"]);
    expect(bumped.find(b => b.name === "@acme/tokens")).toBeUndefined();
  });

  it("tree-shaking eliminates unused exports without side effects", () => {
    const exports: ModuleExport[] = [
      { name: "Button", isUsed: true, sideEffects: false },
      { name: "Modal", isUsed: false, sideEffects: false },
      { name: "Input", isUsed: true, sideEffects: false },
      { name: "DataGrid", isUsed: false, sideEffects: false },
      { name: "globalStyles", isUsed: false, sideEffects: true }, // side effect — must keep
    ];

    const result = analyzeTreeShaking(exports, ["Button", "Input"]);

    expect(result.included).toContain("Button");
    expect(result.included).toContain("Input");
    expect(result.included).toContain("globalStyles"); // kept: side effects
    expect(result.eliminated).toContain("Modal");
    expect(result.eliminated).toContain("DataGrid");
    expect(result.bundleSavings).toBe(40); // 2 of 5 eliminated = 40%
  });

  it("tree-shaking includes everything if all exports have side effects", () => {
    const exports: ModuleExport[] = [
      { name: "A", isUsed: false, sideEffects: true },
      { name: "B", isUsed: false, sideEffects: true },
    ];

    const result = analyzeTreeShaking(exports, []);
    expect(result.eliminated).toHaveLength(0);
    expect(result.bundleSavings).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. THEMING & TOKENS TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("3 — Theming & design tokens", () => {
  it("ThemeProvider sets data-theme attribute on root element", () => {
    render(
      <ThemeProvider initial="dark">
        <div>content</div>
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme-root")).toHaveAttribute("data-theme", "dark");
  });

  it("useTheme provides correct token values for light theme", () => {
    let capturedTokens: DesignTokens | null = null;

    const TokenInspector: React.FC = () => {
      const { tokens } = useTheme();
      capturedTokens = tokens;
      return null;
    };

    render(
      <ThemeProvider initial="light">
        <TokenInspector />
      </ThemeProvider>
    );

    expect(capturedTokens!.color.primary).toBe("#6366f1");
    expect(capturedTokens!.color.surface).toBe("#ffffff");
    expect(capturedTokens!.color.text).toBe("#0f172a");
  });

  it("switching to dark theme updates token values", async () => {
    const user = userEvent.setup();

    const ThemeSwitcher: React.FC = () => {
      const { theme, tokens, setTheme } = useTheme();
      return (
        <div>
          <span data-testid="surface">{tokens.color.surface}</span>
          <span data-testid="current-theme">{theme}</span>
          <button onClick={() => setTheme("dark")}>Dark</button>
          <button onClick={() => setTheme("light")}>Light</button>
        </div>
      );
    };

    render(
      <ThemeProvider initial="light">
        <ThemeSwitcher />
      </ThemeProvider>
    );

    expect(screen.getByTestId("surface")).toHaveTextContent("#ffffff");
    expect(screen.getByTestId("current-theme")).toHaveTextContent("light");

    await user.click(screen.getByRole("button", { name: "Dark" }));

    expect(screen.getByTestId("surface")).toHaveTextContent("#0f172a");
    expect(screen.getByTestId("current-theme")).toHaveTextContent("dark");
    expect(screen.getByTestId("theme-root")).toHaveAttribute("data-theme", "dark");

    await user.click(screen.getByRole("button", { name: "Light" }));
    expect(screen.getByTestId("surface")).toHaveTextContent("#ffffff");
  });

  it("high-contrast theme provides accessible color values", () => {
    let capturedTokens: DesignTokens | null = null;

    const Inspector: React.FC = () => {
      const { tokens } = useTheme();
      capturedTokens = tokens;
      return null;
    };

    render(
      <ThemeProvider initial="high-contrast">
        <Inspector />
      </ThemeProvider>
    );

    expect(capturedTokens!.color.text).toBe("#000000");
    expect(capturedTokens!.color.surface).toBe("#ffffff");
    expect(capturedTokens!.color.border).toBe("#000000");
  });

  it("Button uses primary token color by default", () => {
    render(
      <ThemeProvider initial="light">
        <Button>Click me</Button>
      </ThemeProvider>
    );

    const btn = screen.getByTestId("btn-primary-md");
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveStyle({ background: lightTokens.color.primary });
  });

  it("Button danger variant uses error token color", () => {
    render(
      <ThemeProvider initial="light">
        <Button variant="danger">Delete</Button>
      </ThemeProvider>
    );

    expect(screen.getByTestId("btn-danger-md")).toHaveStyle({
      background: lightTokens.color.error,
    });
  });

  it("Button reflects dark theme primary color after theme switch", async () => {
    const user = userEvent.setup();

    const App: React.FC = () => {
      const { setTheme } = useTheme();
      return (
        <>
          <Button>Primary</Button>
          <button onClick={() => setTheme("dark")} data-testid="toggle">Toggle dark</button>
        </>
      );
    };

    render(
      <ThemeProvider initial="light">
        <App />
      </ThemeProvider>
    );

    expect(screen.getByTestId("btn-primary-md")).toHaveStyle({
      background: lightTokens.color.primary,
    });

    await user.click(screen.getByTestId("toggle"));

    expect(screen.getByTestId("btn-primary-md")).toHaveStyle({
      background: darkTokens.color.primary,
    });
  });

  it("Card uses surface and border tokens from current theme", () => {
    render(
      <ThemeProvider initial="light">
        <Card title="Hello">Body text</Card>
      </ThemeProvider>
    );

    const card = screen.getByTestId("card");
    expect(card).toHaveStyle({ background: lightTokens.color.surface });
    expect(screen.getByTestId("card-title")).toHaveTextContent("Hello");
  });

  it("Badge success uses success token color", () => {
    render(
      <ThemeProvider initial="light">
        <Badge label="Active" status="success" />
      </ThemeProvider>
    );

    expect(screen.getByTestId("badge-success")).toHaveStyle({
      background: lightTokens.color.success,
    });
  });

  it("tokensToCSSVars generates correct CSS variable names and values", () => {
    const vars = tokensToCSSVars(lightTokens);

    expect(vars["--color-primary"]).toBe("#6366f1");
    expect(vars["--color-surface"]).toBe("#ffffff");
    expect(vars["--spacing-md"]).toBe("16px");
    expect(vars["--radius-md"]).toBe("8px");
    expect(vars["--font-size-sm"]).toBe("12px");
  });

  it("dark theme CSS vars differ from light theme CSS vars", () => {
    const lightVars = tokensToCSSVars(lightTokens);
    const darkVars = tokensToCSSVars(darkTokens);

    expect(darkVars["--color-primary"]).not.toBe(lightVars["--color-primary"]);
    expect(darkVars["--color-surface"]).not.toBe(lightVars["--color-surface"]);
    expect(darkVars["--color-text"]).not.toBe(lightVars["--color-text"]);

    // Spacing and radius are theme-independent
    expect(darkVars["--spacing-md"]).toBe(lightVars["--spacing-md"]);
    expect(darkVars["--radius-md"]).toBe(lightVars["--radius-md"]);
  });

  it("semantic tokens follow primitive → semantic → component tier pattern", () => {
    // Primitive token
    const primitive = "#6366f1";
    // Semantic token references primitive
    const semantic = lightTokens.color.primary;
    // Component uses semantic
    const buttonBg = lightTokens.color.primary;

    expect(semantic).toBe(primitive);
    expect(buttonBg).toBe(semantic);
  });
});
