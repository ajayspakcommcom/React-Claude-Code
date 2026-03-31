// FILE: src/pages/LazyPage.tsx
//
// This component is NOT imported directly by router.tsx.
// Instead, the lazyRoute uses:
//   lazyRouteComponent(() => import('./pages/LazyPage'))
//
// Vite sees the dynamic import() and code-splits this file into a separate chunk.
// The chunk is only downloaded when the user first visits /lazy-demo.
// Must have a default export — lazyRouteComponent expects that.

export default function LazyPage() {
  return (
    <div>
      <h2>🏋️ Lazy Demo (code-split chunk)</h2>
      <p>
        This component was <strong>not included in the initial bundle</strong>.
        It arrived as a separate JS file only when you navigated here.
      </p>
      <p>
        In <code>router.tsx</code>, this route is defined as:
      </p>
      <pre style={{ background: "#f5f5f5", padding: "12px", borderRadius: "6px", fontSize: "13px", overflowX: "auto" }}>
{`const lazyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/lazy-demo",
  component: lazyRouteComponent(
    () => import("./pages/LazyPage")
  ),
  pendingComponent: () => <p>⟳ Downloading chunk...</p>,
});`}
      </pre>
      <div style={{ marginTop: "16px", padding: "12px", background: "#f0fff0", borderRadius: "6px", fontSize: "13px" }}>
        <strong>How to verify:</strong> Open DevTools → Network tab → filter by JS.
        Navigate away and back to /lazy-demo — no second download (browser caches the chunk).
      </div>

      <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            style={{
              height: "56px", borderRadius: "6px",
              background: `hsl(${i * 30}, 65%, 78%)`,
              display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "12px", color: "#333",
            }}
          >
            Widget {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}
