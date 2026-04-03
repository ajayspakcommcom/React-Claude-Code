// TOPIC: Server vs Client State
// LEVEL: Senior — Advanced State
//
// ─── THE CORE DISTINCTION ─────────────────────────────────────────────────────
//
//   CLIENT STATE — owned by the browser, not the server
//   • Modal open/closed
//   • Active tab, current page, sidebar collapsed
//   • Form input while typing
//   • Theme preference (stored locally)
//   → Tool: useState / useReducer / Context
//
//   SERVER STATE — owned by the server, shared across devices/users
//   • List of users / products / posts
//   • User profile, settings saved to DB
//   • Notifications, unread count
//   → Tool: React Query / SWR / RTK Query
//
// ─── THE SMELL TEST ───────────────────────────────────────────────────────────
//
//   "Would this state be different on another device / browser?"
//     YES → Server state (use React Query)
//     NO  → Client state (use useState)
//
// ─── THE COMMON MISTAKE ──────────────────────────────────────────────────────
//
//   ❌ Storing server data in useState + useEffect
//      - No caching: fetches again on every mount
//      - No background sync: data goes stale silently
//      - No deduplication: 3 components = 3 identical network requests
//      - Manual loading/error: 30+ lines of boilerplate per fetch
//
//   ✅ React Query for server state
//      - Caches results: instant UI on second visit
//      - Background refetch: always fresh, never stale
//      - Deduplication: 3 components = 1 network request
//      - Built-in loading/error/success states

import React, { useState, useEffect, useCallback } from "react";
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  fetchUsers, getCallCount, resetCallCount, avatarColor,
} from "./server-vs-client/fakeApi";
import type { User } from "./server-vs-client/fakeApi";

// One QueryClient shared across the demo
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
});

// ─── Root ─────────────────────────────────────────────────────────────────────

const ServerVsClientStateDemo = () => (
  <QueryClientProvider client={queryClient}>
    <style>{`@keyframes cl-spin { to { transform: rotate(360deg); } }`}</style>
    <DemoInner />
  </QueryClientProvider>
);

const DemoInner = () => {
  const [activeTab, setActiveTab] = useState<"concepts" | "comparison" | "demo">("concepts");

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.h2}>Server vs Client State</h2>
        <p style={s.subtitle}>Senior Advanced State — using the right tool for the right kind of state</p>
        <div style={s.tabs}>
          {(["concepts", "comparison", "demo"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ ...s.tab, ...(activeTab === tab ? s.tabActive : {}) }}
            >
              {tab === "concepts"   ? "📚 Concepts"   :
               tab === "comparison" ? "⚖️ Comparison" : "🔬 Live Demo"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "concepts"   && <ConceptsView />}
      {activeTab === "comparison" && <ComparisonView />}
      {activeTab === "demo"       && <LiveDemoView />}
    </div>
  );
};

// ─── Concepts view ────────────────────────────────────────────────────────────

const ConceptsView = () => (
  <div style={s.conceptsWrap}>

    {/* Two columns: client vs server */}
    <div style={s.splitGrid}>
      <div style={{ ...s.stateBox, borderColor: "#3b82f6" }}>
        <div style={{ ...s.stateTitle, color: "#1d4ed8" }}>🖥️ Client State</div>
        <p style={s.stateDesc}>Lives only in the browser. The server doesn't know or care about it.</p>
        <div style={s.stateExamples}>
          {CLIENT_EXAMPLES.map((ex, i) => (
            <div key={i} style={s.exRow}>
              <span style={{ ...s.exTag, background: "#dbeafe", color: "#1d4ed8" }}>{ex.tag}</span>
              <span style={s.exDesc}>{ex.desc}</span>
              <span style={{ ...s.exTool, color: "#1d4ed8" }}>{ex.tool}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...s.stateBox, borderColor: "#f59e0b" }}>
        <div style={{ ...s.stateTitle, color: "#92400e" }}>🌐 Server State</div>
        <p style={s.stateDesc}>Owned by the server. Has loading, error, stale states. Shared across devices.</p>
        <div style={s.stateExamples}>
          {SERVER_EXAMPLES.map((ex, i) => (
            <div key={i} style={s.exRow}>
              <span style={{ ...s.exTag, background: "#fef3c7", color: "#92400e" }}>{ex.tag}</span>
              <span style={s.exDesc}>{ex.desc}</span>
              <span style={{ ...s.exTool, color: "#92400e" }}>{ex.tool}</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Smell test */}
    <div style={s.smellCard}>
      <div style={s.smellTitle}>🔍 The Smell Test</div>
      <div style={s.smellGrid}>
        <div style={s.smellQ}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
            "Would this state be <em>different</em> on another device or browser tab?"
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ ...s.smellBadge, background: "#fef3c7", color: "#92400e" }}>YES</span>
              <span style={{ fontSize: 13 }}>→ It's <strong>server state</strong> — use React Query</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ ...s.smellBadge, background: "#dbeafe", color: "#1d4ed8" }}>NO</span>
              <span style={{ fontSize: 13 }}>→ It's <strong>client state</strong> — use useState / Context</span>
            </div>
          </div>
        </div>
        <div>
          {SMELL_TESTS.map((t, i) => (
            <div key={i} style={s.smellRow}>
              <span style={s.smellDot}>{t.isServer ? "🌐" : "🖥️"}</span>
              <span style={{ fontSize: 13, flex: 1 }}>{t.state}</span>
              <span style={{ fontSize: 12, color: t.isServer ? "#92400e" : "#1d4ed8", fontWeight: 600 }}>
                {t.isServer ? "Server state" : "Client state"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Decision flowchart */}
    <div style={s.flowCard}>
      <div style={s.smellTitle}>🗺️ Where Does This State Belong?</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
        {FLOW_BOXES.map((box, i) => (
          <div key={i} style={{ ...s.flowBox, borderColor: box.color }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{box.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{box.title}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>{box.desc}</div>
            <code style={{ fontSize: 11, background: "#f1f5f9", padding: "3px 8px", borderRadius: 6, color: "#374151" }}>{box.tool}</code>
          </div>
        ))}
      </div>
    </div>

  </div>
);

// ─── Comparison view ──────────────────────────────────────────────────────────
// Shows the SAME feature built two ways — wrong vs right

const ComparisonView = () => {
  const [showBoth, setShowBoth] = useState(true);
  const [mountKey, setMountKey] = useState(0);

  const remount = () => {
    resetCallCount();
    setMountKey((k) => k + 1);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ margin: 0, fontSize: 14, color: "#374151" }}>
            Both panels fetch the same user list. Watch the loading spinner and API call counter.
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
            Click <strong>"Simulate navigation"</strong> to unmount and remount both — this is where caching makes the difference.
          </p>
        </div>
        <button onClick={remount} style={s.remountBtn}>
          🔄 Simulate navigation
        </button>
      </div>

      <div style={s.splitGrid}>
        <WrongWayPanel key={`wrong-${mountKey}`} />
        <RightWayPanel key={`right-${mountKey}`} />
      </div>
    </div>
  );
};

// ❌ Wrong way — useState + useEffect for server data
const WrongWayPanel = () => {
  const [users,   setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchUsers()
      .then((data) => { setUsers(data); setLoading(false); })
      .catch((e)   => { setError(e.message); setLoading(false); });
  }, []); // Runs again every mount — no caching at all

  return (
    <div style={{ ...s.panel, borderColor: "#fca5a5" }}>
      <div style={{ ...s.panelHeader, background: "#fef2f2" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#991b1b" }}>❌ Wrong: useState + useEffect</span>
        <span style={{ fontSize: 12, color: "#dc2626", background: "#fee2e2", padding: "2px 8px", borderRadius: 20 }}>
          API calls: {getCallCount()}
        </span>
      </div>
      <pre style={s.codeSnip}>{WRONG_CODE}</pre>
      <div style={s.panelProblems}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#991b1b", marginBottom: 6 }}>Problems:</div>
        {WRONG_PROBLEMS.map((p, i) => <div key={i} style={{ fontSize: 12, color: "#7f1d1d", marginBottom: 3 }}>• {p}</div>)}
      </div>
      <div style={s.panelData}>
        {loading && <LoadingRow />}
        {error   && <div style={{ color: "#dc2626", fontSize: 13 }}>Error: {error}</div>}
        {!loading && !error && users.slice(0, 4).map((u) => <UserRow key={u.id} user={u} />)}
        {!loading && !error && <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center", padding: 4 }}>+{users.length - 4} more</div>}
      </div>
    </div>
  );
};

// ✅ Right way — React Query for server data
const RightWayPanel = () => {
  const { data: users, isLoading, isFetching, error } = useQuery({
    queryKey: ["demo-users"],
    queryFn:  () => fetchUsers(),
    staleTime: 30_000,  // Cache for 30s — no refetch if fresh
  });

  return (
    <div style={{ ...s.panel, borderColor: "#86efac" }}>
      <div style={{ ...s.panelHeader, background: "#f0fdf4" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#166534" }}>✅ Right: React Query</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {isFetching && !isLoading && (
            <span style={{ fontSize: 11, color: "#2563eb", background: "#dbeafe", padding: "2px 8px", borderRadius: 20 }}>
              background sync
            </span>
          )}
          {!isLoading && !isFetching && (
            <span style={{ fontSize: 11, color: "#166534", background: "#dcfce7", padding: "2px 8px", borderRadius: 20 }}>
              ✓ cached
            </span>
          )}
        </div>
      </div>
      <pre style={s.codeSnip}>{RIGHT_CODE}</pre>
      <div style={s.panelProblems}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", marginBottom: 6 }}>Benefits:</div>
        {RIGHT_BENEFITS.map((p, i) => <div key={i} style={{ fontSize: 12, color: "#14532d", marginBottom: 3 }}>• {p}</div>)}
      </div>
      <div style={s.panelData}>
        {isLoading && <LoadingRow />}
        {error     && <div style={{ color: "#dc2626", fontSize: 13 }}>Error: {String(error)}</div>}
        {users     && users.slice(0, 4).map((u) => <UserRow key={u.id} user={u} />)}
        {users     && <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center", padding: 4 }}>+{users.length - 4} more</div>}
      </div>
    </div>
  );
};

// ─── Live Demo view ───────────────────────────────────────────────────────────
// A working app that uses BOTH types of state correctly

const LiveDemoView = () => {
  // ── CLIENT STATE (UI state — useState is correct here) ───────────────────
  const [search,    setSearch]    = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | User["role"]>("all");
  const [activeTab,  setActiveTab]  = useState<"all" | "active" | "inactive">("all");
  const [selected,   setSelected]   = useState<number | null>(null);

  // ── SERVER STATE (React Query — the right tool) ──────────────────────────
  const { data: allUsers = [], isLoading, isFetching } = useQuery({
    queryKey: ["live-users"],
    queryFn:  () => fetchUsers(700),
    staleTime: 60_000,
  });

  // Client-side filtering — derived from server data + client filters
  // (pure computation, no extra fetches)
  const filtered = allUsers.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = activeTab  === "all" || u.status === activeTab;
    return matchSearch && matchRole && matchStatus;
  });

  const selectedUser = allUsers.find((u) => u.id === selected);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Annotation bar */}
      <div style={s.annotationBar}>
        <div style={s.annotation}>
          <span style={{ ...s.annDot, background: "#3b82f6" }} />
          <span style={{ fontSize: 12 }}><strong>Client state</strong>: search, roleFilter, activeTab, selected → <code style={s.code}>useState</code></span>
        </div>
        <div style={s.annotation}>
          <span style={{ ...s.annDot, background: "#f59e0b" }} />
          <span style={{ fontSize: 12 }}><strong>Server state</strong>: allUsers → <code style={s.code}>useQuery</code> with 60s staleTime</span>
        </div>
        {isFetching && (
          <div style={s.annotation}>
            <span style={{ ...s.annDot, background: "#22c55e" }} />
            <span style={{ fontSize: 12, color: "#166534" }}>Background sync in progress…</span>
          </div>
        )}
      </div>

      {/* Controls — ALL client state */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={s.searchInput}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          style={s.select}
        >
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
        <div style={s.tabGroup}>
          {(["all", "active", "inactive"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{ ...s.tabBtn, ...(activeTab === t ? s.tabBtnActive : {}) }}
            >
              {t}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "#6b7280", marginLeft: "auto" }}>
          {filtered.length} of {allUsers.length} users
        </span>
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        {/* User list */}
        <div style={{ flex: 1 }}>
          {isLoading ? (
            <div style={s.emptyState}><LoadingRow /><span style={{ color: "#6b7280", fontSize: 13 }}>Fetching from server…</span></div>
          ) : filtered.length === 0 ? (
            <div style={s.emptyState}>No users match your filters.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelected(user.id === selected ? null : user.id)}
                  style={{
                    ...s.userCard,
                    borderColor: user.id === selected ? "#3b82f6" : "#e5e7eb",
                    background:  user.id === selected ? "#eff6ff" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ ...s.avatar, background: avatarColor(user.id) }}>{user.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{user.email}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ ...s.badge, ...ROLE_COLORS[user.role] }}>{user.role}</span>
                    <span style={{ ...s.badge, ...(user.status === "active" ? s.activeStatus : s.inactiveStatus) }}>
                      {user.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel — shown when a user is selected (client state) */}
        {selectedUser && (
          <div style={s.detailPanel}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#6b7280" }}>User Detail</div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ ...s.avatar, width: 56, height: 56, fontSize: 18, background: avatarColor(selectedUser.id) }}>{selectedUser.avatar}</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedUser.name}</div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>{selectedUser.email}</div>
              </div>
            </div>
            {[
              { label: "Role",       value: selectedUser.role },
              { label: "Status",     value: selectedUser.status },
              { label: "Department", value: selectedUser.department },
              { label: "Joined",     value: selectedUser.joinedAt },
            ].map((row) => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                <span style={{ color: "#6b7280" }}>{row.label}</span>
                <span style={{ fontWeight: 600 }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Small shared components ──────────────────────────────────────────────────

const LoadingRow = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
    <div style={{ width: 24, height: 24, border: "3px solid #e5e7eb", borderTopColor: "#3b82f6", borderRadius: "50%", animation: "cl-spin 0.7s linear infinite" }} />
  </div>
);

const UserRow = ({ user }: { user: User }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
    <div style={{ ...s.avatar, width: 28, height: 28, fontSize: 11, background: avatarColor(user.id) }}>{user.avatar}</div>
    <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{user.name}</div>
    <span style={{ ...s.badge, ...ROLE_COLORS[user.role] }}>{user.role}</span>
  </div>
);

// ─── Data ─────────────────────────────────────────────────────────────────────

const CLIENT_EXAMPLES = [
  { tag: "Modal",     desc: "Is this dialog open?",           tool: "useState" },
  { tag: "Tab",       desc: "Which tab is active?",           tool: "useState" },
  { tag: "Form",      desc: "What is the user typing?",       tool: "useState / RHF" },
  { tag: "Filter",    desc: "Current search / filter value",  tool: "useState" },
  { tag: "Theme",     desc: "Light or dark mode?",            tool: "Context" },
  { tag: "Selection", desc: "Which row is highlighted?",      tool: "useState" },
];

const SERVER_EXAMPLES = [
  { tag: "Users",    desc: "List of users from the DB",       tool: "React Query" },
  { tag: "Profile",  desc: "Current user's saved settings",   tool: "React Query" },
  { tag: "Products", desc: "Catalog from the API",            tool: "React Query" },
  { tag: "Notifs",   desc: "Unread notification count",       tool: "React Query" },
  { tag: "Posts",    desc: "Blog posts paginated",            tool: "React Query" },
  { tag: "Stats",    desc: "Dashboard metrics",               tool: "React Query" },
];

const SMELL_TESTS = [
  { state: "Is the sidebar open?",              isServer: false },
  { state: "List of users in the database",     isServer: true  },
  { state: "Which step of the wizard am I on?", isServer: false },
  { state: "Current user's profile picture",    isServer: true  },
  { state: "Value in the search input",         isServer: false },
  { state: "Unread notifications count",        isServer: true  },
  { state: "Is this modal visible?",            isServer: false },
  { state: "Product inventory from the API",    isServer: true  },
];

const FLOW_BOXES = [
  { icon: "📍", color: "#3b82f6", title: "Local UI State",   desc: "One component needs it",   tool: "useState / useReducer" },
  { icon: "🌐", color: "#f59e0b", title: "Server State",     desc: "Comes from / goes to API", tool: "React Query / SWR"     },
  { icon: "🔗", color: "#8b5cf6", title: "Shared UI State",  desc: "Multiple components need it, no API", tool: "Context / Zustand" },
  { icon: "🔀", color: "#10b981", title: "URL State",        desc: "Should survive page refresh", tool: "URLSearchParams / Router" },
  { icon: "💾", color: "#ef4444", title: "Persisted Client", desc: "Client pref, survives reload", tool: "localStorage / useLocalStorage" },
];

const WRONG_CODE =
`const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  fetchUsers()
    .then(d => { setUsers(d); setLoading(false); })
    .catch(e => { setError(e); setLoading(false); });
}, []); // Fetches AGAIN on every mount`;

const RIGHT_CODE =
`const { data: users, isLoading, isFetching } =
  useQuery({
    queryKey: ["users"],
    queryFn:  fetchUsers,
    staleTime: 30_000,   // cache 30s
  });
// Instant on re-mount if data is fresh ✓`;

const WRONG_PROBLEMS = [
  "No caching — fetches again on every mount",
  "No background sync — data silently goes stale",
  "3 components = 3 identical network requests",
  "30+ lines of boilerplate per feature",
];

const RIGHT_BENEFITS = [
  "Caches results — instant UI on re-mount",
  "Background refetch — staleTime controls freshness",
  "3 components = 1 deduplicated request",
  "Built-in loading / error / isFetching states",
];

const ROLE_COLORS: Record<User["role"], React.CSSProperties> = {
  admin:  { background: "#fee2e2", color: "#991b1b" },
  editor: { background: "#fef3c7", color: "#92400e" },
  viewer: { background: "#f1f5f9", color: "#475569" },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page:          { fontFamily: "system-ui,-apple-system,sans-serif", padding: "32px 24px", maxWidth: 1200, margin: "0 auto" },
  header:        { marginBottom: 28 },
  h2:            { fontSize: 26, fontWeight: 800, color: "#111827", margin: "0 0 6px" },
  subtitle:      { color: "#6b7280", margin: "0 0 20px" },
  tabs:          { display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, width: "fit-content" },
  tab:           { padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: "transparent", color: "#6b7280", fontFamily: "inherit" },
  tabActive:     { background: "#fff", color: "#111827", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" },

  // Concepts
  conceptsWrap:  { display: "flex", flexDirection: "column", gap: 20 },
  splitGrid:     { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  stateBox:      { background: "#fff", border: "1.5px solid", borderRadius: 12, padding: 20 },
  stateTitle:    { fontSize: 16, fontWeight: 800, marginBottom: 8 },
  stateDesc:     { fontSize: 13, color: "#6b7280", marginBottom: 12, lineHeight: 1.6 },
  stateExamples: { display: "flex", flexDirection: "column", gap: 6 },
  exRow:         { display: "flex", alignItems: "center", gap: 8, fontSize: 13 },
  exTag:         { padding: "1px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0 },
  exDesc:        { flex: 1, color: "#374151" },
  exTool:        { fontSize: 11, fontFamily: "monospace", fontWeight: 700, flexShrink: 0 },
  smellCard:     { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 },
  smellTitle:    { fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 12 },
  smellGrid:     { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  smellQ:        { background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 },
  smellBadge:    { padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 },
  smellRow:      { display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid #f1f5f9" },
  smellDot:      { fontSize: 14, flexShrink: 0 },
  flowCard:      { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 20 },
  flowBox:       { flex: 1, minWidth: 160, background: "#f8fafc", border: "1.5px solid", borderRadius: 10, padding: 14 },

  // Comparison
  panel:         { background: "#fff", border: "1.5px solid", borderRadius: 12, overflow: "hidden" },
  panelHeader:   { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px" },
  codeSnip:      { fontSize: 11, lineHeight: 1.7, background: "#0f172a", color: "#e2e8f0", padding: "12px 16px", margin: 0, fontFamily: "monospace", overflow: "auto" },
  panelProblems: { padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #e5e7eb" },
  panelData:     { padding: 16, display: "flex", flexDirection: "column", gap: 0 },
  remountBtn:    { padding: "9px 16px", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" },

  // Live demo
  annotationBar: { display: "flex", gap: 16, flexWrap: "wrap", padding: "10px 14px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8 },
  annotation:    { display: "flex", alignItems: "center", gap: 6 },
  annDot:        { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  code:          { fontSize: 11, background: "#e5e7eb", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace" },
  searchInput:   { flex: 1, minWidth: 200, padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "inherit" },
  select:        { padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff", fontFamily: "inherit" },
  tabGroup:      { display: "flex", background: "#f1f5f9", borderRadius: 8, padding: 3, gap: 2 },
  tabBtn:        { padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, background: "transparent", color: "#6b7280", fontFamily: "inherit" },
  tabBtnActive:  { background: "#fff", color: "#111827", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  userCard:      { display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#fff", border: "1.5px solid", borderRadius: 10, transition: "border-color 0.15s, background 0.15s" },
  avatar:        { width: 36, height: 36, borderRadius: "50%", color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  badge:         { padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700 },
  activeStatus:  { background: "#dcfce7", color: "#166534" },
  inactiveStatus:{ background: "#f1f5f9", color: "#475569" },
  detailPanel:   { width: 240, flexShrink: 0, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 },
  emptyState:    { display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", gap: 8 },
};

export default ServerVsClientStateDemo;
