// TOPIC: Render Props
// LEVEL: Senior — Advanced Patterns #2
//
// ─── WHAT IS A RENDER PROP? ───────────────────────────────────────────────────
//
//   A component that accepts a FUNCTION as a prop (or as children).
//   The component handles the LOGIC; the caller decides what to RENDER.
//
//   // The component controls the "what" (mouse position, fetch status, etc.)
//   // The caller controls the "how it looks"
//
//   <MouseTracker render={({ x, y }) => (
//     <div>Cursor at {x}, {y}</div>
//   )} />
//
//   OR using children-as-function (more common):
//
//   <MouseTracker>
//     {({ x, y }) => <div>Cursor at {x}, {y}</div>}
//   </MouseTracker>
//
// ─── WHY USE RENDER PROPS? ────────────────────────────────────────────────────
//
//   BEFORE render props (pre-2019), sharing stateful logic required either:
//   - Copying the logic into every component (duplication)
//   - HOCs (wrapping, which hides where props come from)
//
//   Render props make the data flow EXPLICIT:
//   - You can see exactly what data the component exposes
//   - No magic prop injection (unlike HOCs)
//   - Caller chooses the UI — component stays headless
//
// ─── RENDER PROPS vs CUSTOM HOOKS ────────────────────────────────────────────
//
//   Today, custom hooks are the primary way to share logic in React.
//   Render props are still valid when:
//
//   ✓ You need to render in a specific position in the tree
//     (e.g. a Portal target, a drag-and-drop zone)
//   ✓ The component manages a DOM node directly
//     (resize observer, intersection observer tied to a ref)
//   ✓ Third-party libraries expose render props (Formik, react-table)
//   ✓ You need to support React class components
//
//   Custom hooks are simpler for pure logic sharing (fetch, timer, etc.)
//
// ─── CHILDREN AS FUNCTION ─────────────────────────────────────────────────────
//
//   Both patterns work — "children as function" is more common:
//
//   // Named render prop
//   <DataLoader render={(data) => <Table data={data} />} />
//
//   // Children as function (same thing, cleaner JSX)
//   <DataLoader>
//     {(data) => <Table data={data} />}
//   </DataLoader>
//
// ─── THE INLINE FUNCTION PERFORMANCE TRAP ─────────────────────────────────────
//
//   <MouseTracker render={() => <HeavyChild />} />
//
//   If MouseTracker re-renders (e.g. on every mouse move), it creates a new
//   function reference each time → HeavyChild re-renders even if wrapped in memo.
//
//   Fix: define the render function OUTSIDE or wrap in useCallback.

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
  memo,
} from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 1 — Mouse Tracker
// ═══════════════════════════════════════════════════════════════════════════════

interface MousePosition {
  x: number;
  y: number;
  isInside: boolean;
}

interface MouseTrackerProps {
  children: (pos: MousePosition) => ReactNode;
}

const MouseTracker: React.FC<MouseTrackerProps> = ({ children }) => {
  const [pos, setPos] = useState<MousePosition>({ x: 0, y: 0, isInside: false });
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    setPos({
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top),
      isInside: true,
    });
  }, []);

  const handleLeave = useCallback(() => {
    setPos(prev => ({ ...prev, isInside: false }));
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        position: "relative",
        height: 180,
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        borderRadius: 10,
        overflow: "hidden",
        cursor: "crosshair",
        userSelect: "none",
      }}
    >
      {/* Grid lines */}
      <svg style={{ position: "absolute", inset: 0, opacity: 0.1 }} width="100%" height="100%">
        {Array.from({ length: 10 }, (_, i) => (
          <line key={`v${i}`} x1={`${i * 10}%`} y1="0" x2={`${i * 10}%`} y2="100%" stroke="#94a3b8" strokeWidth="1" />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={`${i * 20}%`} x2="100%" y2={`${i * 20}%`} stroke="#94a3b8" strokeWidth="1" />
        ))}
      </svg>
      {/* Caller decides what renders — MouseTracker only provides the position */}
      {children(pos)}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 2 — Data Fetcher (headless fetch component)
// ═══════════════════════════════════════════════════════════════════════════════

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface DataFetcherProps<T> {
  url: string;
  initialData?: T;
  children: (state: FetchState<T>) => ReactNode;
}

function DataFetcher<T>({ url, initialData = null as unknown as T, children }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(url)
      .then(r => r.json())
      .then(json => { if (!cancelled) { setData(json); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });

    return () => { cancelled = true; };
  }, [url, tick]);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  return <>{children({ data, loading, error, refetch })}</>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 3 — Toggle (simple boolean logic)
// ═══════════════════════════════════════════════════════════════════════════════

interface ToggleState {
  on: boolean;
  toggle: () => void;
  setOn: (v: boolean) => void;
}

interface ToggleProps {
  initial?: boolean;
  children: (state: ToggleState) => ReactNode;
}

const Toggle: React.FC<ToggleProps> = ({ initial = false, children }) => {
  const [on, setOnState] = useState(initial);
  const toggle = useCallback(() => setOnState(v => !v), []);
  const setOn = useCallback((v: boolean) => setOnState(v), []);
  return <>{children({ on, toggle, setOn })}</>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// EXAMPLE 4 — Intersection Observer (needs DOM ref — good render prop use case)
// ═══════════════════════════════════════════════════════════════════════════════

interface InViewState {
  inView: boolean;
  ratio: number;
}

interface InViewProps {
  threshold?: number;
  children: (state: InViewState & { ref: React.RefObject<HTMLDivElement> }) => ReactNode;
}

const InView: React.FC<InViewProps> = ({ threshold = 0.1, children }) => {
  const [state, setState] = useState<InViewState>({ inView: false, ratio: 0 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setState({ inView: entry.isIntersecting, ratio: Math.round(entry.intersectionRatio * 100) }),
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return <>{children({ ...state, ref })}</>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Mouse tracker demos ───────────────────────────────────────────────────────

const CrosshairRenderer: React.FC<MousePosition> = ({ x, y, isInside }) => (
  <>
    {isInside && (
      <>
        {/* Crosshair lines */}
        <div style={{
          position: "absolute", left: x, top: 0, bottom: 0,
          width: 1, background: "#3b82f6", opacity: 0.6,
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: y, left: 0, right: 0,
          height: 1, background: "#3b82f6", opacity: 0.6,
          pointerEvents: "none",
        }} />
        {/* Dot */}
        <div style={{
          position: "absolute",
          left: x - 5, top: y - 5,
          width: 10, height: 10,
          borderRadius: "50%",
          background: "#3b82f6",
          boxShadow: "0 0 10px #3b82f6",
          pointerEvents: "none",
          transform: "translate(0,0)",
        }} />
      </>
    )}
    {/* Readout — caller decides to show coordinates */}
    <div style={{
      position: "absolute", bottom: 10, right: 12,
      fontSize: 12, fontFamily: "monospace",
      color: isInside ? "#7dd3fc" : "#475569",
    }}>
      {isInside ? `x: ${x}  y: ${y}` : "Move cursor here"}
    </div>
  </>
);

// A DIFFERENT render — same MouseTracker, totally different output
const RadarRenderer: React.FC<MousePosition> = ({ x, y, isInside }) => (
  <>
    <div style={{
      position: "absolute", bottom: 10, left: "50%",
      transform: "translateX(-50%)",
      fontSize: 12, color: "#94a3b8", fontFamily: "monospace",
    }}>
      {isInside ? "tracking" : "awaiting signal…"}
    </div>
    {isInside && (
      <div style={{
        position: "absolute",
        left: x - 20, top: y - 20,
        width: 40, height: 40,
        borderRadius: "50%",
        border: "2px solid #22c55e",
        boxShadow: "0 0 16px #22c55e66",
        pointerEvents: "none",
        animation: "cl-ping 1s ease-out infinite",
      }}>
        <div style={{
          position: "absolute", inset: 8,
          borderRadius: "50%",
          background: "#22c55e",
        }} />
      </div>
    )}
  </>
);

// ── Toggle demos ──────────────────────────────────────────────────────────────

const SwitchUI: React.FC<{ on: boolean; toggle: () => void; label: string }> = ({ on, toggle, label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <button
      onClick={toggle}
      aria-checked={on}
      role="switch"
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: on ? "#22c55e" : "#cbd5e1",
        border: "none", cursor: "pointer", position: "relative",
        transition: "background 0.2s",
        padding: 0,
      }}
    >
      <div style={{
        position: "absolute", top: 3,
        left: on ? 23 : 3,
        width: 18, height: 18, borderRadius: "50%",
        background: "#fff",
        transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
    <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
    <span style={{
      fontSize: 11, padding: "2px 8px", borderRadius: 20,
      background: on ? "#d1fae5" : "#f1f5f9",
      color: on ? "#065f46" : "#94a3b8",
      fontWeight: 600,
    }}>{on ? "ON" : "OFF"}</span>
  </div>
);

// ── InView demo ───────────────────────────────────────────────────────────────

const InViewBox: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <InView threshold={0.3}>
    {({ inView, ratio, ref }) => (
      <div
        ref={ref}
        style={{
          height: 100, borderRadius: 10,
          border: `2px solid ${inView ? color : "#e2e8f0"}`,
          background: inView ? `${color}18` : "#f8fafc",
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 12, transition: "all 0.3s",
          marginBottom: 10,
        }}
      >
        <div style={{
          width: 12, height: 12, borderRadius: "50%",
          background: inView ? color : "#cbd5e1",
          transition: "background 0.3s",
        }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b" }}>{label}</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            {inView ? `In view — ${ratio}% visible` : "Scrolled out of view"}
          </div>
        </div>
      </div>
    )}
  </InView>
);

// ── Fetch demo ────────────────────────────────────────────────────────────────

interface Post { id: number; title: string; body: string; }

const PostCard: React.FC<{ post: Post }> = ({ post }) => (
  <div style={{
    padding: "12px 14px", border: "1px solid #e2e8f0",
    borderRadius: 8, background: "#fff", marginBottom: 8,
  }}>
    <div style={{ fontWeight: 600, fontSize: 13, color: "#1e293b", marginBottom: 4 }}>
      #{post.id} — {post.title}
    </div>
    <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
      {post.body.slice(0, 80)}…
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// CONCEPTS + HOW IT WORKS PANELS
// ═══════════════════════════════════════════════════════════════════════════════

const ComparisonPanel: React.FC = () => (
  <div style={{
    background: "#fff", border: "1px solid #e2e8f0",
    borderRadius: 12, padding: 20,
  }}>
    <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
      Render Props vs Custom Hooks
    </div>
    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
      Both share logic. Choose based on whether you need a DOM node or render position.
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "#f59e0b",
          textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
        }}>Render Props — good when</div>
        {[
          "Component manages a DOM ref directly (IntersectionObserver, drag-drop)",
          "You need to control render position in the tree (Portal target)",
          "Supporting class components",
          "Third-party lib exposes render props (Formik, react-table)",
        ].map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <span style={{ color: "#f59e0b" }}>▸</span>
            <span style={{ fontSize: 12, color: "#475569" }}>{p}</span>
          </div>
        ))}
      </div>
      <div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "#3b82f6",
          textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
        }}>Custom Hooks — better when</div>
        {[
          "Sharing pure stateful logic (fetch, timer, form state)",
          "No render output needed from the shared logic",
          "Avoiding extra DOM nesting from wrapper components",
          "Simpler composition — just call the hook anywhere",
        ].map((p, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <span style={{ color: "#3b82f6" }}>▸</span>
            <span style={{ fontSize: 12, color: "#475569" }}>{p}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CodePanel: React.FC = () => (
  <div style={{
    background: "#0f172a", borderRadius: 12, padding: 20,
    border: "1px solid #1e293b",
  }}>
    <div style={{ fontWeight: 700, fontSize: 14, color: "#94a3b8", marginBottom: 12 }}>
      Pattern skeleton — render prop component
    </div>
    <pre style={{
      margin: 0, fontSize: 11, lineHeight: 1.75,
      color: "#e2e8f0", fontFamily: "monospace", overflow: "auto",
    }}>{`// Component handles LOGIC, caller decides UI
interface MouseTrackerProps {
  children: (pos: { x: number; y: number }) => ReactNode;
  // or: render: (pos: ...) => ReactNode;  ← named render prop
}

const MouseTracker = ({ children }: MouseTrackerProps) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  return (
    <div onMouseMove={e => setPos({ x: e.clientX, y: e.clientY })}>
      {children(pos)}   {/* ← call the function, pass the data */}
    </div>
  );
};

// ── Usage 1: crosshair ────────────────────────────────
<MouseTracker>
  {({ x, y }) => (
    <div style={{ position: "absolute", left: x, top: y }}>
      📍
    </div>
  )}
</MouseTracker>

// ── Usage 2: radar — same component, different render ─
<MouseTracker>
  {({ x, y }) => <RadarDot x={x} y={y} />}
</MouseTracker>

// ── Performance trap ──────────────────────────────────
// Inline function = new ref on every re-render
// → memo'd children always re-render
<MouseTracker>
  {(pos) => <MemoChild pos={pos} />}   {/* ✓ stable if defined outside */}
</MouseTracker>

// Define outside the parent component or wrap in useCallback
const renderFn = useCallback((pos) => <MemoChild pos={pos} />, []);
<MouseTracker>{renderFn}</MouseTracker>`}
    </pre>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

const RenderProps: React.FC = () => {
  const [tab, setTab] = useState<"concepts" | "demo">("concepts");
  const [fetchId, setFetchId] = useState(1);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 860, margin: "0 auto", padding: 24 }}>
      <style>{`
        @keyframes cl-ping {
          0%   { transform: scale(1); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{
            background: "#7c3aed", color: "#fff", fontSize: 11,
            fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            textTransform: "uppercase", letterSpacing: 1,
          }}>Senior — Advanced Patterns #2</span>
          <span style={{
            background: "#fff7ed", color: "#c2410c", fontSize: 11,
            fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            border: "1px solid #fed7aa",
          }}>children as function</span>
        </div>
        <h2 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, color: "#0f172a" }}>
          Render Props
        </h2>
        <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.6 }}>
          Pass a function as <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>children</code> (or a named prop).
          The component handles the <strong>logic</strong>; the caller decides what to <strong>render</strong>.
          Four live examples: MouseTracker, DataFetcher, Toggle, IntersectionObserver.
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
              color: tab === t ? "#7c3aed" : "#64748b",
              borderBottom: `3px solid ${tab === t ? "#7c3aed" : "transparent"}`,
              marginBottom: -2, textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "concepts" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Key concepts cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              {
                icon: "🔀",
                title: "Invert control",
                body: "Component owns logic + state. Caller owns the UI. You can render the same logic 10 different ways without changing the component.",
              },
              {
                icon: "👁",
                title: "Explicit data flow",
                body: "The function signature shows exactly what data is available. No mystery props injected from above (unlike HOCs).",
              },
              {
                icon: "⚡",
                title: "Performance trap",
                body: "Inline render functions create a new reference on every parent re-render. Memo'd children still re-render. Fix: define outside or useCallback.",
              },
            ].map(c => (
              <div key={c.title} style={{
                border: "1px solid #fed7aa", borderRadius: 10,
                padding: 16, background: "#fff7ed",
              }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{c.body}</div>
              </div>
            ))}
          </div>
          <ComparisonPanel />
          <CodePanel />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* MouseTracker — two renders */}
          <div style={{
            background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 12, padding: 20,
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
              MouseTracker — same component, two different renders
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
              The component tracks position. The caller decides what to draw at that position.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "#3b82f6",
                  textTransform: "uppercase", letterSpacing: 1, marginBottom: 6,
                }}>Render 1 — Crosshair</div>
                <MouseTracker>
                  {(pos) => <CrosshairRenderer {...pos} />}
                </MouseTracker>
              </div>
              <div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "#22c55e",
                  textTransform: "uppercase", letterSpacing: 1, marginBottom: 6,
                }}>Render 2 — Radar dot</div>
                <MouseTracker>
                  {(pos) => <RadarRenderer {...pos} />}
                </MouseTracker>
              </div>
            </div>
            <div style={{
              marginTop: 12, padding: "10px 14px",
              background: "#eff6ff", borderRadius: 8,
              border: "1px solid #bfdbfe",
              fontFamily: "monospace", fontSize: 11, color: "#1e40af",
              lineHeight: 1.7,
            }}>
              {"<MouseTracker>{(pos) => <CrosshairRenderer {...pos} />}</MouseTracker>\n<MouseTracker>{(pos) => <RadarRenderer {...pos} />}</MouseTracker>"}
            </div>
          </div>

          {/* Toggle — two UIs */}
          <div style={{
            background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 12, padding: 20,
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
              Toggle — one logic component, multiple UIs
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
              Toggle manages boolean state. Callers render it as a switch, a button, or anything else.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Toggle initial={false}>
                {({ on, toggle }) => (
                  <SwitchUI on={on} toggle={toggle} label="Dark mode" />
                )}
              </Toggle>
              <Toggle initial={true}>
                {({ on, toggle }) => (
                  <SwitchUI on={on} toggle={toggle} label="Email notifications" />
                )}
              </Toggle>
              <Toggle initial={false}>
                {({ on, toggle, setOn }) => (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      onClick={toggle}
                      style={{
                        padding: "7px 16px", borderRadius: 8,
                        background: on ? "#ef4444" : "#22c55e",
                        color: "#fff", border: "none", cursor: "pointer",
                        fontWeight: 600, fontSize: 13,
                      }}
                    >
                      {on ? "Stop recording" : "Start recording"}
                    </button>
                    {on && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#ef4444" }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: "#ef4444",
                          animation: "cl-ping 1s ease-out infinite",
                        }} />
                        Recording…
                      </div>
                    )}
                  </div>
                )}
              </Toggle>
            </div>
            <div style={{
              marginTop: 14, padding: "10px 14px",
              background: "#eff6ff", borderRadius: 8,
              border: "1px solid #bfdbfe",
              fontFamily: "monospace", fontSize: 11, color: "#1e40af",
              lineHeight: 1.7,
            }}>
              {"// Same <Toggle> — different UI every time\n<Toggle>{({ on, toggle }) => <SwitchUI ... />}</Toggle>\n<Toggle>{({ on, toggle }) => <button>{on ? 'Stop' : 'Start'}</button>}</Toggle>"}
            </div>
          </div>

          {/* DataFetcher */}
          <div style={{
            background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 12, padding: 20,
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
              DataFetcher — headless fetch component
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
              Manages fetch lifecycle (loading, error, data, refetch). Caller decides the UI for each state.
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {[1, 2, 3].map(id => (
                <button
                  key={id}
                  onClick={() => setFetchId(id)}
                  style={{
                    padding: "5px 14px", borderRadius: 8,
                    fontWeight: 600, fontSize: 12, cursor: "pointer",
                    border: "2px solid",
                    borderColor: fetchId === id ? "#7c3aed" : "#e2e8f0",
                    background: fetchId === id ? "#f5f3ff" : "#f8fafc",
                    color: fetchId === id ? "#6d28d9" : "#64748b",
                  }}
                >
                  Post #{id}
                </button>
              ))}
            </div>
            <DataFetcher<Post> url={`https://jsonplaceholder.typicode.com/posts/${fetchId}`}>
              {({ data, loading, error, refetch }) => (
                <div>
                  {loading && (
                    <div style={{
                      padding: 20, textAlign: "center",
                      color: "#94a3b8", fontSize: 13,
                    }}>
                      Loading post #{fetchId}…
                    </div>
                  )}
                  {error && (
                    <div style={{
                      padding: 14, borderRadius: 8,
                      background: "#fef2f2", border: "1px solid #fecaca",
                      color: "#dc2626", fontSize: 13,
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      Error: {error}
                      <button
                        onClick={refetch}
                        style={{
                          padding: "4px 12px", borderRadius: 6,
                          background: "#dc2626", color: "#fff",
                          border: "none", cursor: "pointer", fontSize: 12,
                        }}
                      >Retry</button>
                    </div>
                  )}
                  {!loading && !error && data && <PostCard post={data} />}
                  <div style={{
                    marginTop: 10, padding: "8px 12px",
                    background: "#f8fafc", borderRadius: 6,
                    fontFamily: "monospace", fontSize: 11, color: "#64748b",
                  }}>
                    {`<DataFetcher url="/posts/${fetchId}">\n  {({ data, loading, error }) => /* caller decides the UI */}\n</DataFetcher>`}
                  </div>
                </div>
              )}
            </DataFetcher>
          </div>

          {/* InView */}
          <div style={{
            background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 12, padding: 20,
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
              InView — Intersection Observer
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>
              Manages a DOM ref + IntersectionObserver. Caller uses the ref and reacts to <code style={{ background: "#f1f5f9", padding: "1px 4px", borderRadius: 3 }}>inView</code> however they want.
            </div>
            <div style={{ fontSize: 12, color: "#f59e0b", marginBottom: 14 }}>
              Scroll down in this section to trigger the boxes.
            </div>
            <div style={{ height: 260, overflowY: "auto", padding: "4px 2px" }}>
              <div style={{ height: 180, display: "flex", alignItems: "center",
                justifyContent: "center", color: "#94a3b8", fontSize: 13,
                borderBottom: "1px dashed #e2e8f0", marginBottom: 10,
              }}>
                ↓ Scroll down to reveal boxes ↓
              </div>
              <InViewBox label="Box A" color="#3b82f6" />
              <InViewBox label="Box B" color="#22c55e" />
              <InViewBox label="Box C" color="#f59e0b" />
              <InViewBox label="Box D" color="#7c3aed" />
            </div>
            <div style={{
              marginTop: 12, padding: "10px 14px",
              background: "#eff6ff", borderRadius: 8,
              border: "1px solid #bfdbfe",
              fontFamily: "monospace", fontSize: 11, color: "#1e40af",
              lineHeight: 1.7,
            }}>
              {"<InView>\n  {({ inView, ratio, ref }) =>\n    <div ref={ref} style={{ background: inView ? 'green' : 'grey' }}>\n      {inView ? `Visible — ${ratio}%` : 'Hidden'}\n    </div>\n  }\n</InView>"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenderProps;
