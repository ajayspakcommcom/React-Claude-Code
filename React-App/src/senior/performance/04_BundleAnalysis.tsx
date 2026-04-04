// TOPIC: Bundle Analysis
// LEVEL: Senior — Performance (Deep)
//
// ─── WHAT IS A BUNDLE? ───────────────────────────────────────────────────────
//
//   When you run `npm run build`, webpack takes ALL your code + every
//   npm package you import and concatenates it into one (or more) .js files.
//   That file is what the browser downloads before your app can run.
//
//   Problem: if you import moment.js (67KB) just to format one date, the
//   user downloads all 67KB even though you only used 2KB of it.
//
// ─── THE THREE BUNDLE PROBLEMS ───────────────────────────────────────────────
//
//   1. TOO BIG  — bundle is large, long download time, high LCP / FCP
//   2. WRONG SHAPE — one giant file, browser can't cache parts separately
//   3. HIDDEN BLOAT — you think you're importing a small util, but it
//      drags in a massive dependency tree
//
// ─── TOOL: webpack-bundle-analyzer ───────────────────────────────────────────
//
//   npm install --save-dev webpack-bundle-analyzer
//
//   Add to webpack.config.js:
//     const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
//     plugins: [new BundleAnalyzerPlugin()]
//
//   Run: ANALYZE=true npm run build
//   → Opens an interactive treemap in your browser showing exactly
//     what is inside each chunk and how many bytes each module costs.
//
// ─── CODE SPLITTING ───────────────────────────────────────────────────────────
//
//   Instead of one huge bundle, split into smaller chunks that load on demand.
//
//   React.lazy + Suspense (route-level splitting):
//
//     const Dashboard = React.lazy(() => import('./Dashboard'));
//
//     <Suspense fallback={<Spinner />}>
//       <Dashboard />
//     </Suspense>
//
//   When the user first visits /dashboard, webpack downloads ONLY the
//   Dashboard chunk — not the whole app.
//
// ─── TREE SHAKING ────────────────────────────────────────────────────────────
//
//   Webpack's dead-code elimination — removes exports that are never imported.
//   Works automatically in production mode, but only for ES modules (import/export).
//
//   WORKS (named import — tree-shakeable):
//     import { format } from 'date-fns';        // only format() included
//
//   BROKEN (default import — NOT tree-shakeable for some libs):
//     import _ from 'lodash';                   // entire lodash included!
//     import { debounce } from 'lodash';        // still entire lodash!
//     import debounce from 'lodash/debounce';   // ✓ only debounce module
//
// ─── CHUNK SPLITTING (splitChunks) ───────────────────────────────────────────
//
//   webpack optimization.splitChunks separates node_modules from app code:
//
//   Before:  bundle.js (3MB) — React + lodash + your code all mixed
//   After:   react-vendor.js (150KB) — never changes between deploys
//              vendors.js (800KB)     — changes rarely
//              main.js (50KB)         — your code, changes every deploy
//
//   Benefit: browser caches vendor chunks long-term. Only re-downloads
//   main.js when you push a new version.
//
// ─── CONTENT HASH ────────────────────────────────────────────────────────────
//
//   filename: '[name].[contenthash:8].js'
//
//   The hash changes ONLY when the file content changes.
//   Safe to cache these files forever (Cache-Control: max-age=31536000).
//   If React version doesn't change, react-vendor.abc12345.js stays cached.
//
// ─── TOP OFFENDERS & FIXES ───────────────────────────────────────────────────
//
//   moment.js (67KB) → use date-fns (tree-shakeable, pay only for what you use)
//   lodash (71KB)    → import lodash/debounce (per-method imports)
//   full icon packs  → import { FiSearch } from 'react-icons/fi' (not react-icons)
//   @mui/material    → path imports: import Button from '@mui/material/Button'

import React, { useState, lazy, Suspense } from "react";

// ─── DEMO: Code Splitting with React.lazy ────────────────────────────────────
// Simulated heavy component (not truly async here — real splitting is at route level)

const HeavyChart = lazy(() =>
  // Simulate network delay loading a "heavy" chunk
  new Promise<{ default: React.ComponentType }>((resolve) =>
    setTimeout(
      () =>
        resolve({
          default: () => (
            <div style={{
              background: "linear-gradient(135deg, #1e3a5f, #2563eb)",
              borderRadius: 10, padding: 24, color: "#fff",
            }}>
              <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 8 }}>
                Heavy Chart Component — loaded on demand
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 80 }}>
                {[40, 65, 30, 80, 55, 90, 45, 70, 60, 85].map((h, i) => (
                  <div key={i} style={{
                    flex: 1, height: `${h}%`,
                    background: "rgba(255,255,255,0.3)",
                    borderRadius: "3px 3px 0 0",
                    transition: "height 0.5s ease",
                  }} />
                ))}
              </div>
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
                This chunk was downloaded only when you clicked "Load"
              </div>
            </div>
          ),
        }),
      1500
    )
  )
);

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface ChunkInfo {
  name: string;
  size: number; // KB
  type: "app" | "vendor" | "react";
  description: string;
  cached: boolean;
}

interface OffenderInfo {
  lib: string;
  size: string;
  problem: string;
  fix: string;
  fixCode: string;
  badCode: string;
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

const BEFORE_CHUNKS: ChunkInfo[] = [
  {
    name: "bundle.js",
    size: 2840,
    type: "app",
    description: "Everything in one file — app code + React + all libraries",
    cached: false,
  },
];

const AFTER_CHUNKS: ChunkInfo[] = [
  {
    name: "react-vendor.[hash].js",
    size: 150,
    type: "react",
    description: "React + ReactDOM — never changes between your deploys",
    cached: true,
  },
  {
    name: "vendors.[hash].js",
    size: 680,
    type: "vendor",
    description: "Other npm packages — changes rarely",
    cached: true,
  },
  {
    name: "main.[hash].js",
    size: 48,
    type: "app",
    description: "Your app code — small, changes on every deploy",
    cached: false,
  },
  {
    name: "dashboard.[hash].chunk.js",
    size: 42,
    type: "app",
    description: "Dashboard route — lazy-loaded on first /dashboard visit",
    cached: false,
  },
  {
    name: "settings.[hash].chunk.js",
    size: 28,
    type: "app",
    description: "Settings route — lazy-loaded on first /settings visit",
    cached: false,
  },
];

const OFFENDERS: OffenderInfo[] = [
  {
    lib: "moment.js",
    size: "67KB",
    problem: "Ships all locale files even if you only use English",
    fix: "Switch to date-fns — tree-shakeable, pay only for what you import",
    badCode: `import moment from 'moment';\nconst formatted = moment(date).format('MMM D, YYYY');`,
    fixCode: `import { format } from 'date-fns';\nconst formatted = format(date, 'MMM d, yyyy');`,
  },
  {
    lib: "lodash",
    size: "71KB",
    problem: "Named imports like { debounce } still pull in the entire library",
    fix: "Import the individual module file directly",
    badCode: `import { debounce } from 'lodash';   // 71KB\nimport _ from 'lodash';            // also 71KB`,
    fixCode: `import debounce from 'lodash/debounce'; // ~2KB\n// or use the native alternative:\nconst debounce = (fn, ms) => { ... };`,
  },
  {
    lib: "react-icons",
    size: "~50KB per icon set",
    problem: "Importing from 'react-icons' pulls in the entire icon set",
    fix: "Import from the specific sub-path for that icon family",
    badCode: `import { FiSearch, FiUser } from 'react-icons';\n// loads ALL feather icons`,
    fixCode: `import { FiSearch } from 'react-icons/fi';\nimport { FiUser } from 'react-icons/fi';\n// loads only the 2 icons you need`,
  },
  {
    lib: "@mui/material",
    size: "300KB+ without path imports",
    problem: "Default import brings in the entire Material UI library",
    fix: "Use deep path imports so tree-shaking can remove unused components",
    badCode: `import { Button, TextField, Dialog }\n  from '@mui/material';\n// includes ALL MUI components`,
    fixCode: `import Button from '@mui/material/Button';\nimport TextField from '@mui/material/TextField';\n// only those 2 components`,
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<ChunkInfo["type"], string> = {
  app: "#3b82f6",
  vendor: "#8b5cf6",
  react: "#06b6d4",
};

const TYPE_BG: Record<ChunkInfo["type"], string> = {
  app: "#eff6ff",
  vendor: "#f5f3ff",
  react: "#ecfeff",
};

const formatKB = (kb: number) =>
  kb >= 1000 ? `${(kb / 1000).toFixed(1)}MB` : `${kb}KB`;

// ─── CHUNK BAR ────────────────────────────────────────────────────────────────

const ChunkBar: React.FC<{ chunk: ChunkInfo; maxSize: number }> = ({ chunk, maxSize }) => {
  const pct = (chunk.size / maxSize) * 100;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontFamily: "monospace", fontSize: 12, color: "#1e293b", fontWeight: 600,
          }}>{chunk.name}</span>
          {chunk.cached && (
            <span style={{
              fontSize: 10, padding: "1px 7px", borderRadius: 20,
              background: "#d1fae5", color: "#065f46", fontWeight: 700,
            }}>cached</span>
          )}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: TYPE_COLOR[chunk.type] }}>
          {formatKB(chunk.size)}
        </span>
      </div>
      <div style={{ height: 16, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: TYPE_COLOR[chunk.type],
          borderRadius: 4, minWidth: 4,
          transition: "width 0.6s ease",
        }} />
      </div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{chunk.description}</div>
    </div>
  );
};

// ─── BUNDLE SHAPE DEMO ────────────────────────────────────────────────────────

const BundleShapeDemo: React.FC = () => {
  const [view, setView] = useState<"before" | "after">("before");
  const chunks = view === "before" ? BEFORE_CHUNKS : AFTER_CHUNKS;
  const maxSize = Math.max(...chunks.map(c => c.size));
  const totalBefore = BEFORE_CHUNKS.reduce((a, c) => a + c.size, 0);
  const totalAfter = AFTER_CHUNKS.reduce((a, c) => a + c.size, 0);
  const cachedAfter = AFTER_CHUNKS.filter(c => c.cached).reduce((a, c) => a + c.size, 0);
  const redownloadAfter = totalAfter - cachedAfter;

  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0",
      borderRadius: 12, padding: 20,
    }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        Bundle Shape — Before vs After
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
        Code splitting + chunk splitting dramatically changes what the browser re-downloads on each deploy.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["before", "after"] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: "6px 16px", borderRadius: 8, fontWeight: 600,
              fontSize: 13, cursor: "pointer", border: "2px solid",
              borderColor: view === v ? (v === "before" ? "#ef4444" : "#22c55e") : "#e2e8f0",
              background: view === v ? (v === "before" ? "#fef2f2" : "#f0fdf4") : "#f8fafc",
              color: view === v ? (v === "before" ? "#dc2626" : "#16a34a") : "#64748b",
            }}
          >
            {v === "before" ? "Before (1 chunk)" : "After (code split)"}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        {chunks.map(c => (
          <ChunkBar key={c.name} chunk={c} maxSize={maxSize} />
        ))}
      </div>

      {/* Summary */}
      <div style={{
        display: "grid",
        gridTemplateColumns: view === "after" ? "1fr 1fr 1fr" : "1fr",
        gap: 10,
      }}>
        <div style={{
          padding: "12px 16px", borderRadius: 8,
          background: view === "before" ? "#fef2f2" : "#eff6ff",
          border: `1px solid ${view === "before" ? "#fecaca" : "#bfdbfe"}`,
        }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 2 }}>
            TOTAL BUNDLE
          </div>
          <div style={{
            fontSize: 22, fontWeight: 800,
            color: view === "before" ? "#dc2626" : "#2563eb",
          }}>
            {formatKB(view === "before" ? totalBefore : totalAfter)}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>
            {view === "before" ? "downloaded on every page load" : "total across all chunks"}
          </div>
        </div>

        {view === "after" && (
          <>
            <div style={{
              padding: "12px 16px", borderRadius: 8,
              background: "#f0fdf4", border: "1px solid #bbf7d0",
            }}>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 2 }}>
                SERVED FROM CACHE
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#16a34a" }}>
                {formatKB(cachedAfter)}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                vendor chunks — browser already has them
              </div>
            </div>
            <div style={{
              padding: "12px 16px", borderRadius: 8,
              background: "#fffbeb", border: "1px solid #fde68a",
            }}>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 2 }}>
                ACTUALLY DOWNLOADED
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#d97706" }}>
                {formatKB(redownloadAfter)}
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                on every new deploy
              </div>
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap" }}>
        {(Object.entries(TYPE_COLOR) as [ChunkInfo["type"], string][]).map(([type, color]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b" }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
            {type === "app" ? "Your code" : type === "react" ? "React vendor" : "Other vendors"}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── CODE SPLITTING DEMO ──────────────────────────────────────────────────────

const CodeSplittingDemo: React.FC = () => {
  const [loaded, setLoaded] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) =>
    setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 4)]);

  const handleLoad = () => {
    addLog("User navigated to /dashboard");
    addLog("webpack detects React.lazy boundary…");
    setTimeout(() => addLog("Downloading dashboard.chunk.js…"), 100);
    setTimeout(() => addLog("Chunk received — rendering component"), 1400);
    setLoaded(true);
  };

  const handleUnload = () => {
    setLoaded(false);
    setLog([]);
  };

  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0",
      borderRadius: 12, padding: 20,
    }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        React.lazy + Suspense — Code Splitting Demo
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
        The heavy chart component is NOT included in the initial bundle. It loads only when requested.
      </div>

      <div style={{
        background: "#0f172a", borderRadius: 8, padding: 14,
        marginBottom: 16, fontFamily: "monospace", fontSize: 12,
        color: "#e2e8f0", lineHeight: 1.7,
      }}>
        <span style={{ color: "#94a3b8" }}>{"// Route-level code splitting\n"}</span>
        <span style={{ color: "#7dd3fc" }}>{"const "}</span>
        <span style={{ color: "#fbbf24" }}>{"HeavyChart "}</span>
        <span style={{ color: "#7dd3fc" }}>{"= React.lazy("}</span>
        <span style={{ color: "#86efac" }}>{"() => import('./HeavyChart')"}</span>
        <span style={{ color: "#7dd3fc" }}>{")"}</span>
        {"\n\n"}
        <span style={{ color: "#f472b6" }}>{"<Suspense "}</span>
        <span style={{ color: "#fbbf24" }}>{"fallback"}</span>
        <span style={{ color: "#f472b6" }}>{"={<Spinner />}>\n"}</span>
        <span style={{ color: "#f472b6" }}>{"  <HeavyChart />\n"}</span>
        <span style={{ color: "#f472b6" }}>{"</Suspense>"}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              onClick={handleLoad}
              disabled={loaded}
              style={{
                padding: "8px 16px", borderRadius: 8,
                background: loaded ? "#f1f5f9" : "#3b82f6",
                color: loaded ? "#94a3b8" : "#fff",
                border: "none", cursor: loaded ? "default" : "pointer",
                fontWeight: 600, fontSize: 13,
              }}
            >
              Navigate to /dashboard
            </button>
            {loaded && (
              <button
                onClick={handleUnload}
                style={{
                  padding: "8px 16px", borderRadius: 8,
                  background: "#f1f5f9", color: "#64748b",
                  border: "1px solid #e2e8f0", cursor: "pointer",
                  fontWeight: 600, fontSize: 13,
                }}
              >
                Back
              </button>
            )}
          </div>

          {/* Event log */}
          <div style={{
            background: "#0f172a", borderRadius: 8, padding: 12,
            minHeight: 120, fontFamily: "monospace", fontSize: 11,
          }}>
            {log.length === 0 && (
              <div style={{ color: "#475569" }}>Waiting for navigation…</div>
            )}
            {log.map((entry, i) => (
              <div key={i} style={{
                color: i === 0 ? "#86efac" : "#64748b",
                marginBottom: 3,
              }}>{entry}</div>
            ))}
          </div>
        </div>

        <div>
          {loaded ? (
            <Suspense fallback={
              <div style={{
                background: "#1e293b", borderRadius: 10, padding: 24,
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 10, color: "#94a3b8", fontSize: 13, minHeight: 140,
              }}>
                <style>{`@keyframes cl-spin2{to{transform:rotate(360deg)}}`}</style>
                <div style={{
                  width: 20, height: 20, borderRadius: "50%",
                  border: "2px solid #334155", borderTopColor: "#3b82f6",
                  animation: "cl-spin2 0.8s linear infinite",
                }} />
                Loading chunk…
              </div>
            }>
              <HeavyChart />
            </Suspense>
          ) : (
            <div style={{
              border: "2px dashed #e2e8f0", borderRadius: 10,
              minHeight: 140, display: "flex", alignItems: "center",
              justifyContent: "center", color: "#94a3b8", fontSize: 13,
            }}>
              Component not yet loaded
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── OFFENDERS TABLE ──────────────────────────────────────────────────────────

const OffendersPanel: React.FC = () => {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0",
      borderRadius: 12, padding: 20,
    }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        Top Bundle Offenders
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
        Click any library to see the bad import and the fix.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {OFFENDERS.map(o => (
          <div key={o.lib}>
            <button
              onClick={() => setOpen(open === o.lib ? null : o.lib)}
              style={{
                width: "100%", textAlign: "left",
                padding: "12px 16px", borderRadius: 8,
                border: `1px solid ${open === o.lib ? "#3b82f6" : "#e2e8f0"}`,
                background: open === o.lib ? "#eff6ff" : "#f8fafc",
                cursor: "pointer", display: "flex",
                justifyContent: "space-between", alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{
                  fontFamily: "monospace", fontWeight: 700, fontSize: 14,
                  color: "#1e293b",
                }}>{o.lib}</span>
                <span style={{
                  fontSize: 12, padding: "2px 8px", borderRadius: 20,
                  background: "#fef2f2", color: "#dc2626",
                  fontWeight: 600,
                }}>{o.size}</span>
                <span style={{ fontSize: 12, color: "#64748b" }}>{o.problem}</span>
              </div>
              <span style={{ color: "#94a3b8", fontSize: 12 }}>
                {open === o.lib ? "▲" : "▼"}
              </span>
            </button>

            {open === o.lib && (
              <div style={{
                border: "1px solid #bfdbfe", borderTop: "none",
                borderRadius: "0 0 8px 8px", padding: 16,
                background: "#fff",
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: "#ef4444",
                      textTransform: "uppercase", letterSpacing: 1, marginBottom: 6,
                    }}>Bad import</div>
                    <div style={{
                      background: "#0f172a", borderRadius: 6, padding: 12,
                      fontFamily: "monospace", fontSize: 11, color: "#fca5a5",
                      lineHeight: 1.6, whiteSpace: "pre",
                    }}>{o.badCode}</div>
                  </div>
                  <div>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: "#22c55e",
                      textTransform: "uppercase", letterSpacing: 1, marginBottom: 6,
                    }}>Fix</div>
                    <div style={{
                      background: "#0f172a", borderRadius: 6, padding: 12,
                      fontFamily: "monospace", fontSize: 11, color: "#86efac",
                      lineHeight: 1.6, whiteSpace: "pre",
                    }}>{o.fixCode}</div>
                  </div>
                </div>
                <div style={{
                  marginTop: 10, padding: "8px 12px",
                  background: "#f0fdf4", borderRadius: 6,
                  fontSize: 12, color: "#166534",
                }}>
                  Fix: {o.fix}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── TREE SHAKING EXPLAINER ───────────────────────────────────────────────────

const TreeShakingPanel: React.FC = () => {
  const [mode, setMode] = useState<"broken" | "fixed">("broken");

  const modules = mode === "broken"
    ? [
        { name: "lodash/array", size: 12, included: true },
        { name: "lodash/collection", size: 18, included: true },
        { name: "lodash/function", size: 8, included: true, highlight: true },
        { name: "lodash/lang", size: 14, included: true },
        { name: "lodash/math", size: 6, included: true },
        { name: "lodash/object", size: 13, included: true },
      ]
    : [
        { name: "lodash/array", size: 12, included: false },
        { name: "lodash/collection", size: 18, included: false },
        { name: "lodash/function/debounce", size: 2, included: true, highlight: true },
        { name: "lodash/lang", size: 14, included: false },
        { name: "lodash/math", size: 6, included: false },
        { name: "lodash/object", size: 13, included: false },
      ];

  const totalKB = modules.filter(m => m.included).reduce((a, m) => a + m.size, 0);

  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0",
      borderRadius: 12, padding: 20,
    }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        Tree Shaking — What Gets Included?
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
        You only use <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>debounce</code>.
        Watch how the import style determines whether tree shaking can do its job.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["broken", "fixed"] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: "6px 14px", borderRadius: 8, fontWeight: 600,
              fontSize: 12, cursor: "pointer", border: "2px solid",
              borderColor: mode === m ? (m === "broken" ? "#ef4444" : "#22c55e") : "#e2e8f0",
              background: mode === m ? (m === "broken" ? "#fef2f2" : "#f0fdf4") : "#f8fafc",
              color: mode === m ? (m === "broken" ? "#dc2626" : "#16a34a") : "#64748b",
            }}
          >
            {m === "broken" ? "import { debounce } from 'lodash'" : "import debounce from 'lodash/debounce'"}
          </button>
        ))}
      </div>

      <div style={{
        padding: "8px 12px", borderRadius: 6, marginBottom: 14,
        background: "#0f172a", fontFamily: "monospace", fontSize: 12,
        color: mode === "broken" ? "#fca5a5" : "#86efac",
      }}>
        {mode === "broken"
          ? "import { debounce } from 'lodash';  // ← whole lodash bundled"
          : "import debounce from 'lodash/debounce';  // ← only debounce"}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {modules.map(m => (
          <div key={m.name} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 12px", borderRadius: 6,
            background: m.included ? (m.highlight ? "#f0fdf4" : "#fef2f2") : "#f8fafc",
            border: `1px solid ${m.included ? (m.highlight ? "#bbf7d0" : "#fecaca") : "#e2e8f0"}`,
            opacity: m.included ? 1 : 0.5,
            transition: "all 0.3s",
          }}>
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: m.included ? (m.highlight ? "#16a34a" : "#dc2626") : "#94a3b8",
            }}>
              {m.included ? "✓" : "✕"}
            </span>
            <span style={{
              fontFamily: "monospace", fontSize: 12,
              color: m.included ? "#1e293b" : "#94a3b8", flex: 1,
            }}>{m.name}</span>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: m.included ? (m.highlight ? "#16a34a" : "#dc2626") : "#94a3b8",
            }}>{m.size}KB</span>
          </div>
        ))}
      </div>

      <div style={{
        padding: "12px 16px", borderRadius: 8,
        background: mode === "broken" ? "#fef2f2" : "#f0fdf4",
        border: `1px solid ${mode === "broken" ? "#fecaca" : "#bbf7d0"}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
          Included in bundle:
        </span>
        <span style={{
          fontSize: 20, fontWeight: 800,
          color: mode === "broken" ? "#dc2626" : "#16a34a",
        }}>{totalKB}KB</span>
      </div>
    </div>
  );
};

// ─── WEBPACK CONFIG PANEL ─────────────────────────────────────────────────────

const WebpackConfigPanel: React.FC = () => (
  <div style={{
    background: "#0f172a", borderRadius: 12, padding: 20,
    border: "1px solid #1e293b",
  }}>
    <div style={{ fontWeight: 700, fontSize: 14, color: "#94a3b8", marginBottom: 4 }}>
      webpack.config.js — full setup used in this project
    </div>
    <div style={{ fontSize: 12, color: "#475569", marginBottom: 12 }}>
      Copy this pattern for any webpack 5 + React project.
    </div>
    <pre style={{
      margin: 0, fontSize: 11, lineHeight: 1.75,
      color: "#e2e8f0", fontFamily: "monospace", overflow: "auto",
    }}>{`const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = (env, argv) => ({
  // ... entry, module, etc.

  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // React + ReactDOM cached separately (never changes between your deploys)
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react-vendor',
          priority: 20,
        },
        // Everything else in node_modules
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: 10,
        },
      },
    },
  },

  output: {
    // contenthash changes only when file content changes
    // → safe to cache forever (Cache-Control: max-age=31536000)
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
  },

  plugins: [
    // Only active when: ANALYZE=true npm run build
    ...(process.env.ANALYZE === 'true' ? [new BundleAnalyzerPlugin()] : []),
  ],
});

// package.json scripts:
// "build":   "webpack --mode production"
// "analyze": "ANALYZE=true npm run build"`}
    </pre>
  </div>
);

// ─── CONCEPTS TAB ─────────────────────────────────────────────────────────────

const ConceptsTab: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    {/* 4-problem overview */}
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
    }}>
      {[
        {
          icon: "📦",
          title: "Bundle too big",
          problem: "Single 3MB file — user waits before app can render",
          fix: "Tree shaking + remove unused deps + switch to lighter alternatives",
          color: "#ef4444", bg: "#fef2f2",
        },
        {
          icon: "✂️",
          title: "Wrong shape",
          problem: "One file — can't cache parts separately, full re-download on every deploy",
          fix: "Code splitting + splitChunks + contenthash filenames",
          color: "#f59e0b", bg: "#fffbeb",
        },
        {
          icon: "🔍",
          title: "Hidden bloat",
          problem: "You import 'format' from moment (2KB) but get all locales (65KB)",
          fix: "Use webpack-bundle-analyzer to SEE what's inside your chunks",
          color: "#8b5cf6", bg: "#f5f3ff",
        },
        {
          icon: "🌲",
          title: "Dead code",
          problem: "Imports pulled in but never used — webpack can't remove them",
          fix: "Use ES module named imports + path imports for large libraries",
          color: "#22c55e", bg: "#f0fdf4",
        },
      ].map(c => (
        <div key={c.title} style={{
          border: `1px solid ${c.color}33`, borderRadius: 10,
          padding: 16, background: c.bg,
        }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", marginBottom: 4 }}>
            {c.title}
          </div>
          <div style={{ fontSize: 12, color: "#dc2626", marginBottom: 8 }}>
            Problem: {c.problem}
          </div>
          <div style={{ fontSize: 12, color: "#166534" }}>
            Fix: {c.fix}
          </div>
        </div>
      ))}
    </div>

    <BundleShapeDemo />
    <TreeShakingPanel />
    <WebpackConfigPanel />
  </div>
);

// ─── DEMO TAB ─────────────────────────────────────────────────────────────────

const DemoTab: React.FC = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
    <CodeSplittingDemo />
    <OffendersPanel />
  </div>
);

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export const BundleAnalysis: React.FC = () => {
  const [tab, setTab] = useState<"concepts" | "demo">("concepts");

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 860, margin: "0 auto", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{
            background: "#3b82f6", color: "#fff", fontSize: 11,
            fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            textTransform: "uppercase", letterSpacing: 1,
          }}>Senior — Performance #4</span>
          <span style={{
            background: "#f5f3ff", color: "#6d28d9", fontSize: 11,
            fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            border: "1px solid #ddd6fe",
          }}>webpack-bundle-analyzer</span>
        </div>
        <h2 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, color: "#0f172a" }}>
          Bundle Analysis
        </h2>
        <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.6 }}>
          Inspect what's inside your JavaScript bundle, find hidden bloat,
          and fix it with code splitting, tree shaking, and smarter imports.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid #e2e8f0" }}>
        {(["concepts", "demo"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 20px", background: "none", border: "none",
              cursor: "pointer", fontWeight: 600, fontSize: 14,
              color: tab === t ? "#3b82f6" : "#64748b",
              borderBottom: `3px solid ${tab === t ? "#3b82f6" : "transparent"}`,
              marginBottom: -2, textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "concepts" ? <ConceptsTab /> : <DemoTab />}
    </div>
  );
};

export default BundleAnalysis;
