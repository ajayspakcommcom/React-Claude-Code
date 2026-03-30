// TOPIC: Context API (Intermediate Patterns)
//
// We covered basic useContext in Beginner/Hooks.
// Here we focus on INTERMEDIATE patterns:
//   1. Context + Reducer  — scalable state management without Redux
//   2. Multiple contexts  — separate concerns into different contexts
//   3. Context performance — prevent unnecessary re-renders with splitting
//   4. Context with TypeScript — proper typing and null-safety pattern

import { createContext, useContext, useReducer, useState, memo } from "react";

// ════════════════════════════════════════════════════════════
// 1. Context + Reducer — the most common intermediate pattern
// ════════════════════════════════════════════════════════════

interface Notification {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface NotifState { notifications: Notification[]; nextId: number; }
type NotifAction =
  | { type: "ADD"; message: string; notifType: Notification["type"] }
  | { type: "REMOVE"; id: number };

const notifReducer = (state: NotifState, action: NotifAction): NotifState => {
  switch (action.type) {
    case "ADD":
      return {
        notifications: [...state.notifications, { id: state.nextId, message: action.message, type: action.notifType }],
        nextId: state.nextId + 1,
      };
    case "REMOVE":
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.id) };
    default: return state;
  }
};

interface NotifContextType {
  notifications: Notification[];
  addNotification: (message: string, type: Notification["type"]) => void;
  removeNotification: (id: number) => void;
}

const NotifContext = createContext<NotifContextType | null>(null);

const useNotifications = () => {
  const ctx = useContext(NotifContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotifProvider");
  return ctx;
};

const NotifProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(notifReducer, { notifications: [], nextId: 1 });

  const addNotification = (message: string, type: Notification["type"]) =>
    dispatch({ type: "ADD", message, notifType: type });
  const removeNotification = (id: number) => dispatch({ type: "REMOVE", id });

  return (
    <NotifContext.Provider value={{ notifications: state.notifications, addNotification, removeNotification }}>
      {children}
    </NotifContext.Provider>
  );
};

const NotificationList = () => {
  const { notifications, removeNotification } = useNotifications();
  const colors = { success: "#d4edda", error: "#f8d7da", info: "#d1ecf1" };
  const textColors = { success: "#155724", error: "#721c24", info: "#0c5460" };

  return (
    <div style={{ position: "fixed", top: "16px", right: "16px", zIndex: 200, minWidth: "240px" }}>
      {notifications.map((n) => (
        <div key={n.id} style={{
          background: colors[n.type], color: textColors[n.type],
          padding: "10px 14px", borderRadius: "6px", marginBottom: "6px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}>
          <span>{n.message}</span>
          <button onClick={() => removeNotification(n.id)}
            style={{ background: "none", border: "none", cursor: "pointer", marginLeft: "10px", fontWeight: "bold" }}>✕</button>
        </div>
      ))}
    </div>
  );
};

const NotifTriggers = () => {
  const { addNotification } = useNotifications();
  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
      <button onClick={() => addNotification("Saved successfully!", "success")}
        style={{ padding: "6px 12px", background: "#28a745", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
        Show Success
      </button>
      <button onClick={() => addNotification("Something went wrong.", "error")}
        style={{ padding: "6px 12px", background: "#dc3545", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
        Show Error
      </button>
      <button onClick={() => addNotification("Update available.", "info")}
        style={{ padding: "6px 12px", background: "#17a2b8", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
        Show Info
      </button>
    </div>
  );
};

const ContextReducerExample = () => (
  <div style={{ marginBottom: "20px" }}>
    <h3>1 — Context + Reducer (Notification System)</h3>
    <p style={{ fontSize: "13px", color: "#666" }}>State lives in a reducer, actions dispatched through context. Click to add notifications.</p>
    <NotifProvider>
      <NotificationList />
      <NotifTriggers />
    </NotifProvider>
  </div>
);

// ════════════════════════════════════════════════════════════
// 2. Multiple Contexts — separate concerns
// ════════════════════════════════════════════════════════════

const ThemeCtx   = createContext<{ theme: string; toggle: () => void }>({ theme: "light", toggle: () => {} });
const LanguageCtx = createContext<{ lang: string; setLang: (l: string) => void }>({ lang: "en", setLang: () => {} });

const MultipleContextsExample = () => {
  const [theme, setTheme] = useState("light");
  const [lang, setLang]   = useState("en");

  const labels: Record<string, Record<string, string>> = {
    en: { greeting: "Hello!", theme: "Theme", language: "Language" },
    es: { greeting: "¡Hola!", theme: "Tema", language: "Idioma" },
    fr: { greeting: "Bonjour!", theme: "Thème", language: "Langue" },
  };
  const t = labels[lang];

  return (
    <ThemeCtx.Provider value={{ theme, toggle: () => setTheme((t) => t === "light" ? "dark" : "light") }}>
      <LanguageCtx.Provider value={{ lang, setLang }}>
        <div style={{ marginBottom: "20px" }}>
          <h3>2 — Multiple Contexts (separate concerns)</h3>
          <div style={{
            padding: "16px", borderRadius: "8px",
            background: theme === "dark" ? "#333" : "#fff",
            color: theme === "dark" ? "#fff" : "#333",
            border: "1px solid #ddd",
          }}>
            <p style={{ fontSize: "18px" }}>{t.greeting}</p>
            <ThemeCtx.Consumer>
              {({ theme, toggle }) => (
                <button onClick={toggle} style={{ marginRight: "8px" }}>{t.theme}: {theme}</button>
              )}
            </ThemeCtx.Consumer>
            <LanguageCtx.Consumer>
              {({ lang, setLang }) => (
                <select value={lang} onChange={(e) => setLang(e.target.value)}>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              )}
            </LanguageCtx.Consumer>
          </div>
        </div>
      </LanguageCtx.Provider>
    </ThemeCtx.Provider>
  );
};

// ════════════════════════════════════════════════════════════
// 3. Context performance — split state and dispatch
// ════════════════════════════════════════════════════════════
//
// Problem: if a context value changes, ALL consumers re-render.
// Solution: split into TWO contexts — one for state, one for dispatch.
//   Components that only dispatch won't re-render when state changes.

const CountStateCtx    = createContext(0);
const CountDispatchCtx = createContext<React.Dispatch<"inc" | "dec">>(() => {});

const countReducer = (state: number, action: "inc" | "dec") =>
  action === "inc" ? state + 1 : state - 1;

// Reads state — re-renders when count changes
const CountDisplay = memo(() => {
  const count = useContext(CountStateCtx);
  console.log("CountDisplay rendered");
  return <p>Count: <strong>{count}</strong></p>;
});

// Only dispatches — does NOT re-render when count changes
const CountButtons = memo(() => {
  const dispatch = useContext(CountDispatchCtx);
  console.log("CountButtons rendered (should be rare)");
  return (
    <div>
      <button onClick={() => dispatch("inc")}>+1</button>
      <button onClick={() => dispatch("dec")} style={{ marginLeft: "8px" }}>-1</button>
    </div>
  );
});

const PerformanceExample = () => {
  const [count, dispatch] = useReducer(countReducer, 0);
  return (
    <div style={{ marginBottom: "20px" }}>
      <h3>3 — Context Performance (split state + dispatch)</h3>
      <p style={{ fontSize: "13px", color: "#666" }}>
        CountButtons only subscribes to dispatch — it won't re-render when count changes. Open console to verify.
      </p>
      <CountStateCtx.Provider value={count}>
        <CountDispatchCtx.Provider value={dispatch}>
          <CountDisplay />
          <CountButtons />
        </CountDispatchCtx.Provider>
      </CountStateCtx.Provider>
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const ContextAPIDemo = () => (
  <div>
    <h2>Context API — Intermediate Patterns</h2>
    <ContextReducerExample />
    <MultipleContextsExample />
    <PerformanceExample />
  </div>
);

export default ContextAPIDemo;
