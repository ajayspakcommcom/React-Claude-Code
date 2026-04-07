// TOPIC: Performance at Scale — Visual Explainer
// Memory Optimization, Browser Rendering Pipeline, Advanced Caching

import React, { useState, useRef, useEffect, useCallback } from "react";

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = {
  container: { fontFamily: "monospace", fontSize: 13, padding: 20, maxWidth: 900 } as React.CSSProperties,
  h2: { fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#1e293b" } as React.CSSProperties,
  h3: { fontSize: 15, fontWeight: 700, marginBottom: 8, color: "#334155" } as React.CSSProperties,
  tabs: { display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" as const },
  tab: (active: boolean): React.CSSProperties => ({
    padding: "6px 14px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    background: active ? "#6366f1" : "#e2e8f0",
    color: active ? "#fff" : "#334155",
    fontFamily: "monospace",
    fontSize: 12,
    fontWeight: 600,
  }),
  code: {
    background: "#0f172a",
    color: "#e2e8f0",
    borderRadius: 8,
    padding: "14px 16px",
    overflowX: "auto" as const,
    lineHeight: 1.6,
    fontSize: 12,
    marginBottom: 12,
  } as React.CSSProperties,
  card: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "12px 16px",
    marginBottom: 10,
  } as React.CSSProperties,
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 } as React.CSSProperties,
  label: (color: string): React.CSSProperties => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 4,
    background: color,
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
  }),
  note: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: 6,
    padding: "8px 12px",
    fontSize: 12,
    marginBottom: 10,
    color: "#78350f",
  } as React.CSSProperties,
  row: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 } as React.CSSProperties,
  badge: (color: string): React.CSSProperties => ({
    display: "inline-block",
    padding: "1px 8px",
    borderRadius: 10,
    background: color,
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    minWidth: 80,
    textAlign: "center" as const,
  }),
  btn: (color = "#6366f1"): React.CSSProperties => ({
    padding: "6px 14px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    background: color,
    color: "#fff",
    fontFamily: "monospace",
    fontSize: 12,
    fontWeight: 600,
    marginRight: 6,
  }),
};

// ─── Demo 1: Memory Optimization ─────────────────────────────────────────────

class LRUDemo<K, V> {
  private capacity: number;
  private map: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.map = new Map();
  }

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: K, value: V): string | null {
    let evicted: string | null = null;
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      const oldestKey = this.map.keys().next().value!;
      evicted = String(oldestKey);
      this.map.delete(oldestKey);
    }
    this.map.set(key, value);
    return evicted;
  }

  entries(): [K, V][] {
    return Array.from(this.map.entries());
  }

  get size(): number { return this.map.size; }
  get cap(): number { return this.capacity; }
}

const MEM_TABS = ["LRU Cache", "Memory Leaks", "Leak Patterns"] as const;
type MemTab = (typeof MEM_TABS)[number];

const MemoryDemo: React.FC = () => {
  const [tab, setTab] = useState<MemTab>("LRU Cache");
  const [lruEntries, setLruEntries] = useState<[string, number][]>([]);
  const [evicted, setEvicted] = useState<string[]>([]);
  const [inputKey, setInputKey] = useState("a");
  const [inputVal, setInputVal] = useState("1");
  const lruRef = useRef(new LRUDemo<string, number>(4));

  const addEntry = () => {
    const v = parseInt(inputVal) || 0;
    const e = lruRef.current.set(inputKey, v);
    if (e) setEvicted(prev => [`"${e}" evicted (LRU)`, ...prev].slice(0, 5));
    setLruEntries(lruRef.current.entries());
  };

  const accessEntry = (key: string) => {
    lruRef.current.get(key);
    setLruEntries(lruRef.current.entries());
  };

  return (
    <div>
      <div style={s.tabs}>
        {MEM_TABS.map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "LRU Cache" && (
        <>
          <div style={s.note}>
            LRU (Least-Recently-Used) evicts the oldest unused entry when capacity is reached.
            Click entries to mark them as recently used — they move to the end and survive eviction longer.
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
            <input
              value={inputKey}
              onChange={e => setInputKey(e.target.value)}
              style={{ width: 60, padding: "4px 8px", borderRadius: 4, border: "1px solid #cbd5e1", fontFamily: "monospace" }}
              placeholder="key"
            />
            <input
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              style={{ width: 60, padding: "4px 8px", borderRadius: 4, border: "1px solid #cbd5e1", fontFamily: "monospace" }}
              placeholder="val"
            />
            <button style={s.btn()} onClick={addEntry}>set()</button>
            <span style={{ fontSize: 11, color: "#64748b" }}>capacity: {lruRef.current.cap}</span>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#64748b" }}>← LRU (evicted next)</span>
            {lruEntries.map(([k, v]) => (
              <button
                key={k}
                onClick={() => accessEntry(k)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "2px solid #6366f1",
                  background: "#ede9fe",
                  cursor: "pointer",
                  fontFamily: "monospace",
                  fontSize: 12,
                  color: "#4c1d95",
                }}
              >
                {k}: {v}
              </button>
            ))}
            <span style={{ fontSize: 11, color: "#64748b" }}>MRU (safe) →</span>
          </div>

          {evicted.length > 0 && (
            <div style={s.card}>
              <span style={s.label("#dc2626")}>Evictions</span>
              {evicted.map((e, i) => (
                <div key={i} style={{ fontSize: 11, color: "#991b1b", padding: "2px 0" }}>↳ {e}</div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "Memory Leaks" && (
        <>
          <div style={s.note}>
            React memory leaks almost always come from effects that don't return a cleanup function.
          </div>
          {[
            {
              title: "setInterval without clearInterval",
              bad: `useEffect(() => {
  const id = setInterval(fetchData, 5000);
  // ❌ No cleanup → interval runs forever after unmount
}, []);`,
              good: `useEffect(() => {
  const id = setInterval(fetchData, 5000);
  return () => clearInterval(id);  // ✅ cleared on unmount
}, []);`,
            },
            {
              title: "Event listener without removeEventListener",
              bad: `useEffect(() => {
  window.addEventListener('resize', handler);
  // ❌ Listener survives component unmount
}, [handler]);`,
              good: `useEffect(() => {
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler); // ✅
}, [handler]);`,
            },
            {
              title: "Unbounded global Map / cache",
              bad: `// ❌ Cache grows without limit — never evicted
const cache = new Map<string, Data>();

function getUser(id: string) {
  if (!cache.has(id)) cache.set(id, fetchUser(id));
  return cache.get(id);
}`,
              good: `// ✅ LRU cache — bounded to N entries, auto-evicts oldest
const cache = new LRUCache<string, Data>(100);

function getUser(id: string) {
  if (!cache.has(id)) cache.set(id, fetchUser(id));
  return cache.get(id);
}`,
            },
          ].map(({ title, bad, good }) => (
            <div key={title} style={{ ...s.card, marginBottom: 12 }}>
              <strong style={{ fontSize: 12, color: "#334155" }}>{title}</strong>
              <div style={s.grid}>
                <div>
                  <div style={s.label("#dc2626")}>bad</div>
                  <div style={{ ...s.code, marginBottom: 0, fontSize: 11 }}>{bad}</div>
                </div>
                <div>
                  <div style={s.label("#059669")}>good</div>
                  <div style={{ ...s.code, marginBottom: 0, fontSize: 11 }}>{good}</div>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {tab === "Leak Patterns" && (
        <>
          <div style={s.note}>
            Diagnosing leaks: Chrome DevTools → Memory tab → Heap Snapshot. Look for "Detached" DOM nodes and unexpected retained objects.
          </div>
          {[
            {
              pattern: "Stale closure retaining large data",
              desc: "A useEffect closes over a large array at creation time. If the dep array is wrong, the old closure (and its data) stays alive.",
              fix: "Include all referenced values in the dep array. Use useRef for values that shouldn't re-trigger the effect.",
            },
            {
              pattern: "Detached DOM nodes",
              desc: "useRef holds a DOM node that was removed from the tree. The JS reference prevents the node from being GC'd.",
              fix: "Set ref.current = null in cleanup, or use a callback ref that nulls itself.",
            },
            {
              pattern: "Promise callbacks after unmount",
              desc: "fetch() or setTimeout resolves after a component unmounts and calls setState — causes 'Can't perform a React state update on an unmounted component' warning.",
              fix: "Use an AbortController to cancel pending fetches on unmount, or track a mounted flag in useEffect cleanup.",
            },
            {
              pattern: "Third-party library subscriptions",
              desc: "Libraries (WebSocket, EventEmitter, RxJS) require explicit unsubscription. Forgetting leaves the subscription (and its closure) alive.",
              fix: "Always return unsubscribe/dispose/disconnect from useEffect. Use useLayoutEffect for synchronous teardown.",
            },
          ].map(({ pattern, desc, fix }) => (
            <div key={pattern} style={s.card}>
              <div style={s.label("#7c3aed")}>{pattern}</div>
              <p style={{ fontSize: 12, color: "#475569", margin: "4px 0" }}>{desc}</p>
              <p style={{ fontSize: 12, color: "#166534", margin: 0 }}>✅ Fix: {fix}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

// ─── Demo 2: Browser Rendering Pipeline ──────────────────────────────────────

const RENDER_TABS = ["CRP Pipeline", "Layout Cost", "Layout Thrashing", "rAF"] as const;
type RenderTab = (typeof RENDER_TABS)[number];

const stages = [
  { name: "HTML", color: "#3b82f6", desc: "Raw bytes → characters → tokens → DOM nodes" },
  { name: "DOM", color: "#6366f1", desc: "Document Object Model — JS-accessible tree" },
  { name: "CSSOM", color: "#8b5cf6", desc: "CSS Object Model — computed styles for every selector" },
  { name: "Render Tree", color: "#a855f7", desc: "Visible nodes + computed styles (display:none excluded)" },
  { name: "Layout", color: "#d946ef", desc: "Exact size + position of every render tree node (reflow)" },
  { name: "Paint", color: "#ec4899", desc: "Fill pixels into layers (colors, text, shadows)" },
  { name: "Composite", color: "#f43f5e", desc: "GPU assembles layers in correct stacking order" },
];

const BrowserRenderingDemo: React.FC = () => {
  const [tab, setTab] = useState<RenderTab>("CRP Pipeline");
  const [activeStage, setActiveStage] = useState<number | null>(null);
  const [animActive, setAnimActive] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!animActive) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const loop = (ts: number) => {
      if (ts - lastTimeRef.current > 100) {
        setFrameCount(c => c + 1);
        lastTimeRef.current = ts;
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animActive]);

  const cssProps = [
    { prop: "transform", cost: "composite-only", color: "#059669", trigger: "GPU only — no layout, no paint" },
    { prop: "opacity", cost: "composite-only", color: "#059669", trigger: "GPU only — no layout, no paint" },
    { prop: "filter", cost: "composite-only", color: "#059669", trigger: "GPU only" },
    { prop: "color", cost: "paint", color: "#d97706", trigger: "Paint + Composite (no layout)" },
    { prop: "background-color", cost: "paint", color: "#d97706", trigger: "Paint + Composite" },
    { prop: "box-shadow", cost: "paint", color: "#d97706", trigger: "Paint + Composite" },
    { prop: "width", cost: "layout+paint", color: "#dc2626", trigger: "Layout + Paint + Composite (most expensive)" },
    { prop: "height", cost: "layout+paint", color: "#dc2626", trigger: "Layout + Paint + Composite" },
    { prop: "margin", cost: "layout+paint", color: "#dc2626", trigger: "Layout + Paint + Composite" },
    { prop: "font-size", cost: "layout+paint", color: "#dc2626", trigger: "Layout + Paint + Composite" },
  ];

  return (
    <div>
      <div style={s.tabs}>
        {RENDER_TABS.map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "CRP Pipeline" && (
        <>
          <div style={s.note}>
            Click each stage to learn what happens there. The browser must complete all 7 stages before pixels appear on screen.
          </div>
          <div style={{ display: "flex", gap: 2, marginBottom: 12, flexWrap: "wrap" }}>
            {stages.map((stage, i) => (
              <React.Fragment key={stage.name}>
                <button
                  onClick={() => setActiveStage(activeStage === i ? null : i)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 6,
                    border: activeStage === i ? `2px solid ${stage.color}` : "2px solid transparent",
                    background: stage.color,
                    color: "#fff",
                    cursor: "pointer",
                    fontFamily: "monospace",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {i + 1}. {stage.name}
                </button>
                {i < stages.length - 1 && (
                  <span style={{ display: "flex", alignItems: "center", color: "#94a3b8", fontSize: 16 }}>→</span>
                )}
              </React.Fragment>
            ))}
          </div>

          {activeStage !== null && (
            <div style={{ ...s.card, borderLeft: `4px solid ${stages[activeStage].color}` }}>
              <strong style={{ color: stages[activeStage].color }}>{stages[activeStage].name}</strong>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#475569" }}>{stages[activeStage].desc}</p>
            </div>
          )}

          <div style={s.card}>
            <strong style={{ fontSize: 12 }}>What "blocks" rendering</strong>
            <ul style={{ fontSize: 12, color: "#475569", marginTop: 6, paddingLeft: 16 }}>
              <li><code>&lt;script&gt;</code> without <code>defer</code> or <code>async</code> — blocks HTML parsing entirely</li>
              <li>Render-blocking CSS in <code>&lt;head&gt;</code> — CSSOM must be built before Render Tree</li>
              <li>Large synchronous JS on the main thread — blocks Layout and Paint</li>
              <li>Web fonts (FOIT/FOUT) — text invisible until font loads</li>
            </ul>
          </div>
        </>
      )}

      {tab === "Layout Cost" && (
        <>
          <div style={s.note}>
            Not all CSS changes are equal. Animating <code>transform</code> and <code>opacity</code> skips Layout and Paint entirely — pure GPU, 60fps.
          </div>
          <div style={{ marginBottom: 8 }}>
            {[
              { cost: "composite-only", color: "#059669", label: "Composite only (GPU)" },
              { cost: "paint", color: "#d97706", label: "Paint + Composite" },
              { cost: "layout+paint", color: "#dc2626", label: "Layout + Paint + Composite" },
            ].map(({ cost, color, label }) => (
              <div key={cost} style={s.row}>
                <span style={s.badge(color)}>{label}</span>
              </div>
            ))}
          </div>
          {cssProps.map(({ prop, color, trigger }) => (
            <div key={prop} style={{ ...s.row, marginBottom: 6 }}>
              <code style={{ minWidth: 160, color: "#6366f1", fontWeight: 700 }}>{prop}</code>
              <span style={{ ...s.badge(color), minWidth: 150 }}>{trigger.split(" —")[0]}</span>
              <span style={{ fontSize: 11, color: "#64748b" }}>{trigger.split("—")[1] ?? ""}</span>
            </div>
          ))}
          <div style={s.card}>
            <strong style={{ fontSize: 12 }}>Key rule for animations</strong>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#475569" }}>
              Animate <code>transform: translateX()</code> instead of <code>left/margin</code>.
              Animate <code>opacity</code> instead of <code>visibility</code>.
              Add <code>will-change: transform</code> to promote element to its own GPU layer before animation starts.
            </p>
          </div>
        </>
      )}

      {tab === "Layout Thrashing" && (
        <>
          <div style={s.note}>
            Layout thrashing happens when you <strong>read a layout property immediately after a write</strong>. The browser is forced to flush pending style recalculations and reflow synchronously — can drop to &lt;10fps.
          </div>
          <div style={s.grid}>
            <div style={{ ...s.card, borderTop: "3px solid #dc2626" }}>
              <div style={s.label("#dc2626")}>bad — interleaved read/write</div>
              <div style={{ ...s.code, marginBottom: 0, fontSize: 11 }}>
                {`// N forced reflows
elements.forEach(el => {
  const w = el.offsetWidth;   // READ → flush + reflow
  el.style.width = w + 'px';  // WRITE → invalidate
});`}
              </div>
            </div>
            <div style={{ ...s.card, borderTop: "3px solid #059669" }}>
              <div style={s.label("#059669")}>good — batch reads then writes</div>
              <div style={{ ...s.code, marginBottom: 0, fontSize: 11 }}>
                {`// 1 reflow at most
const widths = elements.map(el => el.offsetWidth); // all reads
elements.forEach((el, i) => {
  el.style.width = widths[i] + 'px';  // all writes
});`}
              </div>
            </div>
          </div>
          <div style={s.card}>
            <strong style={{ fontSize: 12 }}>Properties that force layout (reflow) when READ</strong>
            <div style={{ columnCount: 2, fontSize: 11, color: "#475569", marginTop: 6 }}>
              {[
                "offsetWidth / offsetHeight",
                "offsetTop / offsetLeft",
                "scrollWidth / scrollHeight",
                "scrollTop / scrollLeft",
                "clientWidth / clientHeight",
                "getBoundingClientRect()",
                "getComputedStyle()",
                "innerText (layout-dependent)",
              ].map(p => <div key={p}>• {p}</div>)}
            </div>
          </div>
          <div style={s.note}>
            Use <code>requestAnimationFrame</code> to defer DOM writes to the next frame — the browser guarantees a clean layout state at the start of each frame.
          </div>
        </>
      )}

      {tab === "rAF" && (
        <>
          <div style={s.note}>
            <code>requestAnimationFrame</code> schedules work to run just before the browser's next repaint, aligned to the display refresh rate (usually 60fps = every ~16.6ms).
          </div>
          <div style={{ ...s.card, textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#6366f1", marginBottom: 4 }}>
              {frameCount}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>frames fired (sampled every 100ms)</div>
            <button style={s.btn(animActive ? "#dc2626" : "#059669")} onClick={() => {
              setAnimActive(a => !a);
              if (animActive) setFrameCount(0);
            }}>
              {animActive ? "Stop rAF loop" : "Start rAF loop"}
            </button>
          </div>
          <div style={s.code}>
            {`// The correct animation loop pattern
function animate() {
  const loop = (timestamp: number) => {
    // All DOM reads + writes happen here, aligned to paint cycle
    update(timestamp);        // compute new positions
    draw();                   // apply to DOM
    requestAnimationFrame(loop);  // schedule next frame
  };
  requestAnimationFrame(loop);
}

// React hook wrapping rAF with cleanup
function useAnimationFrame(callback, active) {
  const rafId = useRef(0);
  const cb = useRef(callback);
  cb.current = callback;

  useEffect(() => {
    if (!active) return;
    const loop = (ts) => {
      cb.current(ts);
      rafId.current = requestAnimationFrame(loop);
    };
    rafId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId.current);  // cleanup!
  }, [active]);
}`}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Demo 3: Advanced Caching ─────────────────────────────────────────────────

const CACHE_TABS = ["Cache-Control", "SWR Pattern", "ETag", "CDN & Vary"] as const;
type CacheTab = (typeof CACHE_TABS)[number];

const AdvancedCachingDemo: React.FC = () => {
  const [tab, setCacheTab] = useState<CacheTab>("Cache-Control");
  const [swrStep, setSwrStep] = useState(0);

  const swrSteps = [
    {
      title: "1. Fresh response",
      browser: "Sends request to CDN",
      cdn: "Miss → fetches from origin → caches with max-age=60, SWR=3600",
      result: "Browser gets fresh data. Cache-Status: MISS",
    },
    {
      title: "2. Within max-age (0–60s)",
      browser: "Sends request to CDN",
      cdn: "HIT — max-age not expired. Returns cached response instantly.",
      result: "No origin request. TTFB ~1ms. Cache-Status: HIT",
    },
    {
      title: "3. Stale (60s–3660s)",
      browser: "Sends request to CDN",
      cdn: "Stale but within SWR window. Returns old data + triggers background revalidation to origin.",
      result: "User gets instant response. Origin refreshes cache. Cache-Status: STALE",
    },
    {
      title: "4. Revalidation complete",
      browser: "Next request",
      cdn: "HIT — fresh data from background revalidation. No stale content anymore.",
      result: "User gets fresh data without waiting. Cache-Status: HIT",
    },
    {
      title: "5. Beyond SWR window (3660s+)",
      browser: "Sends request",
      cdn: "MISS — entry expired. Must fetch synchronously from origin.",
      result: "Slower TTFB. Origin queried. Cache-Status: MISS",
    },
  ];

  return (
    <div>
      <div style={s.tabs}>
        {CACHE_TABS.map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setCacheTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "Cache-Control" && (
        <>
          <div style={s.note}>
            <code>Cache-Control</code> is the master knob for caching behaviour — used by browsers, CDNs, and reverse proxies.
          </div>
          {[
            {
              header: "no-store",
              color: "#dc2626",
              strategy: "Never cache",
              use: "Auth pages, POST responses, PII data",
              code: "Cache-Control: no-store",
            },
            {
              header: "no-cache",
              color: "#d97706",
              strategy: "Cache but always revalidate",
              use: "Frequently updated, but revalidation is cheap (304 saves bandwidth)",
              code: "Cache-Control: no-cache",
            },
            {
              header: "max-age=3600",
              color: "#0891b2",
              strategy: "Browser cache — 1 hour",
              use: "Semi-static assets (JSON configs, fonts)",
              code: "Cache-Control: max-age=3600",
            },
            {
              header: "s-maxage=86400",
              color: "#6366f1",
              strategy: "CDN cache — 24 hours",
              use: "Public API responses cached at CDN, bypassed by private=true",
              code: "Cache-Control: max-age=3600, s-maxage=86400",
            },
            {
              header: "stale-while-revalidate",
              color: "#7c3aed",
              strategy: "SWR — serve stale, refresh in background",
              use: "Blog posts, dashboards — fast TTFB + fresh data",
              code: "Cache-Control: max-age=60, stale-while-revalidate=3600",
            },
            {
              header: "immutable",
              color: "#059669",
              strategy: "Never revalidate (content-hashed assets)",
              use: "JS/CSS bundles with hash in filename (main.a3f9c.js)",
              code: "Cache-Control: max-age=31536000, immutable",
            },
          ].map(({ header, color, strategy, use, code }) => (
            <div key={header} style={s.card}>
              <div style={s.row}>
                <span style={s.badge(color)}>{strategy}</span>
                <code style={{ fontSize: 12, color: "#6366f1" }}>{header}</code>
              </div>
              <div style={{ ...s.code, marginBottom: 4, fontSize: 11 }}>{code}</div>
              <span style={{ fontSize: 11, color: "#64748b" }}>Use: {use}</span>
            </div>
          ))}
        </>
      )}

      {tab === "SWR Pattern" && (
        <>
          <div style={s.note}>
            Stale-While-Revalidate: serve cached (possibly stale) content immediately while refreshing in the background. Best of both worlds — fast TTFB + eventual freshness.
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {swrSteps.map((step, i) => (
              <button
                key={i}
                style={{
                  ...s.btn(swrStep === i ? "#6366f1" : "#e2e8f0"),
                  color: swrStep === i ? "#fff" : "#334155",
                }}
                onClick={() => setSwrStep(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div style={{ ...s.card, borderLeft: "4px solid #6366f1" }}>
            <strong style={{ fontSize: 13, color: "#6366f1" }}>{swrSteps[swrStep].title}</strong>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
              <div>
                <div style={s.label("#3b82f6")}>Browser</div>
                <p style={{ fontSize: 12, color: "#334155", margin: 0 }}>{swrSteps[swrStep].browser}</p>
              </div>
              <div>
                <div style={s.label("#7c3aed")}>CDN</div>
                <p style={{ fontSize: 12, color: "#334155", margin: 0 }}>{swrSteps[swrStep].cdn}</p>
              </div>
            </div>
            <div style={{ marginTop: 8, padding: "6px 10px", background: "#f0fdf4", borderRadius: 4, fontSize: 12, color: "#166534" }}>
              {swrSteps[swrStep].result}
            </div>
          </div>

          <div style={s.code}>
            {`// Next.js ISR = SWR at the framework level
// app/blog/[slug]/page.tsx
export const revalidate = 60;   // max-age=60
// Implicit: stale-while-revalidate — Next.js serves stale, refreshes in background

// TanStack Query = SWR in the browser
useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  staleTime: 60_000,          // "fresh" for 60s
  gcTime: 3_600_000,          // kept in memory for 1hr (= SWR window)
})`}
          </div>
        </>
      )}

      {tab === "ETag" && (
        <>
          <div style={s.note}>
            ETags enable <strong>conditional requests</strong>. When content hasn't changed, the server replies with 304 Not Modified — no body, just headers. Saves bandwidth.
          </div>
          <div style={s.code}>
            {`// First request
GET /api/posts HTTP/1.1

// Response — server includes ETag
HTTP/1.1 200 OK
ETag: "abc123"
Content-Type: application/json
Cache-Control: max-age=0, must-revalidate

[body: 50KB of JSON]

// Second request — browser includes ETag
GET /api/posts HTTP/1.1
If-None-Match: "abc123"

// Content unchanged → 304, no body transfer
HTTP/1.1 304 Not Modified
ETag: "abc123"

// Content changed → 200 with new ETag
HTTP/1.1 200 OK
ETag: "def456"    ← new hash

[body: updated JSON]`}
          </div>
          <div style={s.grid}>
            <div style={s.card}>
              <div style={s.label("#6366f1")}>Strong ETag</div>
              <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>
                Byte-for-byte identical content. <code>ETag: "abc123"</code><br />
                Most servers use this by default (MD5 of content).
              </p>
            </div>
            <div style={s.card}>
              <div style={s.label("#0891b2")}>Weak ETag</div>
              <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>
                Semantically equivalent (e.g. whitespace differences ok). <code>ETag: W/"abc123"</code><br />
                Used for compressed variants.
              </p>
            </div>
          </div>
        </>
      )}

      {tab === "CDN & Vary" && (
        <>
          <div style={s.note}>
            A CDN caches your response at PoPs (Points of Presence) worldwide. The <code>Vary</code> header tells the CDN which request headers affect the response — it must store separate variants per unique value.
          </div>
          <div style={s.code}>
            {`// Without Vary — one cache entry for all requests to /api/posts
GET /api/posts
Response: Cache-Control: s-maxage=3600
→ CDN caches once, same response for all visitors

// Vary: Accept-Language — different cache entry per language
GET /api/posts
Accept-Language: en-US
Response: Vary: Accept-Language, Cache-Control: s-maxage=3600
→ CDN stores separate en-US, es-ES, fr-FR variants

// Common Vary headers:
Vary: Accept-Encoding    → gzip vs brotli vs raw
Vary: Accept-Language    → localised content
Vary: Accept             → JSON vs XML
Vary: Cookie             → personalised (dangerous — disables CDN!)`}
          </div>
          <div style={s.card}>
            <strong style={{ fontSize: 12 }}>CDN caching tips</strong>
            <ul style={{ fontSize: 12, color: "#475569", marginTop: 6, paddingLeft: 16 }}>
              <li><code>Vary: Cookie</code> effectively disables CDN caching — avoid for public content</li>
              <li>Use <code>Cache-Control: private</code> for user-specific responses (CDN skips)</li>
              <li>Use <code>Cache-Control: s-maxage</code> to set CDN TTL separately from browser TTL</li>
              <li>Use surrogate keys / cache tags for on-demand purge (Fastly, Cloudflare)</li>
              <li>Immutable assets (hashed filenames) + <code>max-age=31536000, immutable</code> = never revalidate</li>
            </ul>
          </div>
          <div style={s.grid}>
            <div style={s.card}>
              <div style={s.label("#059669")}>Good for CDN caching</div>
              <ul style={{ fontSize: 11, color: "#475569", margin: "4px 0 0", paddingLeft: 14 }}>
                <li>Static HTML (SSG/ISR pages)</li>
                <li>API responses without user data</li>
                <li>JS/CSS/image assets (immutable)</li>
                <li>OpenGraph images</li>
              </ul>
            </div>
            <div style={s.card}>
              <div style={s.label("#dc2626")}>Bad for CDN caching</div>
              <ul style={{ fontSize: 11, color: "#475569", margin: "4px 0 0", paddingLeft: 14 }}>
                <li>Auth-gated pages (use private)</li>
                <li>User-specific API responses</li>
                <li>POST / mutation responses</li>
                <li>Real-time data (use SSE/WS)</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Main Explainer ───────────────────────────────────────────────────────────

const MAIN_TABS = ["Memory", "Browser Rendering", "Advanced Caching"] as const;
type MainTab = (typeof MAIN_TABS)[number];

export const PerformanceAtScaleExplainer: React.FC = () => {
  const [tab, setTab] = useState<MainTab>("Memory");

  return (
    <div style={s.container}>
      <h2 style={s.h2}>Expert — Performance at Scale</h2>
      <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
        Memory Optimization · Browser Rendering Pipeline · Advanced Caching (CDN, Edge)
      </p>

      <div style={s.tabs}>
        {MAIN_TABS.map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "Memory" && (
        <>
          <h3 style={s.h3}>Memory Optimization</h3>
          <MemoryDemo />
        </>
      )}

      {tab === "Browser Rendering" && (
        <>
          <h3 style={s.h3}>Browser Rendering Pipeline</h3>
          <BrowserRenderingDemo />
        </>
      )}

      {tab === "Advanced Caching" && (
        <>
          <h3 style={s.h3}>Advanced Caching — CDN, Edge, SWR</h3>
          <AdvancedCachingDemo />
        </>
      )}
    </div>
  );
};

export default PerformanceAtScaleExplainer;
