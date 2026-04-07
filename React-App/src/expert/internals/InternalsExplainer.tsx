// Visual explainer for Expert — React Internals
// Covers Reconciliation, Fiber, Concurrent Rendering, React Compiler

import React, { useState, useTransition, useDeferredValue, useMemo, useCallback, memo, startTransition } from "react";

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const card = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, ...extra,
});
const code = (color = "#86efac"): React.CSSProperties => ({
  background: "#0f172a", borderRadius: 8, padding: 12,
  fontFamily: "monospace", fontSize: 11, color, lineHeight: 1.75,
  whiteSpace: "pre", overflowX: "auto",
});
const pill = (active: boolean, activeColor = "#3b82f6"): React.CSSProperties => ({
  padding: "6px 14px", borderRadius: 8, fontWeight: 600, fontSize: 12,
  cursor: "pointer", border: "2px solid",
  borderColor: active ? activeColor : "#e2e8f0",
  background: active ? activeColor + "22" : "#f8fafc",
  color: active ? activeColor : "#64748b",
});
const tag = (bg: string, color: string): React.CSSProperties => ({
  fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
  background: bg, color, textTransform: "uppercase" as const, letterSpacing: 0.5,
});

// ─── DEMO 1 — Reconciliation visualiser ──────────────────────────────────────

const ReconciliationDemo: React.FC = () => {
  const [view, setView] = useState<"type" | "key" | "index">("type");

  const scenarios = {
    type: {
      title: "Element type change → remount",
      before: `// Before render
<div className="box">Hello</div>`,
      after: `// After render (type changed: div → span)
<span className="box">Hello</span>`,
      result: "React DESTROYS the div fiber and all children.\nCreates a new span fiber from scratch.\nAll state inside is lost.",
      resultColor: "#dc2626",
      resultBg: "#fef2f2",
      explanation: "React compares element types first. div ≠ span → full remount regardless of content similarity.",
    },
    key: {
      title: "Key change → remount",
      before: `// Before
<TextInput key="email" label="Email" />`,
      after: `// After (key changed)
<TextInput key="username" label="Username" />`,
      result: "React treats key='email' and key='username'\nas completely different elements.\nOld fiber torn down, new one created. State reset.",
      resultColor: "#d97706",
      resultBg: "#fffbeb",
      explanation: "Key is the primary identity signal. Changing it forces a remount — useful for resetting form state.",
    },
    index: {
      title: "Stable key vs index key",
      before: `// ❌ Index key — state belongs to position
items.map((item, i) => <Row key={i} item={item} />)

// ✅ Stable key — state follows the item
items.map(item => <Row key={item.id} item={item} />)`,
      after: `// When list prepends "Avocado":
// Index key: Avocado gets Apple's state (position 0)
// Stable key: Apple keeps its state (id stayed same)`,
      result: "With index keys: state belongs to the position.\nWith stable keys: state follows the item.\nAlways use a stable unique id as key.",
      resultColor: "#16a34a",
      resultBg: "#f0fdf4",
      explanation: "React matches fibers to elements by key. Without a key, it falls back to position — wrong when list reorders.",
    },
  };

  const s = scenarios[view];

  return (
    <div style={card()}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        Reconciliation — How React diffs the tree
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        O(n) heuristic: compare same-level, same-type elements. Keys are identity across positions.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button style={pill(view === "type", "#dc2626")} onClick={() => setView("type")}>Type change</button>
        <button style={pill(view === "key", "#d97706")} onClick={() => setView("key")}>Key change</button>
        <button style={pill(view === "index", "#16a34a")} onClick={() => setView("index")}>Key vs Index</button>
      </div>

      <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 10 }}>{s.title}</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 6 }}>Before</div>
          <div style={code("#93c5fd")}>{s.before}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 6 }}>After</div>
          <div style={code("#fca5a5")}>{s.after}</div>
        </div>
      </div>

      <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 10, background: s.resultBg, border: `1px solid ${s.resultColor}44` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: s.resultColor, marginBottom: 4, textTransform: "uppercase" as const }}>Result</div>
        <div style={{ fontSize: 12, color: "#374151", whiteSpace: "pre-line" }}>{s.result}</div>
      </div>

      <div style={{ padding: "8px 12px", borderRadius: 8, background: "#f0f9ff", border: "1px solid #bae6fd", fontSize: 12, color: "#0369a1" }}>
        <strong>Why:</strong> {s.explanation}
      </div>
    </div>
  );
};

// ─── DEMO 2 — Fiber tree visualiser ──────────────────────────────────────────

const FiberDemo: React.FC = () => {
  const [showFields, setShowFields] = useState(false);

  const fiberCode = `// A simplified Fiber node structure
interface Fiber {
  // Identity
  type: string | Function;     // 'div', MyComponent, etc.
  key: string | null;

  // Tree navigation (linked list, not recursion)
  child: Fiber | null;         // first child
  sibling: Fiber | null;       // next sibling
  return: Fiber | null;        // parent

  // Props & state
  pendingProps: Props;          // props for this render
  memoizedProps: Props;         // props from last commit
  memoizedState: Hook | null;   // linked list of hook states

  // Work
  lanes: Lanes;                 // priority bitmask
  flags: Flags;                 // Placement | Update | Deletion | ...

  // Alternate — double buffering
  alternate: Fiber | null;      // previous render's fiber (WIP ↔ current)
}`;

  const twoPhaseCode = `// Phase 1: Render (interruptible, can restart)
function performUnitOfWork(fiber) {
  // 1. Call the component function / render
  const nextChildren = renderWithHooks(fiber);
  // 2. Reconcile children (diff with previous fiber tree)
  reconcileChildren(fiber, nextChildren);
  // 3. Return next work unit (child, sibling, or parent)
  return fiber.child ?? fiber.sibling ?? fiber.return;
}

// Phase 2: Commit (synchronous, never interrupted)
function commitRoot(root) {
  // Before mutation: snapshot, getSnapshotBeforeUpdate
  commitBeforeMutationEffects(root);
  // Mutation: DOM insertions, updates, deletions
  commitMutationEffects(root);
  // Layout: useLayoutEffect, componentDidMount/Update
  commitLayoutEffects(root);
  // Passive (async): useEffect fires later
  schedulePassiveEffects();
}`;

  const doubleBufferCode = `// React maintains TWO fiber trees:
//   current  — the tree currently on screen
//   workInProgress — the tree being built

// When render starts:
workInProgress = createWorkInProgress(current);

// When commit happens:
root.current = workInProgress; // swap!
// The old current becomes the next workInProgress

// This is why:
// ✅ You can interrupt render without corrupting the screen
// ✅ React can throw away a render and restart
// ✅ The committed tree is always consistent`;

  const tabs = [
    { id: "fiber", label: "Fiber node" },
    { id: "two-phase", label: "Two-phase commit" },
    { id: "double", label: "Double buffering" },
  ] as const;

  const [tab, setTab] = useState<typeof tabs[number]["id"]>("fiber");

  return (
    <div style={card()}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        Fiber Architecture
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        Each React element has a fiber node. Fibers form a linked list — no recursion,
        so rendering can pause and resume.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {tabs.map(t => (
          <button key={t.id} style={pill(tab === t.id)} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "fiber" && <div style={code()}>{fiberCode}</div>}
      {tab === "two-phase" && <div style={code()}>{twoPhaseCode}</div>}
      {tab === "double" && <div style={code()}>{doubleBufferCode}</div>}

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {[
          { icon: "🔗", title: "Linked list", desc: "child → sibling → return. No call stack recursion — can pause." },
          { icon: "⚡", title: "Two-phase", desc: "Render (interruptible) then Commit (sync). DOM only touched in commit." },
          { icon: "🪞", title: "Double buffer", desc: "workInProgress built in memory. Swap atomically on commit." },
        ].map(f => (
          <div key={f.title} style={card({ padding: 12, background: "#f8fafc" })}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#1e293b", marginBottom: 3 }}>{f.title}</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── DEMO 3 — Concurrent rendering live ──────────────────────────────────────

const ITEMS = Array.from({ length: 2000 }, (_, i) => `Item ${i + 1}`);

const ConcurrentDemo: React.FC = () => {
  const [query, setQuery] = useState("");
  const [isPending, startTrans] = useTransition();
  const deferredQuery = useDeferredValue(query);
  const [mode, setMode] = useState<"blocking" | "transition" | "deferred">("blocking");

  const filtered = useMemo(
    () => ITEMS.filter(i => deferredQuery ? i.toLowerCase().includes(deferredQuery.toLowerCase()) : true),
    [deferredQuery]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (mode === "blocking") {
      setQuery(v);
    } else if (mode === "transition") {
      startTrans(() => setQuery(v));
    } else {
      setQuery(v);
    }
  };

  const lanesCode = `// Concurrent priority lanes (simplified)
const SyncLane         = 0b0000001; // click, input — highest
const InputContinuousLane = 0b0000100; // mousemove, scroll
const DefaultLane      = 0b0010000; // setTimeout, network
const TransitionLane   = 0b0100000; // startTransition
const OffscreenLane    = 0b1000000; // Suspense hidden — lowest

// React schedules based on lane priority:
// SyncLane → runs immediately (no yield)
// TransitionLane → yields between items, checks for higher-priority work`;

  return (
    <div style={card()}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        Concurrent Rendering — Live Demo
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        Filter 2,000 items. In "blocking" mode the input lags. In "transition/deferred" mode it stays responsive.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {(["blocking", "transition", "deferred"] as const).map(m => (
          <button key={m} style={pill(mode === m, m === "blocking" ? "#dc2626" : "#16a34a")} onClick={() => { setMode(m); setQuery(""); }}>
            {m}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <input
          value={query}
          onChange={handleChange}
          placeholder="Type to filter 2,000 items…"
          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, outline: "none" }}
        />
        {isPending && <span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>⏳ pending</span>}
        {mode === "deferred" && query !== deferredQuery && (
          <span style={{ fontSize: 12, color: "#d97706", fontWeight: 600 }}>⏳ stale</span>
        )}
      </div>

      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
        Showing {filtered.length.toLocaleString()} of {ITEMS.length.toLocaleString()} items
      </div>

      <div style={{ height: 160, overflowY: "auto", border: "1px solid #f1f5f9", borderRadius: 8, padding: "4px 8px" }}>
        {filtered.slice(0, 50).map(item => (
          <div key={item} style={{ padding: "2px 0", fontSize: 12, color: "#374151", borderBottom: "1px solid #f8fafc" }}>
            {item}
          </div>
        ))}
        {filtered.length > 50 && (
          <div style={{ padding: "4px 0", fontSize: 11, color: "#94a3b8" }}>
            … {(filtered.length - 50).toLocaleString()} more
          </div>
        )}
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8 }}>
          Priority lanes
        </div>
        <div style={code()}>{lanesCode}</div>
      </div>
    </div>
  );
};

// ─── DEMO 4 — React Compiler rules ───────────────────────────────────────────

const CompilerDemo: React.FC = () => {
  const [tab, setTab] = useState<"what" | "rules" | "before-after">("what");

  const whatCode = `// React Compiler (React Forget) — what it does:
//
// You write this:
function TodoItem({ todo, onToggle }) {
  return (
    <li className={todo.done ? "done" : ""} onClick={() => onToggle(todo.id)}>
      {todo.text}
    </li>
  );
}

// Compiler outputs something like this (conceptually):
function TodoItem({ todo, onToggle }) {
  const t0 = useMemo(() => todo.done ? "done" : "", [todo.done]);
  const t1 = useCallback(() => onToggle(todo.id), [onToggle, todo.id]);
  const t2 = useMemo(() => <li className={t0} onClick={t1}>{todo.text}</li>, [t0, t1, todo.text]);
  return t2;
}
// You don't write any of that. The compiler adds it automatically.`;

  const rulesCode = `// ✅ Rules for compiler compatibility:

// 1. Components must be PURE — same props → same output
const Pure = ({ name }) => <div>Hello {name}</div>; // ✅

// 2. No side effects during render
const Bad = ({ items }) => {
  cache.clear(); // ❌ side effect during render
  return <ul>{items.map(...)}</ul>;
};

// 3. No mutation of props or state
const Mutating = ({ data }) => {
  data.items.push(newItem); // ❌ mutation — use spread/map instead
  return <List data={data} />;
};

// 4. Hooks at top level — no conditions or loops
const Conditional = ({ show }) => {
  if (show) {
    const [x] = useState(0); // ❌ conditional hook
  }
};

// 5. Read refs during events, not render
const RefDuringRender = () => {
  const ref = useRef(null);
  console.log(ref.current?.value); // ❌ reading ref during render
  return <input ref={ref} />;
};`;

  const beforeAfterCode = `// BEFORE compiler — manual memoization:
const ParentBefore = memo(({ items, onSelect }) => {
  const handleClick = useCallback(
    (id) => onSelect(id),
    [onSelect]
  );

  const processed = useMemo(
    () => items.map(i => ({ ...i, label: i.name.toUpperCase() })),
    [items]
  );

  return <List items={processed} onSelect={handleClick} />;
});

// AFTER compiler — you write plain code, compiler handles memo:
function ParentAfter({ items, onSelect }) {
  const handleClick = (id) => onSelect(id);  // compiler stabilizes this
  const processed = items.map(i => ({        // compiler memoizes this
    ...i, label: i.name.toUpperCase()
  }));
  return <List items={processed} onSelect={handleClick} />;
}
// The compiler understands the data-flow and adds exactly the right memo.`;

  return (
    <div style={card()}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        React Compiler (React Forget)
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        Automatic memoization via static analysis. Write plain React, compiler adds <code>memo</code>, <code>useMemo</code>, <code>useCallback</code> where needed.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button style={pill(tab === "what")} onClick={() => setTab("what")}>What it does</button>
        <button style={pill(tab === "rules")} onClick={() => setTab("rules")}>Purity rules</button>
        <button style={pill(tab === "before-after")} onClick={() => setTab("before-after")}>Before / After</button>
      </div>

      {tab === "what" && <div style={code()}>{whatCode}</div>}
      {tab === "rules" && <div style={code()}>{rulesCode}</div>}
      {tab === "before-after" && <div style={code()}>{beforeAfterCode}</div>}

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {[
          { icon: "✅", title: "What compiler handles", items: ["Auto-memoizes components", "Stabilizes callbacks", "Memoizes computed values", "Tracks exact dependencies"] },
          { icon: "📋", title: "Enable it", items: ["babel-plugin-react-compiler", "Next.js: experimental.reactCompiler: true", "Remix: vite-plugin-babel", "Expo: add to babel.config.js"] },
        ].map(s => (
          <div key={s.title} style={card({ background: "#f8fafc", padding: 12 })}>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#1e293b", marginBottom: 8 }}>{s.icon} {s.title}</div>
            {s.items.map(i => (
              <div key={i} style={{ fontSize: 11, color: "#475569", paddingBottom: 4, display: "flex", gap: 6 }}>
                <span style={{ color: "#3b82f6", flexShrink: 0 }}>›</span> {i}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── REFERENCE: Effect ordering ───────────────────────────────────────────────

const EffectOrderRef: React.FC = () => (
  <div style={card()}>
    <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", marginBottom: 12 }}>
      Effect &amp; Commit Ordering Reference
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8 }}>Mount sequence</div>
        {[
          { step: 1, label: "Render", detail: "Component function called, returns JSX" },
          { step: 2, label: "DOM write", detail: "React inserts/updates DOM nodes" },
          { step: 3, label: "useLayoutEffect", detail: "Fires synchronously before browser paints" },
          { step: 4, label: "Browser paints", detail: "User sees the screen" },
          { step: 5, label: "useEffect", detail: "Fires asynchronously after paint" },
        ].map(s => (
          <div key={s.step} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
            <span style={{ ...tag("#e2e8f0", "#475569"), minWidth: 20, textAlign: "center" as const }}>{s.step}</span>
            <div>
              <span style={{ fontWeight: 700, fontSize: 12, color: "#1e293b" }}>{s.label}</span>
              <div style={{ fontSize: 11, color: "#64748b" }}>{s.detail}</div>
            </div>
          </div>
        ))}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8 }}>Update sequence</div>
        {[
          { step: 1, label: "State/props change", detail: "useState setter called or parent re-renders" },
          { step: 2, label: "Re-render", detail: "Component function called again" },
          { step: 3, label: "Reconciliation", detail: "New tree diffed against previous fiber tree" },
          { step: 4, label: "DOM patch", detail: "Only changed DOM nodes updated" },
          { step: 5, label: "Cleanup previous effect", detail: "Previous useEffect cleanup function runs" },
          { step: 6, label: "New useEffect fires", detail: "After paint, deps changed" },
        ].map(s => (
          <div key={s.step} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
            <span style={{ ...tag("#e2e8f0", "#475569"), minWidth: 20, textAlign: "center" as const }}>{s.step}</span>
            <div>
              <span style={{ fontWeight: 700, fontSize: 12, color: "#1e293b" }}>{s.label}</span>
              <div style={{ fontSize: 11, color: "#64748b" }}>{s.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── ROOT EXPLAINER ───────────────────────────────────────────────────────────

export const InternalsExplainer: React.FC = () => (
  <div>
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ margin: "0 0 4px", color: "#0f172a", fontSize: 22 }}>
        Expert — React Internals
      </h2>
      <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
        Reconciliation · Fiber Architecture · Concurrent Rendering · React Compiler
      </p>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <ReconciliationDemo />
      <FiberDemo />
      <ConcurrentDemo />
      <CompilerDemo />
      <EffectOrderRef />
    </div>
  </div>
);

export default InternalsExplainer;
