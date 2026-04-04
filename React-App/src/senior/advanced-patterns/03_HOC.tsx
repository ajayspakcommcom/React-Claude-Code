// TOPIC: Higher-Order Components (HOC)
// LEVEL: Senior — Advanced Patterns #3
//
// ─── WHAT IS A HOC? ───────────────────────────────────────────────────────────
//
//   A function that takes a component and returns a NEW component
//   with added behaviour — without modifying the original.
//
//   const Enhanced = withSomething(OriginalComponent);
//
//   The HOC wraps the original in a new component that:
//   - Adds props, state, or side effects
//   - Can intercept or transform props before passing them down
//   - Can conditionally render the wrapped component
//
// ─── THE PATTERN ─────────────────────────────────────────────────────────────
//
//   function withLogger<P extends object>(WrappedComponent: React.ComponentType<P>) {
//     const WithLogger = (props: P) => {
//       useEffect(() => {
//         console.log('Rendered:', WrappedComponent.displayName, props);
//       });
//       return <WrappedComponent {...props} />;
//     };
//     WithLogger.displayName = `withLogger(${WrappedComponent.displayName ?? 'Component'})`;
//     return WithLogger;
//   }
//
//   const LoggedButton = withLogger(Button);
//   // LoggedButton behaves like Button but logs every render
//
// ─── NAMING CONVENTION ────────────────────────────────────────────────────────
//
//   HOC functions: prefix with "with"  → withAuth, withLoading, withErrorBoundary
//   Output components: set displayName → shows in React DevTools as withAuth(UserCard)
//
// ─── CRITICAL RULES ──────────────────────────────────────────────────────────
//
//   1. NEVER create a HOC inside a render/return — it creates a new component
//      type on every render, causing full unmount+remount.
//
//      // WRONG — defined inside component
//      const MyComp = () => {
//        const Enhanced = withAuth(Card); // ← new type every render!
//        return <Enhanced />;
//      };
//
//      // CORRECT — defined at module level
//      const Enhanced = withAuth(Card);
//      const MyComp = () => <Enhanced />;
//
//   2. Forward refs — HOCs break ref forwarding unless you wrap with React.forwardRef.
//
//   3. Forward ALL props — spread {...props} so nothing gets lost.
//
//   4. Set displayName — otherwise DevTools shows "Anonymous" everywhere.
//
//   5. Copy static methods — if the wrapped component has statics, copy them:
//      import hoistNonReactStatics from 'hoist-non-react-statics';
//      hoistNonReactStatics(Enhanced, WrappedComponent);
//
// ─── HOC vs RENDER PROPS vs CUSTOM HOOKS ──────────────────────────────────────
//
//   HOC           → cross-cutting concerns that modify a component's type
//                   (auth gates, analytics, error boundaries around components)
//   Render Props  → sharing logic where the caller controls render output
//   Custom Hooks  → sharing stateful logic — simplest, preferred today
//
//   HOCs are still common in:
//   - connect() from react-redux (legacy pattern)
//   - withRouter() from react-router v5
//   - Testing utilities (withProviders)
//   - Error boundaries (can't be hooks — class component only)

import React, {
  useState,
  useEffect,
  useRef,
  ComponentType,
  forwardRef,
} from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// HOC 1 — withLoading
// Adds a loading state gate: shows spinner while loading, renders component when done
// ═══════════════════════════════════════════════════════════════════════════════

interface WithLoadingProps {
  isLoading: boolean;
}

function withLoading<P extends object>(WrappedComponent: ComponentType<P>) {
  const WithLoading = ({ isLoading, ...props }: P & WithLoadingProps) => {
    if (isLoading) {
      return (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 10, padding: 24, color: "#94a3b8", fontSize: 13,
        }}>
          <style>{`@keyframes cl-hoc-spin{to{transform:rotate(360deg)}}`}</style>
          <div style={{
            width: 20, height: 20, borderRadius: "50%",
            border: "2px solid #e2e8f0", borderTopColor: "#3b82f6",
            animation: "cl-hoc-spin 0.8s linear infinite",
          }} />
          Loading…
        </div>
      );
    }
    return <WrappedComponent {...(props as P)} />;
  };
  WithLoading.displayName = `withLoading(${WrappedComponent.displayName ?? WrappedComponent.name ?? "Component"})`;
  return WithLoading;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOC 2 — withAuth
// Guards a component — shows login prompt if user is not authenticated
// ═══════════════════════════════════════════════════════════════════════════════

interface WithAuthProps {
  isAuthenticated: boolean;
  onLogin?: () => void;
}

function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  const WithAuth = ({ isAuthenticated, onLogin, ...props }: P & WithAuthProps) => {
    if (!isAuthenticated) {
      return (
        <div style={{
          padding: 24, textAlign: "center",
          border: "2px dashed #e2e8f0", borderRadius: 10,
          background: "#f8fafc",
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔒</div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", marginBottom: 4 }}>
            Authentication required
          </div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
            You must be logged in to view this content.
          </div>
          {onLogin && (
            <button
              onClick={onLogin}
              style={{
                padding: "7px 18px", borderRadius: 8,
                background: "#3b82f6", color: "#fff",
                border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: 13,
              }}
            >
              Log in
            </button>
          )}
        </div>
      );
    }
    return <WrappedComponent {...(props as P)} />;
  };
  WithAuth.displayName = `withAuth(${WrappedComponent.displayName ?? WrappedComponent.name ?? "Component"})`;
  return WithAuth;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOC 3 — withLogger
// Logs every render to the console with component name + props
// ═══════════════════════════════════════════════════════════════════════════════

interface RenderLog {
  time: string;
  props: Record<string, unknown>;
  count: number;
}

function withLogger<P extends object>(WrappedComponent: ComponentType<P>) {
  const componentName = WrappedComponent.displayName ?? WrappedComponent.name ?? "Component";
  const renderCount = { current: 0 };

  const WithLogger = (props: P & { onLog?: (log: RenderLog) => void }) => {
    const { onLog, ...rest } = props as P & { onLog?: (log: RenderLog) => void };
    renderCount.current += 1;

    useEffect(() => {
      const log: RenderLog = {
        time: new Date().toLocaleTimeString(),
        props: rest as Record<string, unknown>,
        count: renderCount.current,
      };
      console.log(`[withLogger] ${componentName}`, log);
      onLog?.(log);
    });

    return <WrappedComponent {...(rest as P)} />;
  };
  WithLogger.displayName = `withLogger(${componentName})`;
  return WithLogger;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOC 4 — withErrorBoundary
// Wraps any component in an error boundary (can't be a hook — class component required)
// ═══════════════════════════════════════════════════════════════════════════════

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundaryClass extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode; onReset?: () => void },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div style={{
            padding: 20, borderRadius: 10,
            background: "#fef2f2", border: "1px solid #fecaca",
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#dc2626", marginBottom: 4 }}>
              Something went wrong
            </div>
            <div style={{
              fontSize: 12, color: "#7f1d1d",
              fontFamily: "monospace", marginBottom: 12,
              background: "#fee2e2", padding: "6px 10px", borderRadius: 6,
            }}>
              {this.state.error?.message}
            </div>
            <button
              onClick={this.reset}
              style={{
                padding: "6px 14px", borderRadius: 8,
                background: "#dc2626", color: "#fff",
                border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: 12,
              }}
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

interface WithErrorBoundaryOptions {
  fallback?: React.ReactNode;
}

function withErrorBoundary<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
) {
  const WithErrorBoundary = (props: P) => {
    const [key, setKey] = useState(0);
    return (
      <ErrorBoundaryClass
        key={key}
        fallback={options.fallback}
        onReset={() => setKey(k => k + 1)}
      >
        <WrappedComponent {...props} />
      </ErrorBoundaryClass>
    );
  };
  const name = WrappedComponent.displayName ?? WrappedComponent.name ?? "Component";
  WithErrorBoundary.displayName = `withErrorBoundary(${name})`;
  return WithErrorBoundary;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS TO WRAP (base components)
// ═══════════════════════════════════════════════════════════════════════════════

// ── UserProfile (used with withAuth + withLoading) ────────────────────────────

interface User {
  name: string;
  email: string;
  role: string;
  avatar: string;
}

interface UserProfileProps {
  user: User;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 14,
    padding: "14px 18px", background: "#f8fafc",
    borderRadius: 10, border: "1px solid #e2e8f0",
  }}>
    <div style={{
      width: 48, height: 48, borderRadius: "50%",
      background: user.avatar,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 20, fontWeight: 700, color: "#fff",
    }}>
      {user.name[0]}
    </div>
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>{user.name}</div>
      <div style={{ fontSize: 12, color: "#64748b" }}>{user.email}</div>
      <div style={{
        fontSize: 11, marginTop: 3, padding: "1px 8px",
        borderRadius: 20, background: "#dbeafe", color: "#1d4ed8",
        display: "inline-block", fontWeight: 600,
      }}>{user.role}</div>
    </div>
  </div>
);
UserProfile.displayName = "UserProfile";

// ── BuggyComponent (used with withErrorBoundary) ──────────────────────────────

interface BuggyProps { shouldCrash: boolean }

const BuggyComponent: React.FC<BuggyProps> = ({ shouldCrash }) => {
  if (shouldCrash) {
    throw new Error("BuggyComponent intentionally threw — simulated crash");
  }
  return (
    <div style={{
      padding: 16, background: "#f0fdf4",
      borderRadius: 10, border: "1px solid #bbf7d0",
    }}>
      <div style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>
        Component rendered successfully ✓
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
        Click "Crash it" to simulate an error and watch the boundary catch it.
      </div>
    </div>
  );
};
BuggyComponent.displayName = "BuggyComponent";

// ── RenderCountCard (used with withLogger) ────────────────────────────────────

interface RenderCountCardProps {
  label: string;
  value: number;
  color: string;
}

const RenderCountCard: React.FC<RenderCountCardProps> = ({ label, value, color }) => (
  <div style={{
    padding: "12px 16px", borderRadius: 10,
    border: `2px solid ${color}33`, background: `${color}11`,
    textAlign: "center",
  }}>
    <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
  </div>
);
RenderCountCard.displayName = "RenderCountCard";

// ── Apply HOCs ────────────────────────────────────────────────────────────────

// These are defined at MODULE LEVEL — never inside a render function
const AuthenticatedProfile = withAuth(withLoading(UserProfile));
const LoggedCard = withLogger(RenderCountCard);
const SafeBuggy = withErrorBoundary(BuggyComponent);

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO PANELS
// ═══════════════════════════════════════════════════════════════════════════════

const DEMO_USER: User = {
  name: "Alex Rivera",
  email: "alex@company.io",
  role: "Senior Engineer",
  avatar: "#3b82f6",
};

// ── withAuth + withLoading demo ───────────────────────────────────────────────

const AuthLoadingDemo: React.FC = () => {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setAuthed(true); }, 1400);
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        withAuth + withLoading — stacked HOCs
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        Two HOCs stacked: <code style={{ background: "#f1f5f9", padding: "1px 5px", borderRadius: 4 }}>withAuth(withLoading(UserProfile))</code>. Auth gate wraps the loading gate wraps the profile.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={handleLogin}
          disabled={authed || loading}
          style={{
            padding: "7px 16px", borderRadius: 8, fontWeight: 600,
            fontSize: 13, cursor: authed || loading ? "default" : "pointer",
            background: authed ? "#f0fdf4" : "#3b82f6",
            color: authed ? "#16a34a" : "#fff",
            border: authed ? "1px solid #bbf7d0" : "none",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {authed ? "✓ Logged in" : loading ? "Logging in…" : "Log in"}
        </button>
        {authed && (
          <button
            onClick={() => { setAuthed(false); setLoading(false); }}
            style={{
              padding: "7px 16px", borderRadius: 8, fontWeight: 600,
              fontSize: 13, cursor: "pointer",
              background: "#f8fafc", color: "#64748b",
              border: "1px solid #e2e8f0",
            }}
          >
            Log out
          </button>
        )}
      </div>

      {/* Component tree shown */}
      <div style={{
        fontSize: 11, color: "#7c3aed", fontFamily: "monospace",
        background: "#f5f3ff", padding: "6px 12px",
        borderRadius: 6, marginBottom: 12,
      }}>
        const AuthenticatedProfile = withAuth(withLoading(UserProfile))
      </div>

      <AuthenticatedProfile
        isAuthenticated={authed}
        isLoading={loading}
        onLogin={handleLogin}
        user={DEMO_USER}
      />

      {/* Stack trace visual */}
      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 4 }}>
        {[
          { label: "withAuth(...)", active: !authed, note: "gate: shows login prompt" },
          { label: "withLoading(...)", active: authed && loading, note: "gate: shows spinner" },
          { label: "UserProfile", active: authed && !loading, note: "actual component" },
        ].map(layer => (
          <div key={layer.label} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "6px 12px", borderRadius: 6,
            background: layer.active ? "#eff6ff" : "#f8fafc",
            border: `1px solid ${layer.active ? "#bfdbfe" : "#e2e8f0"}`,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: layer.active ? "#3b82f6" : "#cbd5e1",
            }} />
            <code style={{
              fontSize: 11, color: layer.active ? "#1d4ed8" : "#94a3b8",
            }}>{layer.label}</code>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>— {layer.note}</span>
            {layer.active && (
              <span style={{
                marginLeft: "auto", fontSize: 10,
                background: "#dbeafe", color: "#1d4ed8",
                padding: "1px 7px", borderRadius: 20, fontWeight: 600,
              }}>ACTIVE</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── withLogger demo ───────────────────────────────────────────────────────────

const LoggerDemo: React.FC = () => {
  const [count, setCount] = useState(42);
  const [color, setColor] = useState("#3b82f6");
  const [logs, setLogs] = useState<RenderLog[]>([]);

  const addLog = (log: RenderLog) => {
    setLogs(prev => [log, ...prev].slice(0, 6));
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        withLogger — render tracking HOC
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        Every render is logged with timestamp, props, and render count. Change props to see logs appear.
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <button onClick={() => setCount(c => c + 1)} style={btnStyle("#3b82f6")}>
          count + 1
        </button>
        <button onClick={() => setCount(c => c - 1)} style={btnStyle("#64748b")}>
          count - 1
        </button>
        {["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#7c3aed"].map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            style={{
              width: 28, height: 28, borderRadius: "50%",
              background: c, border: color === c ? "3px solid #1e293b" : "2px solid transparent",
              cursor: "pointer",
            }}
          />
        ))}
      </div>

      <div style={{ marginBottom: 14 }}>
        <LoggedCard label="Score" value={count} color={color} onLog={addLog} />
      </div>

      {/* Log output */}
      <div style={{
        background: "#0f172a", borderRadius: 8, padding: 12,
        minHeight: 100, fontFamily: "monospace", fontSize: 11,
      }}>
        <div style={{ color: "#475569", marginBottom: 6 }}>// withLogger output</div>
        {logs.length === 0 && (
          <div style={{ color: "#475569" }}>Change a prop to see renders logged here…</div>
        )}
        {logs.map((log, i) => (
          <div key={i} style={{
            color: i === 0 ? "#86efac" : "#64748b",
            marginBottom: 3,
          }}>
            {`[${log.time}] render #${log.count} → count=${(log.props as { value?: number }).value ?? "?"}`}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── withErrorBoundary demo ────────────────────────────────────────────────────

const ErrorBoundaryDemo: React.FC = () => {
  const [shouldCrash, setShouldCrash] = useState(false);

  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 4 }}>
        withErrorBoundary — wraps any component in an error boundary
      </div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14 }}>
        Error boundaries MUST be class components — hooks can't catch render errors.
        The HOC hides the class behind a clean function API.
      </div>

      <div style={{
        fontSize: 11, color: "#7c3aed", fontFamily: "monospace",
        background: "#f5f3ff", padding: "6px 12px",
        borderRadius: 6, marginBottom: 12,
      }}>
        const SafeBuggy = withErrorBoundary(BuggyComponent)
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button
          onClick={() => setShouldCrash(true)}
          disabled={shouldCrash}
          style={btnStyle("#ef4444")}
        >
          Crash it
        </button>
      </div>

      <SafeBuggy shouldCrash={shouldCrash} />

      <div style={{
        marginTop: 14, padding: "10px 14px",
        background: "#fffbeb", borderRadius: 8, border: "1px solid #fde68a",
        fontSize: 12, color: "#92400e",
      }}>
        <strong>Why HOC?</strong> Error boundaries require <code>getDerivedStateFromError</code> —
        a class component lifecycle. You can't write one as a function component.
        The HOC wraps the class so consumers never see it.
      </div>
    </div>
  );
};

// ── Concepts: the "never inside render" rule ──────────────────────────────────

const NeverInsideRenderPanel: React.FC = () => (
  <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
    <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 12 }}>
      Rule #1 — Never create a HOC inside a render function
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "#ef4444",
          textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
        }}>Wrong — new component type every render</div>
        <div style={{
          background: "#0f172a", borderRadius: 8, padding: 14,
          fontFamily: "monospace", fontSize: 11, color: "#fca5a5", lineHeight: 1.7,
        }}>
          {`const MyPage = () => {\n  // ✗ new type every render!\n  const Enhanced = withAuth(Card);\n  return <Enhanced />;\n  // → full unmount+remount\n  // → state lost on every render\n};`}
        </div>
      </div>
      <div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: "#22c55e",
          textTransform: "uppercase", letterSpacing: 1, marginBottom: 8,
        }}>Correct — defined at module level</div>
        <div style={{
          background: "#0f172a", borderRadius: 8, padding: 14,
          fontFamily: "monospace", fontSize: 11, color: "#86efac", lineHeight: 1.7,
        }}>
          {`// ✓ stable identity — created once\nconst Enhanced = withAuth(Card);\n\nconst MyPage = () => {\n  return <Enhanced />;\n  // → no remount, state preserved\n};`}
        </div>
      </div>
    </div>
  </div>
);

// ── Full HOC skeleton ─────────────────────────────────────────────────────────

const SkeletonPanel: React.FC = () => (
  <div style={{
    background: "#0f172a", borderRadius: 12, padding: 20,
    border: "1px solid #1e293b",
  }}>
    <div style={{ fontWeight: 700, fontSize: 14, color: "#94a3b8", marginBottom: 12 }}>
      HOC skeleton — full pattern with all best practices
    </div>
    <pre style={{
      margin: 0, fontSize: 11, lineHeight: 1.75,
      color: "#e2e8f0", fontFamily: "monospace", overflow: "auto",
    }}>{`import { ComponentType, forwardRef } from 'react';

// P = props of the wrapped component
// ExtraProps = props the HOC adds (consumed, not passed down)

function withSomething<P extends object>(
  WrappedComponent: ComponentType<P>
) {
  // ✓ Use forwardRef so ref={...} still works on the output
  const WithSomething = forwardRef<HTMLElement, P & ExtraProps>(
    ({ extraProp, ...props }, ref) => {
      // use extraProp here — don't pass to WrappedComponent

      return (
        <WrappedComponent
          ref={ref}
          {...(props as P)}  // ✓ forward all props
        />
      );
    }
  );

  // ✓ Set displayName → shows "withSomething(Button)" in DevTools
  const name = WrappedComponent.displayName
    ?? WrappedComponent.name
    ?? 'Component';
  WithSomething.displayName = \`withSomething(\${name})\`;

  // ✓ Copy static methods (e.g. Component.defaultProps)
  // hoistNonReactStatics(WithSomething, WrappedComponent);

  return WithSomething;
}

// Usage — at MODULE level, never inside render
const EnhancedButton = withSomething(Button);
export default EnhancedButton;`}
    </pre>
  </div>
);

// ─── small helper ─────────────────────────────────────────────────────────────

function btnStyle(bg: string): React.CSSProperties {
  return {
    padding: "7px 16px", borderRadius: 8, fontWeight: 600,
    fontSize: 13, cursor: "pointer", border: "none",
    background: bg, color: "#fff",
  };
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

const HOC: React.FC = () => {
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
          }}>Senior — Advanced Patterns #3</span>
          <span style={{
            background: "#fff7ed", color: "#c2410c", fontSize: 11,
            fontWeight: 700, padding: "3px 10px", borderRadius: 20,
            border: "1px solid #fed7aa",
          }}>function → component</span>
        </div>
        <h2 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 800, color: "#0f172a" }}>
          Higher-Order Components
        </h2>
        <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.6 }}>
          A function that takes a component and returns an enhanced component.
          Cross-cutting behaviour (auth gates, loading states, error boundaries, logging)
          added without touching the original component.
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
          {/* Key concept cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              {
                icon: "🔁",
                title: "Function that returns a component",
                body: "withAuth(Card) → returns AuthCard. Same as Card but with an auth gate. Original component untouched.",
                border: "#fed7aa", bg: "#fff7ed",
              },
              {
                icon: "📛",
                title: "Always set displayName",
                body: "Without it, React DevTools shows 'Anonymous' for every HOC wrapper. Set it to 'withAuth(Card)' so the tree is readable.",
                border: "#ddd6fe", bg: "#f5f3ff",
              },
              {
                icon: "📦",
                title: "Stack HOCs — right to left",
                body: "withAuth(withLoading(Card)): loading wraps Card first, auth wraps that. Outer HOC runs first on render.",
                border: "#bfdbfe", bg: "#eff6ff",
              },
              {
                icon: "⚠️",
                title: "Never create inside render",
                body: "Calling withAuth(Card) inside a component creates a new type every render → full unmount+remount, state loss. Always at module level.",
                border: "#fecaca", bg: "#fef2f2",
              },
            ].map(c => (
              <div key={c.title} style={{
                border: `1px solid ${c.border}`, borderRadius: 10,
                padding: 16, background: c.bg,
              }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1e293b", marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{c.body}</div>
              </div>
            ))}
          </div>

          {/* HOC vs Render Props vs Hooks */}
          <div style={{
            background: "#fff", border: "1px solid #e2e8f0",
            borderRadius: 12, padding: 20,
          }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 12 }}>
              HOC vs Render Props vs Custom Hooks
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["", "HOC", "Render Props", "Custom Hook"].map(h => (
                      <th key={h} style={{
                        padding: "8px 12px", textAlign: "left",
                        fontWeight: 700, color: "#475569",
                        borderBottom: "2px solid #e2e8f0",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Auth / permission gates", "✓ Best", "✓ OK", "✓ OK"],
                    ["Error boundaries", "✓ Only option", "✗", "✗"],
                    ["Render tracking / analytics", "✓ Good", "✓ Good", "✓ Good"],
                    ["Sharing fetch / timer logic", "✓ OK", "✓ OK", "✓ Simplest"],
                    ["Controlling render output", "✗", "✓ Best", "✗"],
                    ["Visible in DevTools tree", "✓ (with displayName)", "✗ Hidden", "✗ Hidden"],
                    ["Works in class components", "✓", "✓", "✗"],
                  ].map(([label, ...vals]) => (
                    <tr key={label} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 12px", color: "#475569", fontWeight: 500 }}>{label}</td>
                      {vals.map((v, i) => (
                        <td key={i} style={{
                          padding: "8px 12px",
                          color: v.startsWith("✓") ? "#16a34a" : v.startsWith("✗") ? "#dc2626" : "#64748b",
                          fontWeight: v.startsWith("✓") || v.startsWith("✗") ? 600 : 400,
                        }}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <NeverInsideRenderPanel />
          <SkeletonPanel />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <AuthLoadingDemo />
          <LoggerDemo />
          <ErrorBoundaryDemo />
        </div>
      )}
    </div>
  );
};

export default HOC;
