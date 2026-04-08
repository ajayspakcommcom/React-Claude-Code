// TOPIC: Frontend System Design (Expert)
// LEVEL: Expert — Frontend System Design
//
// ─── THREE TOPICS ─────────────────────────────────────────────────────────────
//
//   1. Micro-frontends (Module Federation)
//   2. CI/CD for frontend
//   3. Feature flags
//
// ─── MICRO-FRONTENDS ──────────────────────────────────────────────────────────
//
//   Micro-frontends extend micro-service thinking to the browser.
//   Each team owns a vertical slice: UI + API + DB — independently deployable.
//
//   Integration approaches:
//     Build-time:   npm package — simple but defeats independent deployment
//     Run-time:     iframes, Web Components, Module Federation — true independence
//
//   Module Federation (Webpack 5 / Rspack):
//   Each app (host or remote) exposes/consumes modules at runtime from a CDN URL.
//
//   Remote (provider) webpack.config:
//     new ModuleFederationPlugin({
//       name: 'checkout',
//       filename: 'remoteEntry.js',
//       exposes: { './CheckoutWidget': './src/CheckoutWidget' },
//       shared: { react: { singleton: true, requiredVersion: '^18' } }
//     })
//
//   Host (consumer) webpack.config:
//     new ModuleFederationPlugin({
//       name: 'shell',
//       remotes: { checkout: 'checkout@https://cdn.example.com/checkout/remoteEntry.js' },
//       shared: { react: { singleton: true } }
//     })
//
//   Shell then uses:
//     const CheckoutWidget = React.lazy(() => import('checkout/CheckoutWidget'));
//
//   Key properties:
//   - Shared singletons: React, ReactDOM shared across remotes — no duplicate copies
//   - Lazy loading: remote code fetched only when needed
//   - Version negotiation: host and remote negotiate shared dep versions at runtime
//   - Independent deployment: remote team deploys without redeploying shell
//
//   Challenges:
//   - Shared state: no shared Redux store — use URL, events, or a shared lib
//   - Styling isolation: CSS leakage between remotes → CSS Modules, Shadow DOM
//   - Testing: integration tests needed for cross-remote interactions
//   - Version mismatches: shared lib version conflicts at runtime
//
// ─── CI/CD FOR FRONTEND ───────────────────────────────────────────────────────
//
//   CI (Continuous Integration):
//   - Every push runs: lint → type-check → unit tests → build
//   - PR must pass all checks before merge
//   - Fail fast: lint before tests (cheap before expensive)
//
//   CD (Continuous Deployment/Delivery):
//   - On merge to main: build → deploy to staging → run E2E → promote to production
//   - Preview deployments: every PR gets its own URL (Vercel, Netlify)
//
//   GitHub Actions pipeline structure:
//     name: CI
//     on: [push, pull_request]
//     jobs:
//       lint:        runs-on: ubuntu-latest; steps: checkout, setup-node, npm ci, lint
//       type-check:  needs: lint
//       test:        needs: lint; runs: jest --coverage
//       build:       needs: [type-check, test]
//       deploy:      needs: build; if: github.ref == 'refs/heads/main'
//
//   Key CI/CD concepts:
//   - Matrix builds: run tests across multiple Node versions / browsers
//   - Caching: cache node_modules by package-lock.json hash
//   - Artifacts: upload build output for downstream jobs (no rebuild)
//   - Environment secrets: VERCEL_TOKEN, SENTRY_DSN — never commit
//   - Branch protection: require CI pass + N approvals before merge to main
//
//   Frontend-specific checks:
//   - Bundle size guard: fail if bundle grows beyond threshold (bundlewatch)
//   - Lighthouse CI: fail if performance score drops below 90
//   - Visual regression: Percy / Chromatic — screenshot comparison on PR
//   - Accessibility: axe-core automated checks in CI
//
// ─── FEATURE FLAGS ────────────────────────────────────────────────────────────
//
//   Feature flags (feature toggles) decouple deployment from release.
//   Code ships disabled → enabled for specific users/cohorts without re-deploy.
//
//   Flag types:
//     Release flag:     hide unfinished feature, enable when ready
//     Experiment flag:  A/B test, measure impact before rollout
//     Ops flag:         kill switch for misbehaving code path
//     Permission flag:  premium features for paying users
//
//   Targeting rules (evaluated in order):
//     1. User ID allowlist          → show to internal team first
//     2. Percentage rollout         → 5% → 20% → 50% → 100%
//     3. Attribute rule             → plan === 'pro' || country === 'US'
//     4. Default (fallback)         → off
//
//   Flag evaluation:
//   - Client-side: SDK fetches flag config, evaluates in browser
//   - Server-side: evaluate at SSR/edge, pass result as prop — no flicker
//
//   Flag lifecycle (release flag):
//     1. Create flag (defaultValue: false)
//     2. Enable for internal users
//     3. Percentage rollout (5% → 100%)
//     4. Remove flag + old code path (technical debt cleanup)
//
//   Popular providers: LaunchDarkly, GrowthBook, Unleash (OSS), Flagsmith (OSS)

import React, { useState, useEffect, useCallback, Suspense, lazy } from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ═══════════════════════════════════════════════════════════════════════════════
// 1. MICRO-FRONTEND UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

// ── Module Federation registry simulation ────────────────────────────────────

interface RemoteConfig {
  name: string;
  url: string;
  exposes: Record<string, string>; // exposedName → moduleId
  version: string;
}

interface SharedDep {
  name: string;
  version: string;
  singleton: boolean;
}

class ModuleFederationRegistry {
  private remotes = new Map<string, RemoteConfig>();
  private sharedDeps = new Map<string, SharedDep>();
  private loadedModules = new Map<string, unknown>();

  registerRemote(config: RemoteConfig): void {
    this.remotes.set(config.name, config);
  }

  registerShared(dep: SharedDep): void {
    this.sharedDeps.set(dep.name, dep);
  }

  // Simulate loading a remote module (React.lazy-compatible promise)
  async loadModule<T>(remoteName: string, exposedName: string): Promise<T> {
    const remote = this.remotes.get(remoteName);
    if (!remote) throw new Error(`Remote "${remoteName}" not registered`);

    const exposed = remote.exposes[exposedName];
    if (!exposed) throw new Error(`"${exposedName}" not exposed by "${remoteName}"`);

    const cacheKey = `${remoteName}/${exposedName}`;
    if (this.loadedModules.has(cacheKey)) {
      return this.loadedModules.get(cacheKey) as T;
    }

    // Simulate async fetch of remote module
    await new Promise(r => setTimeout(r, 10));
    const module = { default: () => <div data-testid={`remote-${remoteName}`}>{remoteName} loaded</div> };
    this.loadedModules.set(cacheKey, module);
    return module as T;
  }

  resolveShared(name: string, requiredVersion: string): { version: string; conflict: boolean } {
    const dep = this.sharedDeps.get(name);
    if (!dep) return { version: requiredVersion, conflict: false };

    // Simplified: conflict if major versions differ
    const [reqMajor] = requiredVersion.replace("^", "").split(".").map(Number);
    const [regMajor] = dep.version.split(".").map(Number);
    return {
      version: dep.version,
      conflict: reqMajor !== regMajor,
    };
  }

  hasRemote(name: string): boolean {
    return this.remotes.has(name);
  }

  getRemote(name: string): RemoteConfig | undefined {
    return this.remotes.get(name);
  }
}

// ── Event bus (cross-micro-frontend communication) ────────────────────────────

type EventHandler<T = unknown> = (payload: T) => void;

class MicroFrontendEventBus {
  private listeners = new Map<string, Set<EventHandler>>();

  on<T>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as EventHandler);
    return () => this.listeners.get(event)?.delete(handler as EventHandler);
  }

  emit<T>(event: string, payload: T): void {
    this.listeners.get(event)?.forEach(h => h(payload));
  }

  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

// ── Shell app with remote loading ─────────────────────────────────────────────

const ShellApp: React.FC<{
  registry: ModuleFederationRegistry;
  remoteName: string;
}> = ({ registry, remoteName }) => {
  const RemoteComponent = lazy(() =>
    registry.loadModule<{ default: React.FC }>(remoteName, "./Widget")
  );

  return (
    <div data-testid="shell">
      <header data-testid="shell-header">Shell App</header>
      <main>
        <Suspense fallback={<div data-testid="remote-loading">Loading remote…</div>}>
          <RemoteComponent />
        </Suspense>
      </main>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. CI/CD PIPELINE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

// ── Pipeline stage model ──────────────────────────────────────────────────────

type StageStatus = "pending" | "running" | "passed" | "failed" | "skipped";

interface PipelineStage {
  name: string;
  needs: string[];          // must pass before this stage runs
  status: StageStatus;
  durationMs?: number;
  failFast?: boolean;       // if true, failure cancels downstream stages
}

class CIPipeline {
  private stages: Map<string, PipelineStage>;
  private results: Map<string, StageStatus> = new Map();

  constructor(stages: PipelineStage[]) {
    this.stages = new Map(stages.map(s => [s.name, s]));
    stages.forEach(s => this.results.set(s.name, "pending"));
  }

  private canRun(stageName: string): boolean {
    const stage = this.stages.get(stageName)!;
    return stage.needs.every(dep => this.results.get(dep) === "passed");
  }

  private isBlocked(stageName: string): boolean {
    const stage = this.stages.get(stageName)!;
    return stage.needs.some(dep => this.results.get(dep) === "failed");
  }

  async run(): Promise<Map<string, StageStatus>> {
    const stageNames = Array.from(this.stages.keys());

    // Simple sequential simulation (real pipelines run deps in parallel)
    for (const name of stageNames) {
      const stage = this.stages.get(name)!;

      if (this.isBlocked(name)) {
        this.results.set(name, "skipped");
        continue;
      }

      if (!this.canRun(name)) {
        this.results.set(name, "skipped");
        continue;
      }

      this.results.set(name, "running");
      // Simulate stage execution
      if (stage.status === "failed") {
        this.results.set(name, "failed");
      } else {
        this.results.set(name, "passed");
      }
    }

    return this.results;
  }

  getResult(stageName: string): StageStatus {
    return this.results.get(stageName) ?? "pending";
  }
}

// ── Bundle size guard ─────────────────────────────────────────────────────────

interface BundleReport {
  name: string;
  sizeBytes: number;
  gzippedBytes: number;
}

interface BundleSizeConfig {
  maxSizeBytes: number;
  maxGzippedBytes: number;
  warnThresholdPercent: number; // warn if within N% of limit
}

type BundleCheckResult = "pass" | "warn" | "fail";

const checkBundleSize = (
  report: BundleReport,
  config: BundleSizeConfig
): { result: BundleCheckResult; message: string } => {
  const gzipRatio = report.gzippedBytes / config.maxGzippedBytes;
  const rawRatio = report.sizeBytes / config.maxSizeBytes;

  if (report.gzippedBytes > config.maxGzippedBytes || report.sizeBytes > config.maxSizeBytes) {
    return {
      result: "fail",
      message: `Bundle too large: ${report.gzippedBytes}B gzip (limit: ${config.maxGzippedBytes}B)`,
    };
  }

  const warnThreshold = 1 - config.warnThresholdPercent / 100;
  if (gzipRatio > warnThreshold || rawRatio > warnThreshold) {
    return {
      result: "warn",
      message: `Bundle approaching limit: ${Math.round(gzipRatio * 100)}% of gzip budget used`,
    };
  }

  return { result: "pass", message: "Bundle size within limits" };
};

// ── Preview deployment model ──────────────────────────────────────────────────

interface PullRequest {
  id: number;
  branch: string;
  sha: string;
  author: string;
}

interface PreviewDeployment {
  prId: number;
  url: string;
  sha: string;
  status: "building" | "ready" | "failed";
}

const generatePreviewUrl = (pr: PullRequest, baseUrl: string): string => {
  const branch = pr.branch.replace(/[^a-z0-9]/gi, "-").toLowerCase();
  return `https://${branch}-${pr.id}.${baseUrl}`;
};

// ── Lighthouse score check ────────────────────────────────────────────────────

interface LighthouseReport {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

interface LighthouseThresholds {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

const checkLighthouse = (
  report: LighthouseReport,
  thresholds: LighthouseThresholds
): { passed: boolean; failures: string[] } => {
  const failures: string[] = [];
  (Object.keys(thresholds) as (keyof LighthouseThresholds)[]).forEach(key => {
    if (report[key] < thresholds[key]) {
      failures.push(`${key}: ${report[key]} < ${thresholds[key]}`);
    }
  });
  return { passed: failures.length === 0, failures };
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. FEATURE FLAGS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Flag engine ───────────────────────────────────────────────────────────────

interface UserContext {
  id: string;
  plan?: "free" | "pro" | "enterprise";
  country?: string;
  email?: string;
  percentileBucket?: number; // 0–99 for percentage rollout
}

type FlagRule =
  | { type: "allowlist"; userIds: string[] }
  | { type: "percentage"; percent: number }     // 0–100
  | { type: "attribute"; key: keyof UserContext; operator: "eq" | "in"; value: string | string[] };

interface FeatureFlag {
  key: string;
  defaultValue: boolean;
  rules: FlagRule[];
  enabled: boolean; // master kill switch
}

const evaluateFlag = (flag: FeatureFlag, user: UserContext): boolean => {
  if (!flag.enabled) return flag.defaultValue;

  for (const rule of flag.rules) {
    if (rule.type === "allowlist") {
      if (rule.userIds.includes(user.id)) return true;
    } else if (rule.type === "percentage") {
      const bucket = user.percentileBucket ?? 50;
      if (bucket < rule.percent) return true;
    } else if (rule.type === "attribute") {
      const userVal = user[rule.key];
      if (rule.operator === "eq" && userVal === rule.value) return true;
      if (rule.operator === "in" && Array.isArray(rule.value) && typeof userVal === "string") {
        if (rule.value.includes(userVal)) return true;
      }
    }
  }

  return flag.defaultValue;
};

// ── Flag store + React hook ───────────────────────────────────────────────────

class FeatureFlagStore {
  private flags = new Map<string, FeatureFlag>();
  private user: UserContext = { id: "anonymous" };

  setUser(user: UserContext): void {
    this.user = user;
  }

  addFlag(flag: FeatureFlag): void {
    this.flags.set(flag.key, flag);
  }

  isEnabled(key: string): boolean {
    const flag = this.flags.get(key);
    if (!flag) return false;
    return evaluateFlag(flag, this.user);
  }

  getAllFlags(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const [key] of this.flags) {
      result[key] = this.isEnabled(key);
    }
    return result;
  }
}

// Simple hook for consuming flags in components
const useFlag = (store: FeatureFlagStore, key: string): boolean => {
  return store.isEnabled(key);
};

// ── Components gated by flags ─────────────────────────────────────────────────

const FeatureGate: React.FC<{
  store: FeatureFlagStore;
  flag: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ store, flag, children, fallback = null }) => {
  const enabled = useFlag(store, flag);
  return enabled ? <>{children}</> : <>{fallback}</>;
};

const NewDashboard: React.FC = () => (
  <div data-testid="new-dashboard">New Dashboard v2</div>
);

const OldDashboard: React.FC = () => (
  <div data-testid="old-dashboard">Dashboard v1</div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// 1. MICRO-FRONTEND TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("1 — Micro-frontends (Module Federation)", () => {
  let registry: ModuleFederationRegistry;

  beforeEach(() => {
    registry = new ModuleFederationRegistry();
  });

  it("registers and retrieves a remote config", () => {
    registry.registerRemote({
      name: "checkout",
      url: "https://cdn.example.com/checkout/remoteEntry.js",
      exposes: { "./Widget": "./src/CheckoutWidget" },
      version: "1.2.0",
    });

    expect(registry.hasRemote("checkout")).toBe(true);
    expect(registry.getRemote("checkout")?.url).toContain("checkout/remoteEntry.js");
  });

  it("loading an unregistered remote throws a descriptive error", async () => {
    await expect(registry.loadModule("unknown-remote", "./Widget")).rejects.toThrow(
      'Remote "unknown-remote" not registered'
    );
  });

  it("loading a module not in exposes throws a descriptive error", async () => {
    registry.registerRemote({
      name: "auth",
      url: "https://cdn.example.com/auth/remoteEntry.js",
      exposes: { "./LoginForm": "./src/LoginForm" },
      version: "1.0.0",
    });

    await expect(registry.loadModule("auth", "./NotExposed")).rejects.toThrow(
      '"./NotExposed" not exposed by "auth"'
    );
  });

  it("loads a remote module and caches the result", async () => {
    registry.registerRemote({
      name: "cart",
      url: "https://cdn.example.com/cart/remoteEntry.js",
      exposes: { "./Widget": "./src/CartWidget" },
      version: "2.0.0",
    });

    const mod1 = await registry.loadModule("cart", "./Widget");
    const mod2 = await registry.loadModule("cart", "./Widget");

    expect(mod1).toBe(mod2); // same reference — cached
  });

  it("shared singleton React has no version conflict when majors match", () => {
    registry.registerShared({ name: "react", version: "18.3.1", singleton: true });
    const result = registry.resolveShared("react", "^18");
    expect(result.conflict).toBe(false);
    expect(result.version).toBe("18.3.1");
  });

  it("shared singleton React has version conflict when majors differ", () => {
    registry.registerShared({ name: "react", version: "17.0.2", singleton: true });
    const result = registry.resolveShared("react", "^18");
    expect(result.conflict).toBe(true);
  });

  it("shell renders remote component via Suspense after load", async () => {
    registry.registerRemote({
      name: "checkout",
      url: "https://cdn.example.com/checkout/remoteEntry.js",
      exposes: { "./Widget": "./src/CheckoutWidget" },
      version: "1.0.0",
    });

    render(<ShellApp registry={registry} remoteName="checkout" />);

    // Shell header always present
    expect(screen.getByTestId("shell-header")).toBeInTheDocument();
    // Loading state shown while remote fetches
    expect(screen.getByTestId("remote-loading")).toBeInTheDocument();

    // Remote component renders after load
    expect(await screen.findByTestId("remote-checkout")).toBeInTheDocument();
    expect(screen.queryByTestId("remote-loading")).not.toBeInTheDocument();
  });

  it("event bus: subscribers receive emitted events", () => {
    const bus = new MicroFrontendEventBus();
    const handler = jest.fn();

    bus.on("cart:updated", handler);
    bus.emit("cart:updated", { itemCount: 3 });

    expect(handler).toHaveBeenCalledWith({ itemCount: 3 });
  });

  it("event bus: unsubscribe stops receiving events", () => {
    const bus = new MicroFrontendEventBus();
    const handler = jest.fn();

    const unsubscribe = bus.on("user:logout", handler);
    bus.emit("user:logout", {});
    expect(handler).toHaveBeenCalledTimes(1);

    unsubscribe();
    bus.emit("user:logout", {});
    expect(handler).toHaveBeenCalledTimes(1); // not called again
  });

  it("event bus: multiple subscribers each receive the event", () => {
    const bus = new MicroFrontendEventBus();
    const h1 = jest.fn();
    const h2 = jest.fn();

    bus.on("nav:changed", h1);
    bus.on("nav:changed", h2);
    bus.emit("nav:changed", { path: "/dashboard" });

    expect(h1).toHaveBeenCalledWith({ path: "/dashboard" });
    expect(h2).toHaveBeenCalledWith({ path: "/dashboard" });
    expect(bus.listenerCount("nav:changed")).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. CI/CD TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("2 — CI/CD pipeline", () => {
  it("all stages pass in a healthy pipeline", async () => {
    const pipeline = new CIPipeline([
      { name: "lint", needs: [], status: "passed" },
      { name: "type-check", needs: ["lint"], status: "passed" },
      { name: "test", needs: ["lint"], status: "passed" },
      { name: "build", needs: ["type-check", "test"], status: "passed" },
      { name: "deploy", needs: ["build"], status: "passed" },
    ]);

    const results = await pipeline.run();

    expect(results.get("lint")).toBe("passed");
    expect(results.get("type-check")).toBe("passed");
    expect(results.get("test")).toBe("passed");
    expect(results.get("build")).toBe("passed");
    expect(results.get("deploy")).toBe("passed");
  });

  it("downstream stages are skipped when an upstream stage fails", async () => {
    const pipeline = new CIPipeline([
      { name: "lint", needs: [], status: "passed" },
      { name: "test", needs: ["lint"], status: "failed" },  // tests fail
      { name: "build", needs: ["test"], status: "passed" }, // should be skipped
      { name: "deploy", needs: ["build"], status: "passed" }, // should be skipped
    ]);

    const results = await pipeline.run();

    expect(results.get("lint")).toBe("passed");
    expect(results.get("test")).toBe("failed");
    expect(results.get("build")).toBe("skipped");
    expect(results.get("deploy")).toBe("skipped");
  });

  it("independent stages are not blocked by unrelated failures", async () => {
    const pipeline = new CIPipeline([
      { name: "lint", needs: [], status: "passed" },
      { name: "type-check", needs: ["lint"], status: "failed" }, // type errors
      { name: "test", needs: ["lint"], status: "passed" },       // independent of type-check
      { name: "build", needs: ["type-check", "test"], status: "passed" }, // blocked by type-check
    ]);

    const results = await pipeline.run();

    expect(results.get("lint")).toBe("passed");
    expect(results.get("type-check")).toBe("failed");
    expect(results.get("test")).toBe("passed");  // ran independently
    expect(results.get("build")).toBe("skipped"); // blocked — needs type-check
  });

  it("bundle size check passes within limits", () => {
    const report: BundleReport = { name: "main", sizeBytes: 200_000, gzippedBytes: 60_000 };
    const config: BundleSizeConfig = { maxSizeBytes: 500_000, maxGzippedBytes: 150_000, warnThresholdPercent: 10 };

    const result = checkBundleSize(report, config);
    expect(result.result).toBe("pass");
  });

  it("bundle size check fails when over gzip limit", () => {
    const report: BundleReport = { name: "main", sizeBytes: 200_000, gzippedBytes: 160_000 };
    const config: BundleSizeConfig = { maxSizeBytes: 500_000, maxGzippedBytes: 150_000, warnThresholdPercent: 10 };

    const result = checkBundleSize(report, config);
    expect(result.result).toBe("fail");
    expect(result.message).toContain("160000");
  });

  it("bundle size check warns when approaching limit", () => {
    const report: BundleReport = { name: "main", sizeBytes: 200_000, gzippedBytes: 140_000 };
    const config: BundleSizeConfig = { maxSizeBytes: 500_000, maxGzippedBytes: 150_000, warnThresholdPercent: 10 };
    // 140_000 / 150_000 = 93.3% > 90% (100 - warnThreshold)

    const result = checkBundleSize(report, config);
    expect(result.result).toBe("warn");
    expect(result.message).toContain("93%");
  });

  it("preview deployment URL is derived from branch name and PR id", () => {
    const pr: PullRequest = { id: 42, branch: "feat/new-dashboard", sha: "abc123", author: "alice" };
    const url = generatePreviewUrl(pr, "preview.myapp.com");
    expect(url).toBe("https://feat-new-dashboard-42.preview.myapp.com");
  });

  it("Lighthouse check passes when all scores meet thresholds", () => {
    const report: LighthouseReport = { performance: 95, accessibility: 100, bestPractices: 92, seo: 90 };
    const thresholds: LighthouseThresholds = { performance: 90, accessibility: 90, bestPractices: 90, seo: 90 };

    const result = checkLighthouse(report, thresholds);
    expect(result.passed).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it("Lighthouse check fails and reports specific categories below threshold", () => {
    const report: LighthouseReport = { performance: 82, accessibility: 78, bestPractices: 95, seo: 90 };
    const thresholds: LighthouseThresholds = { performance: 90, accessibility: 90, bestPractices: 90, seo: 90 };

    const result = checkLighthouse(report, thresholds);
    expect(result.passed).toBe(false);
    expect(result.failures).toContain("performance: 82 < 90");
    expect(result.failures).toContain("accessibility: 78 < 90");
    expect(result.failures).not.toContain("bestPractices");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. FEATURE FLAG TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("3 — Feature flags", () => {
  let store: FeatureFlagStore;

  beforeEach(() => {
    store = new FeatureFlagStore();
  });

  it("flag is off by default when no rules match", () => {
    store.addFlag({
      key: "new-dashboard",
      defaultValue: false,
      rules: [],
      enabled: true,
    });
    store.setUser({ id: "user-999" });

    expect(store.isEnabled("new-dashboard")).toBe(false);
  });

  it("master kill switch overrides all rules", () => {
    store.addFlag({
      key: "new-dashboard",
      defaultValue: false,
      rules: [{ type: "allowlist", userIds: ["user-1"] }],
      enabled: false, // disabled
    });
    store.setUser({ id: "user-1" });

    expect(store.isEnabled("new-dashboard")).toBe(false); // kill switch wins
  });

  it("allowlist rule enables flag for specific users", () => {
    store.addFlag({
      key: "beta-feature",
      defaultValue: false,
      rules: [{ type: "allowlist", userIds: ["alice", "bob"] }],
      enabled: true,
    });

    store.setUser({ id: "alice" });
    expect(store.isEnabled("beta-feature")).toBe(true);

    store.setUser({ id: "charlie" });
    expect(store.isEnabled("beta-feature")).toBe(false);
  });

  it("percentage rollout enables flag for users within the bucket", () => {
    store.addFlag({
      key: "new-checkout",
      defaultValue: false,
      rules: [{ type: "percentage", percent: 20 }],
      enabled: true,
    });

    // Bucket 10 → within 20% → enabled
    store.setUser({ id: "u1", percentileBucket: 10 });
    expect(store.isEnabled("new-checkout")).toBe(true);

    // Bucket 30 → outside 20% → disabled
    store.setUser({ id: "u2", percentileBucket: 30 });
    expect(store.isEnabled("new-checkout")).toBe(false);
  });

  it("attribute rule enables flag for users with matching plan", () => {
    store.addFlag({
      key: "analytics-export",
      defaultValue: false,
      rules: [{ type: "attribute", key: "plan", operator: "in", value: ["pro", "enterprise"] }],
      enabled: true,
    });

    store.setUser({ id: "u1", plan: "pro" });
    expect(store.isEnabled("analytics-export")).toBe(true);

    store.setUser({ id: "u2", plan: "enterprise" });
    expect(store.isEnabled("analytics-export")).toBe(true);

    store.setUser({ id: "u3", plan: "free" });
    expect(store.isEnabled("analytics-export")).toBe(false);
  });

  it("attribute rule eq operator matches exact value", () => {
    store.addFlag({
      key: "us-only-feature",
      defaultValue: false,
      rules: [{ type: "attribute", key: "country", operator: "eq", value: "US" }],
      enabled: true,
    });

    store.setUser({ id: "u1", country: "US" });
    expect(store.isEnabled("us-only-feature")).toBe(true);

    store.setUser({ id: "u2", country: "GB" });
    expect(store.isEnabled("us-only-feature")).toBe(false);
  });

  it("rules are evaluated in order — first match wins", () => {
    store.addFlag({
      key: "progressive-rollout",
      defaultValue: false,
      rules: [
        { type: "allowlist", userIds: ["internal-1"] },       // rule 1: internal team
        { type: "percentage", percent: 10 },                   // rule 2: 10% beta
      ],
      enabled: true,
    });

    // Internal user matched by rule 1 (even bucket > 10)
    store.setUser({ id: "internal-1", percentileBucket: 50 });
    expect(store.isEnabled("progressive-rollout")).toBe(true);

    // External user in 10% bucket — matched by rule 2
    store.setUser({ id: "user-x", percentileBucket: 5 });
    expect(store.isEnabled("progressive-rollout")).toBe(true);

    // External user outside 10%
    store.setUser({ id: "user-y", percentileBucket: 20 });
    expect(store.isEnabled("progressive-rollout")).toBe(false);
  });

  it("unknown flag key returns false", () => {
    expect(store.isEnabled("non-existent-flag")).toBe(false);
  });

  it("getAllFlags returns evaluation for all registered flags", () => {
    store.setUser({ id: "u1", plan: "pro", percentileBucket: 5 });

    store.addFlag({ key: "feat-a", defaultValue: false, rules: [{ type: "allowlist", userIds: ["u1"] }], enabled: true });
    store.addFlag({ key: "feat-b", defaultValue: false, rules: [{ type: "percentage", percent: 10 }], enabled: true });
    store.addFlag({ key: "feat-c", defaultValue: false, rules: [], enabled: false });

    const flags = store.getAllFlags();
    expect(flags["feat-a"]).toBe(true);  // allowlist match
    expect(flags["feat-b"]).toBe(true);  // bucket 5 < 10% → enabled
    expect(flags["feat-c"]).toBe(false); // kill switch
  });

  it("FeatureGate renders children when flag is enabled", () => {
    store.addFlag({ key: "v2-ui", defaultValue: false, rules: [{ type: "allowlist", userIds: ["alice"] }], enabled: true });
    store.setUser({ id: "alice" });

    render(
      <FeatureGate store={store} flag="v2-ui">
        <NewDashboard />
      </FeatureGate>
    );

    expect(screen.getByTestId("new-dashboard")).toBeInTheDocument();
  });

  it("FeatureGate renders fallback when flag is disabled", () => {
    store.addFlag({ key: "v2-ui", defaultValue: false, rules: [], enabled: true });
    store.setUser({ id: "bob" });

    render(
      <FeatureGate store={store} flag="v2-ui" fallback={<OldDashboard />}>
        <NewDashboard />
      </FeatureGate>
    );

    expect(screen.getByTestId("old-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("new-dashboard")).not.toBeInTheDocument();
  });

  it("FeatureGate renders nothing (not fallback) when no fallback given and flag is off", () => {
    store.addFlag({ key: "v2-ui", defaultValue: false, rules: [], enabled: true });
    store.setUser({ id: "bob" });

    const { container } = render(
      <FeatureGate store={store} flag="v2-ui">
        <NewDashboard />
      </FeatureGate>
    );

    expect(screen.queryByTestId("new-dashboard")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
