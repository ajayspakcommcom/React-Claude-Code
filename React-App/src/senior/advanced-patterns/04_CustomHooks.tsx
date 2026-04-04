// TOPIC: Custom Hooks
// LEVEL: Senior — Advanced Patterns #4
//
// ─── WHAT IS A CUSTOM HOOK? ───────────────────────────────────────────────────
//
//   A regular JavaScript function whose name starts with "use" and that
//   calls other hooks inside it. That's it.
//
//   function useWindowSize() {
//     const [size, setSize] = useState({ width: 0, height: 0 });
//     useEffect(() => {
//       const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
//       window.addEventListener('resize', update);
//       update();
//       return () => window.removeEventListener('resize', update);
//     }, []);
//     return size;
//   }
//
// ─── WHY CUSTOM HOOKS? ────────────────────────────────────────────────────────
//
//   Before hooks (class era): share logic = HOC or Render Props (wrappers)
//   After hooks: extract to a custom hook = no extra component in the tree,
//   no prop injection mystery, works anywhere in any function component.
//
//   Extract a custom hook when:
//   ✓ The same useState + useEffect pattern appears in 2+ components
//   ✓ A useEffect block is getting complex (fetch + cleanup + retry)
//   ✓ You want to give behaviour a clear, testable name
//
// ─── THE "use" PREFIX RULE ────────────────────────────────────────────────────
//
//   React REQUIRES the "use" prefix to enforce the rules of hooks.
//   Without it, React's linter can't warn you when you call the hook
//   conditionally or outside a component, and bugs are silent.
//
// ─── RULES OF HOOKS (still apply inside custom hooks) ─────────────────────────
//
//   1. Only call hooks at the top level — no ifs, loops, nested functions
//   2. Only call hooks from React function components or other custom hooks
//
// ─── WHAT A CUSTOM HOOK CAN RETURN ──────────────────────────────────────────
//
//   Anything. Convention:
//   - Single value:   return value;
//   - Value + setter: return [value, setValue] as const;   (array — like useState)
//   - Many things:    return { data, loading, error, refetch };  (object)
//
// ─── CUSTOM HOOKS vs HOC vs RENDER PROPS ──────────────────────────────────────
//
//   Custom hooks: simplest — just call the hook, use what it returns
//   HOC:          needed when you must wrap a component (error boundary, class compat)
//   Render Props: needed when the shared logic must control render position/target

import React, { useState, useEffect, useRef, useCallback, useReducer } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// THE HOOKS (pure logic — no JSX)
// ═══════════════════════════════════════════════════════════════════════════════

// ── useDebounce ───────────────────────────────────────────────────────────────
//
// Delays updating a value until the user stops changing it for `delay` ms.
// Classic use: search input — don't fire API on every keystroke.

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // clears timer if value changes before delay
  }, [value, delay]);

  return debounced;
}

// ── useLocalStorage ───────────────────────────────────────────────────────────
//
// useState that persists to localStorage. Reads initial value from storage
// on first render; writes back on every update.

function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initial;
    } catch {
      return initial;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored(prev => {
        const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value;
        try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* quota exceeded */ }
        return next;
      });
    },
    [key]
  );

  return [stored, setValue];
}

// ── useMediaQuery ─────────────────────────────────────────────────────────────
//
// Returns true/false based on a CSS media query.
// Re-evaluates when the viewport changes.

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

// ── useEventListener ─────────────────────────────────────────────────────────
//
// Attaches an event listener to window (or any element) with automatic cleanup.
// The handler ref trick prevents stale closures without re-adding the listener.

function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (e: WindowEventMap[K]) => void,
  element: EventTarget = window
): void {
  // Store handler in ref so the effect doesn't need to re-run when handler changes
  const savedHandler = useRef(handler);
  useEffect(() => { savedHandler.current = handler; }, [handler]);

  useEffect(() => {
    const listener = (e: Event) => savedHandler.current(e as WindowEventMap[K]);
    element.addEventListener(eventName, listener);
    return () => element.removeEventListener(eventName, listener);
  }, [eventName, element]);
}

// ── useInterval ───────────────────────────────────────────────────────────────
//
// A safe setInterval wrapper. Stops when delay is null.
// Re-starts automatically if delay changes.

function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

// ── useUndoable ───────────────────────────────────────────────────────────────
//
// State with undo/redo history. Uses useReducer for predictable transitions.

interface UndoState<T> {
  past: T[];
  present: T;
  future: T[];
}

type UndoAction<T> =
  | { type: "SET"; value: T }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET"; value: T };

function undoReducer<T>(state: UndoState<T>, action: UndoAction<T>): UndoState<T> {
  switch (action.type) {
    case "SET":
      return {
        past: [...state.past, state.present],
        present: action.value,
        future: [],
      };
    case "UNDO":
      if (state.past.length === 0) return state;
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future],
      };
    case "REDO":
      if (state.future.length === 0) return state;
      return {
        past: [...state.past, state.present],
        present: state.future[0],
        future: state.future.slice(1),
      };
    case "RESET":
      return { past: [], present: action.value, future: [] };
    default:
      return state;
  }
}

function useUndoable<T>(initial: T) {
  const [state, dispatch] = useReducer(undoReducer<T>, {
    past: [],
    present: initial,
    future: [],
  });

  const set = useCallback((value: T) => dispatch({ type: "SET", value }), []);
  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatch({ type: "REDO" }), []);
  const reset = useCallback((value: T) => dispatch({ type: "RESET", value }), []);

  return {
    value: state.present,
    set,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    history: state.past,
    future: state.future,
  };
}

// ── useWindowSize ─────────────────────────────────────────────────────────────

function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEventListener("resize", () => {
    setSize({ width: window.innerWidth, height: window.innerHeight });
  });

  return size;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO PANELS
// ═══════════════════════════════════════════════════════════════════════════════

// ── useDebounce demo ──────────────────────────────────────────────────────────

const FAKE_RESULTS: Record<string, string[]> = {
  re: ["React", "Redux", "Remix", "Recoil", "React Query"],
  rea: ["React", "React Native", "React Router", "React Query"],
  react: ["React", "React Native", "React Router", "React Query", "React Hook Form"],
  n: ["Next.js", "Nuxt", "Node.js", "Nest.js"],
  ts: ["TypeScript", "TSConfig", "ts-node"],
  v: ["Vue", "Vite", "Vitest", "Vuex"],
};

const fakeSearch = (q: string): string[] => {
  if (!q) return [];
  const key = Object.keys(FAKE_RESULTS).find(k => q.toLowerCase().startsWith(k)) ?? "";
  return FAKE_RESULTS[key] ?? [];
};

const DebounceDemo: React.FC = () => {
  const [input, setInput] = useState("");
  const debouncedInput = useDebounce(input, 500);
  const [callCount, setCallCount] = useState(0);
  const [debouncedCallCount, setDebouncedCallCount] = useState(0);

  useEffect(() => {
    if (input) setCallCount(c => c + 1);
  }, [input]);

  useEffect(() => {
    if (debouncedInput) setDebouncedCallCount(c => c + 1);
  }, [debouncedInput]);

  const results = fakeSearch(debouncedInput);

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 2 }}>
        useDebounce
      </div>
      <code style={{ fontSize: 11, color: "#7c3aed", background: "#f5f3ff", padding: "2px 8px", borderRadius: 4 }}>
        const debouncedValue = useDebounce(value, 500)
      </code>
      <div style={{ fontSize: 12, color: "#64748b", margin: "10px 0 14px" }}>
        Type fast — raw input changes every keystroke, debounced value waits 500ms after you stop.
        Try: "react", "ts", "vue"
      </div>

      <input
        type="text"
        placeholder='Try "react" or "ts"…'
        value={input}
        onChange={e => setInput(e.target.value)}
        style={{
          width: "100%", padding: "10px 14px",
          border: "2px solid #e2e8f0", borderRadius: 8,
          fontSize: 14, outline: "none", boxSizing: "border-box",
          marginBottom: 12,
        }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        <div style={{
          padding: "10px 14px", background: "#fef2f2",
          borderRadius: 8, border: "1px solid #fecaca",
        }}>
          <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 700, marginBottom: 4 }}>
            RAW VALUE (every keystroke)
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 13, color: "#1e293b" }}>
            "{input || " "}"
          </div>
          <div style={{ fontSize: 11, color: "#dc2626", marginTop: 4 }}>
            {callCount} state updates
          </div>
        </div>
        <div style={{
          padding: "10px 14px", background: "#f0fdf4",
          borderRadius: 8, border: "1px solid #bbf7d0",
        }}>
          <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700, marginBottom: 4 }}>
            DEBOUNCED (500ms after stop)
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 13, color: "#1e293b" }}>
            "{debouncedInput || " "}"
          </div>
          <div style={{ fontSize: 11, color: "#16a34a", marginTop: 4 }}>
            {debouncedCallCount} API calls (saved {Math.max(0, callCount - debouncedCallCount)})
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 8 }}>
          {results.map((r, i) => (
            <div key={r} style={{
              padding: "8px 14px", fontSize: 13, color: "#374151",
              borderBottom: i < results.length - 1 ? "1px solid #f1f5f9" : "none",
            }}>{r}</div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── useLocalStorage demo ──────────────────────────────────────────────────────

const LocalStorageDemo: React.FC = () => {
  const [theme, setTheme] = useLocalStorage<"light" | "dark" | "system">("demo-theme", "light");
  const [name, setName] = useLocalStorage<string>("demo-name", "");
  const [count, setCount] = useLocalStorage<number>("demo-count", 0);

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 2 }}>
        useLocalStorage
      </div>
      <code style={{ fontSize: 11, color: "#7c3aed", background: "#f5f3ff", padding: "2px 8px", borderRadius: 4 }}>
        const [value, setValue] = useLocalStorage(key, initial)
      </code>
      <div style={{ fontSize: 12, color: "#64748b", margin: "10px 0 14px" }}>
        Changes persist across page reloads. Open DevTools → Application → Local Storage to watch values update.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Theme picker */}
        <div style={{
          padding: "12px 14px", background: "#f8fafc",
          borderRadius: 8, border: "1px solid #e2e8f0",
        }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
            Theme preference <code style={{ fontSize: 11, background: "#e2e8f0", padding: "1px 5px", borderRadius: 3 }}>demo-theme</code>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {(["light", "dark", "system"] as const).map(t => (
              <button key={t} onClick={() => setTheme(t)} style={{
                padding: "5px 14px", borderRadius: 8, fontSize: 12,
                fontWeight: 600, cursor: "pointer", border: "2px solid",
                borderColor: theme === t ? "#3b82f6" : "#e2e8f0",
                background: theme === t ? "#eff6ff" : "#fff",
                color: theme === t ? "#2563eb" : "#64748b",
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Name input */}
        <div style={{
          padding: "12px 14px", background: "#f8fafc",
          borderRadius: 8, border: "1px solid #e2e8f0",
        }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>
            Your name <code style={{ fontSize: 11, background: "#e2e8f0", padding: "1px 5px", borderRadius: 3 }}>demo-name</code>
          </div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Type your name — it survives a refresh"
            style={{
              width: "100%", padding: "8px 12px",
              border: "2px solid #e2e8f0", borderRadius: 8,
              fontSize: 13, outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Counter */}
        <div style={{
          padding: "12px 14px", background: "#f8fafc",
          borderRadius: 8, border: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Count <code style={{ fontSize: 11, background: "#e2e8f0", padding: "1px 5px", borderRadius: 3 }}>demo-count</code>
          </div>
          <button onClick={() => setCount(c => c - 1)} style={smallBtn}>−</button>
          <span style={{ fontWeight: 700, fontSize: 18, color: "#1e293b", minWidth: 32, textAlign: "center" }}>{count}</span>
          <button onClick={() => setCount(c => c + 1)} style={smallBtn}>+</button>
          <button onClick={() => setCount(0)} style={{ ...smallBtn, background: "#f1f5f9", color: "#64748b" }}>reset</button>
        </div>
      </div>

      <div style={{
        marginTop: 12, padding: "8px 12px", borderRadius: 6,
        background: "#fffbeb", border: "1px solid #fde68a",
        fontSize: 12, color: "#92400e",
      }}>
        Refresh the page — all three values are restored from localStorage automatically.
      </div>
    </div>
  );
};

// ── useMediaQuery demo ────────────────────────────────────────────────────────

const MediaQueryDemo: React.FC = () => {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const isDark = useMediaQuery("(prefers-color-scheme: dark)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const { width } = useWindowSize();

  const queries = [
    { label: "(max-width: 640px)", name: "Mobile", active: isMobile },
    { label: "(max-width: 1024px)", name: "Tablet or smaller", active: isTablet },
    { label: "(prefers-color-scheme: dark)", name: "Dark mode OS", active: isDark },
    { label: "(prefers-reduced-motion: reduce)", name: "Reduced motion", active: prefersReducedMotion },
  ];

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 2 }}>
        useMediaQuery + useWindowSize
      </div>
      <code style={{ fontSize: 11, color: "#7c3aed", background: "#f5f3ff", padding: "2px 8px", borderRadius: 4 }}>
        const matches = useMediaQuery("(max-width: 640px)")
      </code>
      <div style={{ fontSize: 12, color: "#64748b", margin: "10px 0 14px" }}>
        Resize the browser window to see the values change in real time.
        Current viewport: <strong>{width}px</strong>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {queries.map(q => (
          <div key={q.label} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 14px", borderRadius: 8,
            background: q.active ? "#f0fdf4" : "#f8fafc",
            border: `1px solid ${q.active ? "#bbf7d0" : "#e2e8f0"}`,
            transition: "all 0.2s",
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: q.active ? "#22c55e" : "#cbd5e1",
              flexShrink: 0,
            }} />
            <code style={{ fontSize: 11, color: "#64748b", flex: 1 }}>{q.label}</code>
            <div style={{ fontWeight: 700, fontSize: 13, color: q.active ? "#16a34a" : "#94a3b8" }}>
              {q.name}: {q.active ? "true" : "false"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── useInterval demo ──────────────────────────────────────────────────────────

const IntervalDemo: React.FC = () => {
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1000);

  useInterval(() => setCount(c => c + 1), running ? speed : null);

  const pct = Math.min(100, (count % 10) * 10);

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 2 }}>
        useInterval
      </div>
      <code style={{ fontSize: 11, color: "#7c3aed", background: "#f5f3ff", padding: "2px 8px", borderRadius: 4 }}>
        useInterval(callback, delay | null)
      </code>
      <div style={{ fontSize: 12, color: "#64748b", margin: "10px 0 14px" }}>
        Pass <code style={{ background: "#f1f5f9", padding: "1px 4px", borderRadius: 3 }}>null</code> as
        delay to pause. Change speed while running — interval restarts automatically.
      </div>

      <div style={{
        fontSize: 48, fontWeight: 800, color: "#1e293b",
        textAlign: "center", fontFamily: "monospace",
        marginBottom: 12,
      }}>
        {String(count).padStart(3, "0")}
      </div>

      <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, marginBottom: 16, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: "#3b82f6", borderRadius: 4,
          transition: "width 0.15s",
        }} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={() => setRunning(r => !r)}
          style={{
            padding: "7px 18px", borderRadius: 8,
            background: running ? "#ef4444" : "#22c55e",
            color: "#fff", border: "none", cursor: "pointer",
            fontWeight: 600, fontSize: 13,
          }}
        >
          {running ? "Pause" : "Start"}
        </button>
        <button onClick={() => { setCount(0); setRunning(false); }} style={smallBtn}>
          Reset
        </button>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>Speed:</span>
          {[2000, 1000, 500, 200].map(ms => (
            <button key={ms} onClick={() => setSpeed(ms)} style={{
              padding: "4px 10px", borderRadius: 6, fontSize: 11,
              fontWeight: 600, cursor: "pointer", border: "2px solid",
              borderColor: speed === ms ? "#3b82f6" : "#e2e8f0",
              background: speed === ms ? "#eff6ff" : "#f8fafc",
              color: speed === ms ? "#2563eb" : "#64748b",
            }}>{ms}ms</button>
          ))}
        </div>
      </div>

      <div style={{
        padding: "8px 12px", borderRadius: 6,
        background: "#f8fafc", fontSize: 11, fontFamily: "monospace", color: "#64748b",
      }}>
        useInterval(() =&gt; setCount(c =&gt; c + 1), {running ? speed : "null"})
        {running ? ` — ticking every ${speed}ms` : " — paused"}
      </div>
    </div>
  );
};

// ── useUndoable demo ──────────────────────────────────────────────────────────

const COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#7c3aed", "#ec4899"];
const SIZES = [8, 12, 16, 20, 28, 36];

const UndoDemo: React.FC = () => {
  const text = useUndoable<string>("");
  const color = useUndoable<string>("#3b82f6");
  const size = useUndoable<number>(16);

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 2 }}>
        useUndoable — state with undo/redo history
      </div>
      <code style={{ fontSize: 11, color: "#7c3aed", background: "#f5f3ff", padding: "2px 8px", borderRadius: 4 }}>
        const {"{ value, set, undo, redo, canUndo, canRedo }"} = useUndoable(initial)
      </code>
      <div style={{ fontSize: 12, color: "#64748b", margin: "10px 0 14px" }}>
        Built on <code style={{ background: "#f1f5f9", padding: "1px 4px", borderRadius: 3 }}>useReducer</code>.
        Each state slice has its own undo/redo stack.
      </div>

      {/* Preview */}
      <div style={{
        padding: "16px 20px", borderRadius: 10,
        border: "2px solid #e2e8f0", marginBottom: 16,
        minHeight: 60, display: "flex", alignItems: "center",
        background: "#f8fafc",
      }}>
        <span style={{
          fontSize: size.value,
          color: color.value,
          fontWeight: 600,
          wordBreak: "break-word",
        }}>
          {text.value || "Type something below…"}
        </span>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Text</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={text.value}
              onChange={e => text.set(e.target.value)}
              placeholder="Type text…"
              style={{
                flex: 1, padding: "7px 12px",
                border: "2px solid #e2e8f0", borderRadius: 8,
                fontSize: 13, outline: "none",
              }}
            />
            <button onClick={text.undo} disabled={!text.canUndo} style={undoBtn(!text.canUndo)}>↩ Undo</button>
            <button onClick={text.redo} disabled={!text.canRedo} style={undoBtn(!text.canRedo)}>Redo ↪</button>
          </div>
          {text.history.length > 0 && (
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
              {text.history.length} step{text.history.length !== 1 ? "s" : ""} in history
              {text.future.length > 0 ? `, ${text.future.length} in future` : ""}
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Color</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => color.set(c)} style={{
                width: 24, height: 24, borderRadius: "50%", background: c,
                border: color.value === c ? "3px solid #1e293b" : "2px solid transparent",
                cursor: "pointer",
              }} />
            ))}
            <button onClick={color.undo} disabled={!color.canUndo} style={undoBtn(!color.canUndo)}>↩</button>
            <button onClick={color.redo} disabled={!color.canRedo} style={undoBtn(!color.canRedo)}>↪</button>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Size</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {SIZES.map(s => (
              <button key={s} onClick={() => size.set(s)} style={{
                padding: "3px 10px", borderRadius: 6, fontSize: 11,
                fontWeight: 600, cursor: "pointer", border: "2px solid",
                borderColor: size.value === s ? "#3b82f6" : "#e2e8f0",
                background: size.value === s ? "#eff6ff" : "#f8fafc",
                color: size.value === s ? "#2563eb" : "#64748b",
              }}>{s}px</button>
            ))}
            <button onClick={size.undo} disabled={!size.canUndo} style={undoBtn(!size.canUndo)}>↩</button>
            <button onClick={size.redo} disabled={!size.canRedo} style={undoBtn(!size.canRedo)}>↪</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── small style helpers ───────────────────────────────────────────────────────

const smallBtn: React.CSSProperties = {
  padding: "6px 14px", borderRadius: 8,
  background: "#3b82f6", color: "#fff",
  border: "none", cursor: "pointer",
  fontWeight: 600, fontSize: 12,
};

const undoBtn = (disabled: boolean): React.CSSProperties => ({
  padding: "5px 12px", borderRadius: 8,
  background: disabled ? "#f1f5f9" : "#f8fafc",
  color: disabled ? "#cbd5e1" : "#475569",
  border: "1px solid #e2e8f0",
  cursor: disabled ? "default" : "pointer",
  fontWeight: 600, fontSize: 12,
});

// ─── Concepts code panel ──────────────────────────────────────────────────────

const CodePanel: React.FC = () => (
  <div style={{
    background: "#0f172a", borderRadius: 12, padding: 20,
    border: "1px solid #1e293b",
  }}>
    <div style={{ fontWeight: 700, fontSize: 14, color: "#94a3b8", marginBottom: 12 }}>
      Custom hook anatomy — what makes them work
    </div>
    <pre style={{
      margin: 0, fontSize: 11, lineHeight: 1.75,
      color: "#e2e8f0", fontFamily: "monospace", overflow: "auto",
    }}>{`// 1. Name MUST start with "use" — React linter enforces hook rules based on this
function useDebounce<T>(value: T, delay: number): T {

  // 2. Call any built-in hooks at the TOP LEVEL — no conditions, no loops
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    // 3. Always return a cleanup function from useEffect when needed
    return () => clearTimeout(timer);
  }, [value, delay]); // 4. Exhaustive deps — include everything the effect uses

  // 5. Return whatever the caller needs — value, tuple, or object
  return debounced;
}

// ── Return style guide ────────────────────────────────────────────────────────
// Single value:
return value;

// Value + setter (mirror useState convention):
return [value, setValue] as const;

// Multiple named things (easier to use, harder to rename):
return { data, loading, error, refetch };

// ── Handler ref trick — stable event listener without re-attaching ────────────
function useEventListener(event, handler) {
  const savedHandler = useRef(handler);
  useEffect(() => { savedHandler.current = handler; }, [handler]);
  // ↑ This runs after every render to keep ref fresh

  useEffect(() => {
    // This only runs once (no handler in deps) — but always calls latest version
    const listener = (e) => savedHandler.current(e);
    window.addEventListener(event, listener);
    return () => window.removeEventListener(event, listener);
  }, [event]); // ← only re-attaches if event name changes
}`}
    </pre>
  </div>
);

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

const CustomHooks: React.FC = () => {
  const [tab, setTab] = useState<"concepts" | "demo">("concepts");

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 860, margin: "0 auto", padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{
            background: "#7c3aed", color: "#fff", fontSize: 11,
            fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            textTransform: "uppercase", letterSpacing: 1,
          }}>Senior — Advanced Patterns #4</span>
          <span style={{
            background: "#f5f3ff", color: "#6d28d9", fontSize: 11,
            fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            border: "1px solid #ddd6fe",
          }}>extract · reuse · test</span>
        </div>
        <h2 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, color: "#0f172a" }}>
          Custom Hooks
        </h2>
        <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.6 }}>
          Functions starting with <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>use</code> that
          compose built-in hooks into reusable, named behaviour.
          The modern replacement for HOCs and render props in most situations.
          Six live hooks: debounce, localStorage, mediaQuery, interval, eventListener, undoable.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "2px solid #e2e8f0" }}>
        {(["concepts", "demo"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "8px 20px", background: "none", border: "none",
            cursor: "pointer", fontWeight: 600, fontSize: 14,
            color: tab === t ? "#7c3aed" : "#64748b",
            borderBottom: `3px solid ${tab === t ? "#7c3aed" : "transparent"}`,
            marginBottom: -2, textTransform: "capitalize",
          }}>{t}</button>
        ))}
      </div>

      {tab === "concepts" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* 3 key rules */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              {
                icon: "📛",
                title: 'Name must start with "use"',
                body: "React's linter detects hooks by name. Without the prefix it can't enforce the rules of hooks and bugs are silent.",
              },
              {
                icon: "🔝",
                title: "Call hooks at the top level",
                body: "No hooks inside if/else, loops, or nested functions. Every render must call the same hooks in the same order.",
              },
              {
                icon: "↩️",
                title: "Always clean up effects",
                body: "Return a cleanup function from useEffect when you add listeners, start timers, or open subscriptions. Prevents memory leaks.",
              },
            ].map(c => (
              <div key={c.title} style={{
                border: "1px solid #ddd6fe", borderRadius: 10,
                padding: 16, background: "#f5f3ff",
              }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{c.body}</div>
              </div>
            ))}
          </div>

          {/* When to extract */}
          <div style={{
            background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 12, padding: 20,
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 12 }}>
              When to extract a custom hook
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "#22c55e",
                  textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
                }}>Extract when</div>
                {[
                  "Same useState+useEffect pattern appears in 2+ components",
                  "A useEffect block is getting complex (fetch+retry+cleanup)",
                  "You want to unit-test the logic independently of the UI",
                  "The logic has a clear name (useAuth, useCart, useWindowSize)",
                ].map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <span style={{ color: "#22c55e" }}>✓</span>
                    <span style={{ fontSize: 12, color: "#475569" }}>{t}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: "#ef4444",
                  textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
                }}>Skip it when</div>
                {[
                  "The logic is used in exactly one place (premature abstraction)",
                  "It would be shorter to just write useState inline",
                  "The hook would do nothing but wrap a single existing hook",
                  "You need to control render position (use render props instead)",
                ].map((t, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <span style={{ color: "#ef4444" }}>✕</span>
                    <span style={{ fontSize: 12, color: "#475569" }}>{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hook index */}
          <div style={{
            background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 12, padding: 20,
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 12 }}>
              Six hooks built in this topic
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { name: "useDebounce(value, delay)", ret: "T", desc: "Delays value update until N ms after last change. Prevents API calls on every keystroke." },
                { name: "useLocalStorage(key, initial)", ret: "[T, setter]", desc: "useState that reads/writes localStorage. Initial value hydrated from storage on first render." },
                { name: "useMediaQuery(query)", ret: "boolean", desc: "Returns true/false for a CSS media query string. Re-evaluates on viewport change." },
                { name: "useEventListener(event, handler)", ret: "void", desc: "Attaches event listener with auto-cleanup. Handler ref trick prevents stale closures." },
                { name: "useInterval(callback, delay|null)", ret: "void", desc: "Safe setInterval. Pass null to pause. Restarts automatically if delay changes." },
                { name: "useUndoable(initial)", ret: "{ value, set, undo, redo, canUndo, canRedo }", desc: "State with full undo/redo history. Built on useReducer for predictable transitions." },
              ].map(h => (
                <div key={h.name} style={{
                  display: "flex", gap: 12, padding: "10px 14px",
                  background: "#f8fafc", borderRadius: 8,
                  border: "1px solid #e2e8f0", alignItems: "flex-start",
                }}>
                  <code style={{
                    fontSize: 11, color: "#7c3aed", fontWeight: 700,
                    whiteSpace: "nowrap", flexShrink: 0,
                    minWidth: 260,
                  }}>{h.name}</code>
                  <div>
                    <div style={{ fontSize: 11, color: "#22c55e", fontFamily: "monospace", marginBottom: 2 }}>→ {h.ret}</div>
                    <div style={{ fontSize: 12, color: "#475569" }}>{h.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <CodePanel />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <DebounceDemo />
          <LocalStorageDemo />
          <IntervalDemo />
          <UndoDemo />
          <MediaQueryDemo />
        </div>
      )}
    </div>
  );
};

export default CustomHooks;
