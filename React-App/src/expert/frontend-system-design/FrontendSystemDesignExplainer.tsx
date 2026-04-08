// TOPIC: Frontend System Design — Visual Explainer
// Micro-frontends, CI/CD, Feature Flags

import React, { useState } from "react";

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

// ─── Demo 1: Micro-frontends ──────────────────────────────────────────────────

const MFE_TABS = ["architecture", "module federation", "event bus", "challenges"] as const;
type MfeTab = (typeof MFE_TABS)[number];

const MicroFrontendsDemo: React.FC = () => {
  const [tab, setTab] = useState<MfeTab>("architecture");
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [cartCount, setCartCount] = useState(0);

  const emitEvent = (event: string, payload: string) => {
    setEventLog(prev => [`${event}: ${payload}`, ...prev].slice(0, 5));
    if (event === "cart:add") setCartCount(c => c + 1);
    if (event === "cart:clear") setCartCount(0);
  };

  return (
    <div>
      <div style={s.tabs}>
        {MFE_TABS.map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "architecture" && (
        <>
          <div style={s.note}>
            Micro-frontends split a large SPA into independently deployable apps owned by different teams. Each team ships on its own cadence — no "big bang" releases.
          </div>
          <div style={{ ...s.card, fontFamily: "monospace", fontSize: 12, lineHeight: 1.8 }}>
            {`┌─────────────────────────────────────────────────────┐
│                    Shell App (Host)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Nav MFE    │  │ Product MFE │  │ Checkout MFE│  │
│  │ (Team Nav)  │  │(Team Catalog│  │(Team Orders)│  │
│  │             │  │             │  │             │  │
│  │  deployed   │  │  deployed   │  │  deployed   │  │
│  │ separately  │  │ separately  │  │ separately  │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘`}
          </div>
          <div style={s.grid2}>
            {[
              { approach: "Build-time (npm package)", pro: "Simple, type-safe", con: "Shared deploy — defeats independence", badge: "#d97706" },
              { approach: "iframes", pro: "Complete isolation", con: "Clunky UX, hard to share state", badge: "#d97706" },
              { approach: "Web Components", pro: "Framework-agnostic", con: "Shadow DOM complexity", badge: "#0891b2" },
              { approach: "Module Federation ✅", pro: "True runtime independence, shared React", con: "Webpack-only (mostly), version negotiation", badge: "#059669" },
            ].map(({ approach, pro, con, badge }) => (
              <div key={approach} style={s.card}>
                <div style={s.label(badge)}>{approach}</div>
                <div style={{ fontSize: 11 }}>
                  <div style={{ color: "#059669" }}>✅ {pro}</div>
                  <div style={{ color: "#dc2626", marginTop: 2 }}>⚠ {con}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "module federation" && (
        <>
          <div style={s.note}>
            Module Federation (Webpack 5) lets apps share code at runtime via a CDN URL. The host fetches the remote's <code>remoteEntry.js</code> on demand.
          </div>
          <div style={s.grid2}>
            <div style={s.card}>
              <div style={s.label("#6366f1")}>Remote (checkout team)</div>
              <div style={{ ...s.code, marginBottom: 0, fontSize: 11 }}>
                {`// webpack.config.js
new ModuleFederationPlugin({
  name: 'checkout',
  filename: 'remoteEntry.js',
  exposes: {
    './Widget': './src/CheckoutWidget',
  },
  shared: {
    react: { singleton: true, requiredVersion: '^18' },
    'react-dom': { singleton: true },
  },
})`}
              </div>
            </div>
            <div style={s.card}>
              <div style={s.label("#059669")}>Host (shell team)</div>
              <div style={{ ...s.code, marginBottom: 0, fontSize: 11 }}>
                {`// webpack.config.js
new ModuleFederationPlugin({
  name: 'shell',
  remotes: {
    checkout: 'checkout@https://cdn.example.com/checkout/remoteEntry.js',
  },
  shared: { react: { singleton: true } },
})

// Usage in shell component:
const CheckoutWidget = React.lazy(
  () => import('checkout/CheckoutWidget')
);`}
              </div>
            </div>
          </div>
          <div style={s.card}>
            <strong style={{ fontSize: 12 }}>How it works at runtime</strong>
            <ol style={{ fontSize: 12, color: "#475569", margin: "6px 0 0", paddingLeft: 18 }}>
              <li>Shell loads — its <code>remoteEntry.js</code> declares what it shares (React 18)</li>
              <li>When <code>import('checkout/CheckoutWidget')</code> is called, Webpack fetches <code>checkout/remoteEntry.js</code> from CDN</li>
              <li>Shared module negotiation: checkout needs React ≥18, shell has 18.3.1 → uses shell's copy</li>
              <li>CheckoutWidget module is fetched and executed in shell's context</li>
              <li>Component renders — same React instance, context works, hooks work</li>
            </ol>
          </div>
        </>
      )}

      {tab === "event bus" && (
        <>
          <div style={s.note}>
            Micro-frontends can't share a Redux store. Use a lightweight event bus (pub/sub) or URL state for cross-MFE communication.
          </div>
          <div style={s.grid2}>
            <div style={s.card}>
              <strong style={{ fontSize: 12 }}>Product MFE</strong>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" as const }}>
                <button style={s.btn("#6366f1")} onClick={() => emitEvent("cart:add", "Product A")}>
                  Add to cart
                </button>
                <button style={s.btn("#0891b2")} onClick={() => emitEvent("nav:goto", "/products")}>
                  Navigate
                </button>
              </div>
            </div>
            <div style={s.card}>
              <strong style={{ fontSize: 12 }}>Checkout MFE</strong>
              <div style={{ fontSize: 12, color: "#334155", marginTop: 8 }}>
                Cart items: <strong style={{ color: "#6366f1" }}>{cartCount}</strong>
              </div>
              <button style={{ ...s.btn("#dc2626"), marginTop: 8 }} onClick={() => emitEvent("cart:clear", "all")}>
                Clear cart
              </button>
            </div>
          </div>
          {eventLog.length > 0 && (
            <div style={s.card}>
              <strong style={{ fontSize: 12 }}>Event bus log</strong>
              {eventLog.map((e, i) => (
                <div key={i} style={{ fontSize: 11, color: "#475569", padding: "2px 0" }}>→ {e}</div>
              ))}
            </div>
          )}
          <div style={s.code}>
            {`// Shared event bus (tiny pub/sub)
const bus = new EventBus();

// Product MFE emits:
bus.emit('cart:add', { productId: 'p1', price: 29.99 });

// Cart MFE subscribes:
const unsub = bus.on('cart:add', ({ productId, price }) => {
  setCartItems(items => [...items, { productId, price }]);
});

// Cleanup on unmount
useEffect(() => unsub, []);`}
          </div>
        </>
      )}

      {tab === "challenges" && (
        <>
          <div style={s.note}>
            Micro-frontends solve org-scale deployment problems but introduce complexity. Use them when team/codebase size justifies the overhead.
          </div>
          {[
            {
              challenge: "Shared state",
              detail: "No shared Redux store — micro-frontends are isolated processes.",
              solution: "URL/query params, event bus, shared library imported by all (not Redux), or BFF (Backend for Frontend) as source of truth.",
            },
            {
              challenge: "CSS isolation",
              detail: "Global CSS from one MFE bleeds into another — class name collisions.",
              solution: "CSS Modules (scoped class names), Shadow DOM, or namespace all classes (e.g. <code>.checkout__button</code>).",
            },
            {
              challenge: "Version mismatches",
              detail: "Host uses React 18, checkout team upgrades to React 19 — shared dep conflict at runtime.",
              solution: "Module Federation version negotiation (strict semver). Pin major versions in shared config. Test with real remote URLs in integration tests.",
            },
            {
              challenge: "Performance overhead",
              detail: "Each MFE ships its own runtime chunk. N remotes = N network requests on first load.",
              solution: "Lazy-load remotes only when needed. Preload critical remotes. Share deps via singleton. Use edge caching for remoteEntry.js files.",
            },
            {
              challenge: "DX / tooling",
              detail: "Local development requires running multiple apps simultaneously. Debugging cross-remote stack traces is harder.",
              solution: "Docker Compose / Turborepo to start all apps. Use source maps. Create a local mock for each remote in unit tests.",
            },
          ].map(({ challenge, detail, solution }) => (
            <div key={challenge} style={{ ...s.card, borderLeft: "4px solid #6366f1" }}>
              <div style={s.label("#6366f1")}>{challenge}</div>
              <p style={{ fontSize: 12, color: "#dc2626", margin: "4px 0" }}>{detail}</p>
              <p style={{ fontSize: 12, color: "#059669", margin: 0 }}>
                ✅ <span dangerouslySetInnerHTML={{ __html: solution }} />
              </p>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

// ─── Demo 2: CI/CD ────────────────────────────────────────────────────────────

const CICD_TABS = ["pipeline", "bundle guard", "preview deploys", "lighthouse"] as const;
type CicdTab = (typeof CICD_TABS)[number];

type StageState = "pending" | "running" | "passed" | "failed" | "skipped";

const CicdDemo: React.FC = () => {
  const [tab, setCicdTab] = useState<CicdTab>("pipeline");
  const [step, setStep] = useState(-1);
  const [injectFailure, setInjectFailure] = useState(false);

  const stages: { name: string; needs: string[]; durationMs: number }[] = [
    { name: "lint", needs: [], durationMs: 200 },
    { name: "type-check", needs: ["lint"], durationMs: 300 },
    { name: "test", needs: ["lint"], durationMs: 500 },
    { name: "build", needs: ["type-check", "test"], durationMs: 800 },
    { name: "preview deploy", needs: ["build"], durationMs: 400 },
    { name: "e2e", needs: ["preview deploy"], durationMs: 600 },
    { name: "prod deploy", needs: ["e2e"], durationMs: 300 },
  ];

  const getStatus = (name: string): StageState => {
    const idx = stages.findIndex(s => s.name === name);
    if (idx > step) return "pending";

    const stage = stages[idx];
    // Inject failure into "test" if selected
    if (injectFailure && name === "test" && idx <= step) return "failed";

    // Check if any needed stage failed
    const anyNeededFailed = stage.needs.some(dep => getStatus(dep) === "failed" || getStatus(dep) === "skipped");
    if (anyNeededFailed) return "skipped";

    return "passed";
  };

  const stageColor: Record<StageState, string> = {
    pending: "#e2e8f0", running: "#fef3c7", passed: "#dcfce7", failed: "#fee2e2", skipped: "#f1f5f9",
  };
  const stageIcon: Record<StageState, string> = {
    pending: "○", running: "⟳", passed: "✓", failed: "✗", skipped: "—",
  };

  return (
    <div>
      <div style={s.tabs}>
        {CICD_TABS.map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setCicdTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "pipeline" && (
        <>
          <div style={s.note}>
            Step through a CI/CD pipeline. Toggle the test failure to see how downstream stages are skipped automatically.
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
            <button style={s.btn()} onClick={() => setStep(s => Math.min(s + 1, stages.length - 1))}>
              Next stage →
            </button>
            <button style={s.btn("#94a3b8")} onClick={() => { setStep(-1); }}>Reset</button>
            <label style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
              <input type="checkbox" checked={injectFailure} onChange={e => setInjectFailure(e.target.checked)} />
              Inject test failure
            </label>
          </div>

          <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
            {stages.map((stage, i) => {
              const status = step >= 0 ? getStatus(stage.name) : "pending";
              return (
                <div
                  key={stage.name}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "8px 14px",
                    borderRadius: 6, background: stageColor[status],
                    border: `1px solid ${status === "passed" ? "#bbf7d0" : status === "failed" ? "#fecaca" : "#e2e8f0"}`,
                  }}
                >
                  <span style={{ fontSize: 16, minWidth: 20 }}>{stageIcon[status]}</span>
                  <code style={{ minWidth: 120, fontWeight: 600, color: "#334155" }}>{stage.name}</code>
                  {stage.needs.length > 0 && (
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>needs: {stage.needs.join(", ")}</span>
                  )}
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "#64748b", fontWeight: 700 }}>
                    {status.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "bundle guard" && (
        <>
          <div style={s.note}>
            Bundle size CI check: fail the build if gzipped JS grows beyond a budget. Prevents "death by a thousand cuts" — every PR that grows the bundle is caught early.
          </div>
          <div style={s.code}>
            {`# .github/workflows/bundle-size.yml
- name: Check bundle size
  run: npx bundlewatch

# bundlewatch.config.js
module.exports = {
  files: [
    { path: 'dist/main.*.js',   maxSize: '200kB' },
    { path: 'dist/vendor.*.js', maxSize: '150kB' },
  ],
  defaultCompression: 'gzip',
};

# Output in PR:
# ✅ main.a3f9c.js   148 kB gzip (limit: 200 kB)
# ❌ vendor.js       165 kB gzip (limit: 150 kB) — FAIL`}
          </div>
          <div style={s.grid2}>
            <div style={s.card}>
              <div style={s.label("#6366f1")}>What to track</div>
              <ul style={{ fontSize: 12, color: "#475569", margin: "4px 0 0", paddingLeft: 14 }}>
                <li>Main JS bundle (gzip)</li>
                <li>Vendor/third-party chunk</li>
                <li>Critical CSS</li>
                <li>Per-route code-split chunks</li>
                <li>Total initial load weight</li>
              </ul>
            </div>
            <div style={s.card}>
              <div style={s.label("#059669")}>When a check fails</div>
              <ul style={{ fontSize: 12, color: "#475569", margin: "4px 0 0", paddingLeft: 14 }}>
                <li>Find what grew: <code>webpack-bundle-analyzer</code></li>
                <li>Tree-shaking missing? Check ESM imports</li>
                <li>New large dep? Evaluate alternatives</li>
                <li>Intentional? Update budget threshold in PR</li>
              </ul>
            </div>
          </div>
        </>
      )}

      {tab === "preview deploys" && (
        <>
          <div style={s.note}>
            Every pull request gets its own preview URL. Reviewers test the actual build — not a diff. Merging to main triggers production deploy automatically.
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 16, marginBottom: 12 }}>
            {[
              { pr: 142, branch: "feat/new-dashboard", url: "https://feat-new-dashboard-142.preview.myapp.com", status: "✅ Ready" },
              { pr: 141, branch: "fix/checkout-bug", url: "https://fix-checkout-bug-141.preview.myapp.com", status: "🔨 Building" },
              { pr: 139, branch: "chore/deps-update", url: "https://chore-deps-update-139.preview.myapp.com", status: "✅ Ready" },
            ].map(({ pr, branch, url, status }) => (
              <div key={pr} style={{ display: "flex", gap: 16, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ color: "#6366f1", minWidth: 40 }}>#{pr}</span>
                <span style={{ color: "#334155", minWidth: 160 }}>{branch}</span>
                <span style={{ color: "#64748b", fontSize: 11, flex: 1 }}>{url}</span>
                <span style={{ fontSize: 11, fontWeight: 700 }}>{status}</span>
              </div>
            ))}
          </div>
          <div style={s.code}>
            {`# .github/workflows/preview.yml
on: [pull_request]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          github-token: \${{ secrets.GITHUB_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
        # Vercel automatically posts preview URL as PR comment`}
          </div>
        </>
      )}

      {tab === "lighthouse" && (
        <>
          <div style={s.note}>
            Lighthouse CI runs performance/accessibility audits on every PR. Fail the build if scores drop below thresholds — prevents performance regressions.
          </div>
          <div style={s.code}>
            {`# lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/', 'http://localhost:3000/blog'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance':   ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices':['warn',  { minScore: 0.9 }],
        'categories:seo':           ['warn',  { minScore: 0.9 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};`}
          </div>
          <div style={s.grid2}>
            <div style={s.card}>
              <div style={s.label("#059669")}>Good scores — PR passes</div>
              {[
                { cat: "Performance", score: 96, ok: true },
                { cat: "Accessibility", score: 100, ok: true },
                { cat: "Best Practices", score: 92, ok: true },
                { cat: "SEO", score: 91, ok: true },
              ].map(({ cat, score, ok }) => (
                <div key={cat} style={{ ...s.row, marginBottom: 6 }}>
                  <span>{ok ? "✅" : "❌"}</span>
                  <span style={{ fontSize: 12, minWidth: 130 }}>{cat}</span>
                  <strong style={{ fontSize: 12, color: ok ? "#059669" : "#dc2626" }}>{score}</strong>
                </div>
              ))}
            </div>
            <div style={s.card}>
              <div style={s.label("#dc2626")}>Regressions — PR blocked</div>
              {[
                { cat: "Performance", score: 82, ok: false },
                { cat: "Accessibility", score: 78, ok: false },
                { cat: "Best Practices", score: 95, ok: true },
                { cat: "SEO", score: 90, ok: true },
              ].map(({ cat, score, ok }) => (
                <div key={cat} style={{ ...s.row, marginBottom: 6 }}>
                  <span>{ok ? "✅" : "❌"}</span>
                  <span style={{ fontSize: 12, minWidth: 130 }}>{cat}</span>
                  <strong style={{ fontSize: 12, color: ok ? "#059669" : "#dc2626" }}>{score}</strong>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Demo 3: Feature Flags ────────────────────────────────────────────────────

const FF_TABS = ["flag types", "targeting rules", "live demo", "lifecycle"] as const;
type FfTab = (typeof FF_TABS)[number];

interface UserCtx {
  id: string;
  plan: "free" | "pro" | "enterprise";
  country: string;
  bucket: number;
}

const evaluateDemo = (
  rules: Array<{ type: string; value: string; match?: string }>,
  user: UserCtx
): boolean => {
  for (const rule of rules) {
    if (rule.type === "allowlist" && rule.value.split(",").map(s => s.trim()).includes(user.id)) return true;
    if (rule.type === "percentage" && user.bucket < parseInt(rule.value)) return true;
    if (rule.type === "plan" && rule.value.split(",").map(s => s.trim()).includes(user.plan)) return true;
    if (rule.type === "country" && user.country === rule.value) return true;
  }
  return false;
};

const FeatureFlagsDemo: React.FC = () => {
  const [tab, setFfTab] = useState<FfTab>("flag types");
  const [user, setUser] = useState<UserCtx>({ id: "user-42", plan: "pro", country: "US", bucket: 15 });
  const [rules, setRules] = useState([
    { type: "allowlist", value: "internal-1, internal-2" },
    { type: "percentage", value: "20" },
    { type: "plan", value: "pro, enterprise" },
  ]);

  const enabled = evaluateDemo(rules, user);

  return (
    <div>
      <div style={s.tabs}>
        {FF_TABS.map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setFfTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "flag types" && (
        <>
          <div style={s.note}>
            Feature flags decouple <strong>deployment</strong> (code ships) from <strong>release</strong> (users see it). Ship dark, enable safely.
          </div>
          {[
            {
              type: "Release flag",
              color: "#6366f1",
              use: "Hide unfinished feature. Enable when ready without redeploying.",
              example: "new-checkout-flow: off → 100%",
              lifecycle: "Created → enabled for team → percentage rollout → removed",
            },
            {
              type: "Experiment flag (A/B)",
              color: "#0891b2",
              use: "Split traffic to measure impact. Winner gets rolled out.",
              example: "checkout-cta-text: 'Buy Now' vs 'Add to Cart'",
              lifecycle: "Created → 50/50 split → measure → winner rolled to 100% → removed",
            },
            {
              type: "Ops / kill switch",
              color: "#dc2626",
              use: "Instantly disable a misbehaving code path without rollback.",
              example: "use-new-search-algorithm: off in 30 seconds",
              lifecycle: "Long-lived. Permanent on/off for risky features.",
            },
            {
              type: "Permission flag",
              color: "#059669",
              use: "Gate premium features by plan/role.",
              example: "analytics-export: plan === 'pro' || 'enterprise'",
              lifecycle: "Long-lived. Permanent entitlement gate.",
            },
          ].map(({ type, color, use, example, lifecycle }) => (
            <div key={type} style={{ ...s.card, borderLeft: `4px solid ${color}` }}>
              <div style={s.label(color)}>{type}</div>
              <p style={{ fontSize: 12, color: "#334155", margin: "4px 0 2px" }}>{use}</p>
              <div style={{ fontSize: 11, color: "#6366f1" }}>Example: <code>{example}</code></div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Lifecycle: {lifecycle}</div>
            </div>
          ))}
        </>
      )}

      {tab === "targeting rules" && (
        <>
          <div style={s.note}>
            Rules are evaluated in order — first match wins. Combine to build progressive rollouts: internal → beta → percentage → everyone.
          </div>
          <div style={s.code}>
            {`// Flag config (stored in LaunchDarkly / GrowthBook / Unleash)
{
  "key": "new-dashboard",
  "defaultValue": false,
  "enabled": true,
  "rules": [
    // Rule 1: Internal team — always on
    { "type": "allowlist", "userIds": ["alice@co.com", "bob@co.com"] },

    // Rule 2: 5% beta rollout (by user ID hash → stable bucket)
    { "type": "percentage", "percent": 5 },

    // Rule 3: All enterprise customers
    { "type": "attribute", "key": "plan", "operator": "eq", "value": "enterprise" },

    // Default: off
  ]
}`}
          </div>
          <div style={s.grid2}>
            <div style={s.card}>
              <div style={s.label("#6366f1")}>Percentage rollout</div>
              <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>
                User ID is hashed to a stable 0–99 bucket. A user always sees the same variant — no flickering between sessions.
              </p>
            </div>
            <div style={s.card}>
              <div style={s.label("#0891b2")}>Server-side evaluation</div>
              <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>
                Evaluate at SSR/edge, send result as prop. No client-side flicker ("flash of wrong content"). Required for SEO-sensitive pages.
              </p>
            </div>
          </div>
        </>
      )}

      {tab === "live demo" && (
        <>
          <div style={s.note}>
            Adjust user attributes to see how flag evaluation changes in real time.
          </div>
          <div style={s.grid2}>
            <div style={s.card}>
              <strong style={{ fontSize: 12 }}>User context</strong>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column" as const, gap: 8 }}>
                <label style={{ fontSize: 12 }}>
                  User ID: <input value={user.id} onChange={e => setUser(u => ({ ...u, id: e.target.value }))}
                    style={{ marginLeft: 8, padding: "2px 6px", borderRadius: 4, border: "1px solid #cbd5e1", fontFamily: "monospace", fontSize: 12, width: 120 }} />
                </label>
                <label style={{ fontSize: 12 }}>
                  Plan: <select value={user.plan} onChange={e => setUser(u => ({ ...u, plan: e.target.value as UserCtx["plan"] }))}
                    style={{ marginLeft: 8, padding: "2px 6px", borderRadius: 4, border: "1px solid #cbd5e1", fontFamily: "monospace", fontSize: 12 }}>
                    <option>free</option><option>pro</option><option>enterprise</option>
                  </select>
                </label>
                <label style={{ fontSize: 12 }}>
                  Country: <input value={user.country} onChange={e => setUser(u => ({ ...u, country: e.target.value }))}
                    style={{ marginLeft: 8, padding: "2px 6px", borderRadius: 4, border: "1px solid #cbd5e1", fontFamily: "monospace", fontSize: 12, width: 40 }} />
                </label>
                <label style={{ fontSize: 12 }}>
                  Bucket (0–99): <input type="number" min={0} max={99} value={user.bucket}
                    onChange={e => setUser(u => ({ ...u, bucket: parseInt(e.target.value) || 0 }))}
                    style={{ marginLeft: 8, padding: "2px 6px", borderRadius: 4, border: "1px solid #cbd5e1", fontFamily: "monospace", fontSize: 12, width: 50 }} />
                </label>
              </div>
            </div>
            <div style={s.card}>
              <strong style={{ fontSize: 12 }}>Active rules</strong>
              <div style={{ marginTop: 8, display: "flex", flexDirection: "column" as const, gap: 6 }}>
                {rules.map((rule, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <select value={rule.type} onChange={e => setRules(r => r.map((x, j) => j === i ? { ...x, type: e.target.value } : x))}
                      style={{ padding: "2px 4px", borderRadius: 4, border: "1px solid #cbd5e1", fontFamily: "monospace", fontSize: 11 }}>
                      <option value="allowlist">allowlist</option>
                      <option value="percentage">percentage</option>
                      <option value="plan">plan</option>
                      <option value="country">country</option>
                    </select>
                    <input value={rule.value} onChange={e => setRules(r => r.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                      style={{ flex: 1, padding: "2px 6px", borderRadius: 4, border: "1px solid #cbd5e1", fontFamily: "monospace", fontSize: 11 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{
            padding: 20, borderRadius: 12, textAlign: "center" as const,
            background: enabled ? "#dcfce7" : "#fee2e2",
            border: `2px solid ${enabled ? "#bbf7d0" : "#fecaca"}`,
          }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: enabled ? "#059669" : "#dc2626" }}>
              {enabled ? "✅ FLAG ON" : "❌ FLAG OFF"}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              {enabled ? "New dashboard shown to this user" : "Old dashboard shown — no rules matched"}
            </div>
          </div>
        </>
      )}

      {tab === "lifecycle" && (
        <>
          <div style={s.note}>
            The most important step is <strong>removing flags</strong>. Flag debt accumulates fast — a flag left in code for years is a permanent branch that nobody dares delete.
          </div>
          {[
            { step: 1, label: "Create flag", color: "#6366f1", detail: "defaultValue: false. Add to code alongside new feature: if (flag) { <NewUI> } else { <OldUI> }" },
            { step: 2, label: "Enable for internal team", color: "#0891b2", detail: "Allowlist rule: add internal user IDs. Test on production data without user impact." },
            { step: 3, label: "Canary rollout (1–5%)", color: "#7c3aed", detail: "Percentage rule: 5%. Watch error rates, performance, conversion. Roll back in seconds if needed." },
            { step: 4, label: "Progressive rollout", color: "#d97706", detail: "5% → 20% → 50% → 100%. Monitor at each stage. Full rollout if metrics look healthy." },
            { step: 5, label: "Remove flag (cleanup)", color: "#059669", detail: "Delete the flag in dashboard. Remove conditional code — keep only the new path. Delete the old UI component. This is the most important step." },
          ].map(({ step, label, color, detail }) => (
            <div key={step} style={{ display: "flex", gap: 12, marginBottom: 8, alignItems: "flex-start" }}>
              <div style={{ ...s.label(color), borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{step}</div>
              <div>
                <strong style={{ fontSize: 12, color }}>{label}</strong>
                <p style={{ fontSize: 12, color: "#475569", margin: "2px 0 0" }}>{detail}</p>
              </div>
            </div>
          ))}
          <div style={{ ...s.note, marginTop: 12 }}>
            <strong>Flag debt rule of thumb:</strong> If a flag has been at 100% rollout for more than 2 weeks with no issues, it should be removed. Track flag age — set a reminder.
          </div>
        </>
      )}
    </div>
  );
};

// ─── Main Explainer ───────────────────────────────────────────────────────────

const MAIN_TABS = ["Micro-frontends", "CI/CD", "Feature Flags"] as const;
type MainTab = (typeof MAIN_TABS)[number];

export const FrontendSystemDesignExplainer: React.FC = () => {
  const [tab, setTab] = useState<MainTab>("Micro-frontends");

  return (
    <div style={s.container}>
      <h2 style={s.h2}>Expert — Frontend System Design</h2>
      <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
        Micro-frontends (Module Federation) · CI/CD · Feature Flags
      </p>
      <div style={s.tabs}>
        {MAIN_TABS.map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "Micro-frontends" && <><h3 style={s.h3}>Micro-frontends — Module Federation</h3><MicroFrontendsDemo /></>}
      {tab === "CI/CD" && <><h3 style={s.h3}>CI/CD for Frontend</h3><CicdDemo /></>}
      {tab === "Feature Flags" && <><h3 style={s.h3}>Feature Flags</h3><FeatureFlagsDemo /></>}
    </div>
  );
};

export default FrontendSystemDesignExplainer;
