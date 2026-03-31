// TOPIC: TanStack Query (React Query) — Full Industry-Standard Guide
//
// TanStack Query is the most popular server-state library in the React ecosystem.
// It manages ASYNC STATE (data that lives on a server) — separate from UI state.
//
// KEY MENTAL MODEL:
//   Redux / Context  → CLIENT state (theme, auth, cart, UI flags)
//   TanStack Query   → SERVER state (posts, users, products from an API)
//
// WHY TanStack Query over RTK Query?
//   ✅ Framework-agnostic (works in Vue, Solid, Svelte too)
//   ✅ More features: infinite queries, optimistic updates, prefetching
//   ✅ Better devtools (dedicated floating panel)
//   ✅ Simpler setup — no Redux store needed
//   ✅ More widely adopted in the industry outside Redux-heavy codebases
//
// FEATURES COVERED IN THIS FILE:
//   1.  QueryClient + QueryClientProvider  → setup
//   2.  useQuery()                         → basic fetch, query keys, loading/error states
//   3.  staleTime + gcTime                 → cache control
//   4.  select option                      → transform / filter data in the query
//   5.  enabled option                     → conditional / dependent queries
//   6.  refetchOnWindowFocus               → auto-refetch when tab regains focus
//   7.  retry                              → automatic retry on failure
//   8.  useMutation()                      → POST / PATCH / DELETE
//   9.  invalidateQueries()                → refresh cache after mutation
//   10. useQueryClient()                   → access query client inside a component
//   11. placeholderData: keepPreviousData  → smooth pagination (no loading flash)
//   12. useInfiniteQuery()                 → infinite scroll / load more
//   13. Parallel queries                   → multiple useQuery calls at once
//   14. Dependent queries                  → query B waits for query A's result
//   15. Prefetching                        → warm the cache before user navigates
//   16. Optimistic updates                 → update UI instantly, rollback on error
//   17. ReactQueryDevtools                 → floating panel to inspect cache

import React, { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Post   { id: number; title: string; body: string; userId: number; }
interface User   { id: number; name: string; email: string; }
interface Comment{ id: number; postId: number; name: string; body: string; }

// ─────────────────────────────────────────────────────────────────────────────
// API HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const BASE = "https://jsonplaceholder.typicode.com";
const get  = (url: string) => fetch(BASE + url).then((r) => { if (!r.ok) throw new Error("Network error"); return r.json(); });

const api = {
  posts:         ()           => get("/posts?_limit=10") as Promise<Post[]>,
  post:          (id: number) => get(`/posts/${id}`)     as Promise<Post>,
  postsPaged:    (page: number) => get(`/posts?_page=${page}&_limit=5`) as Promise<Post[]>,
  postsInfinite: ({ pageParam = 1 }) => get(`/posts?_page=${pageParam}&_limit=5`) as Promise<Post[]>,
  user:          (id: number) => get(`/users/${id}`)     as Promise<User>,
  comments:      (postId: number) => get(`/posts/${postId}/comments`) as Promise<Comment[]>,
  addPost:       (p: Omit<Post,"id">) => fetch(`${BASE}/posts`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(p) }).then(r => r.json()) as Promise<Post>,
  deletePost:    (id: number) => fetch(`${BASE}/posts/${id}`, { method:"DELETE" }),
  updatePost:    (p: Pick<Post,"id"|"title">) => fetch(`${BASE}/posts/${p.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ title: p.title }) }).then(r => r.json()) as Promise<Post>,
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. QUERY CLIENT SETUP
// ─────────────────────────────────────────────────────────────────────────────
//
// QueryClient is the central cache store.
// Create ONCE, pass to QueryClientProvider.
// All useQuery/useMutation hooks anywhere in the tree share this cache.

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          1000 * 30,  // 30s — data is "fresh" for 30s, won't refetch
      gcTime:             1000 * 60 * 5, // 5min — unused cache entries are garbage collected after 5min
      refetchOnWindowFocus: true,     // refetch when the browser tab regains focus (default: true)
      retry:              2,          // retry failed requests 2 times before showing error
    },
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. BASIC useQuery — query keys, loading, error, data
// ─────────────────────────────────────────────────────────────────────────────
//
// Query key = unique cache identifier for this query.
//   ["posts"]         → all posts
//   ["posts", 5]      → post with id 5
//   ["posts", {page}] → paged posts
//
// Rules:
//   - Array form is recommended (easier to invalidate by prefix)
//   - Changing the key = new cache entry = new fetch
//   - Same key = same cached result (no duplicate network calls)

function BasicQuery() {
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["posts"],          // cache key
    queryFn:  api.posts,          // async function that returns the data
    staleTime: 1000 * 10,         // override global default — 10s fresh for this query
    // select: transform / derive data right inside the query
    // component only re-renders when the SELECTED result changes, not the raw data
    select: (posts) => posts.map((p) => ({ ...p, title: p.title.toUpperCase() })),
  });

  return (
    <Section title="1. useQuery — basic fetch + select transform" bg="#f8f9ff">
      <div style={{ display:"flex", gap:"8px", marginBottom:"10px" }}>
        <StatusBadge label="isLoading" active={isLoading} color="#e67e22" />
        <StatusBadge label="isFetching" active={isFetching} color="#9b59b6" />
        <StatusBadge label="isError" active={isError} color="#e74c3c" />
        <button onClick={() => refetch()} style={smallBtn("#4a90e2")}>Refetch</button>
      </div>
      {isError && <p style={errStyle}>{String(error)}</p>}
      {isLoading ? <p style={loadStyle}>Loading posts…</p> : (
        <ul style={listStyle}>
          {data?.slice(0,4).map(p => <li key={p.id} style={itemStyle}>#{p.id} — {p.title}</li>)}
        </ul>
      )}
      <Note>
        Query key: <code>["posts"]</code>. <code>select</code> uppercases titles —
        component re-renders only when selected result changes.
        <code>isFetching</code> is true during background refetch even when data exists.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ENABLED OPTION — conditional / dependent queries
// ─────────────────────────────────────────────────────────────────────────────
//
// enabled: false → query never runs until you set it to true
// Used for:
//   a) Conditional fetch — only fetch when user picks an ID
//   b) Dependent query  — query B waits for query A's result

function ConditionalQuery() {
  const [userId, setUserId] = useState<number | "">("");

  // Query A — fetch a post (choose which one)
  const postQ = useQuery({
    queryKey: ["post", userId],
    queryFn:  () => api.post(userId as number),
    enabled:  userId !== "",   // ← don't run until user selects an id
  });

  // Query B — fetch comments for that post (DEPENDENT on Query A)
  const commentsQ = useQuery({
    queryKey: ["comments", postQ.data?.id],
    queryFn:  () => api.comments(postQ.data!.id),
    enabled:  !!postQ.data,   // ← only runs AFTER postQ has data
  });

  return (
    <Section title="2. enabled — conditional + dependent queries" bg="#fff8f0">
      <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"10px" }}>
        <input
          type="number" min={1} max={10} value={userId}
          onChange={e => setUserId(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="Pick post ID (1-10)"
          style={{ padding:"5px 10px", border:"1px solid #ddd", borderRadius:"4px", fontSize:"13px", width:"160px" }}
        />
        {userId !== "" && <button onClick={() => setUserId("")} style={smallBtn("#888")}>Clear</button>}
      </div>

      {postQ.isLoading && <p style={loadStyle}>Loading post…</p>}
      {postQ.data && (
        <div style={{ padding:"10px", background:"#fff", borderRadius:"6px", borderLeft:"3px solid #e67e22", marginBottom:"10px" }}>
          <strong style={{ fontSize:"13px" }}>Post:</strong>
          <p style={{ fontSize:"13px", margin:"4px 0 0" }}>{postQ.data.title}</p>
        </div>
      )}

      {commentsQ.isLoading && postQ.data && <p style={loadStyle}>Loading comments…</p>}
      {commentsQ.data && (
        <div>
          <strong style={{ fontSize:"13px" }}>Comments ({commentsQ.data.length}):</strong>
          <ul style={listStyle}>
            {commentsQ.data.slice(0,3).map(c => <li key={c.id} style={itemStyle}>{c.name}</li>)}
          </ul>
        </div>
      )}
      <Note>
        Comments query has <code>enabled: !!postQ.data</code> — it waits for the post to load first.
        This is the <strong>dependent query</strong> pattern.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. PARALLEL QUERIES — multiple useQuery in one component
// ─────────────────────────────────────────────────────────────────────────────
//
// Just call useQuery multiple times — they run in parallel automatically.
// No special syntax needed.

function ParallelQueries() {
  const user1Q = useQuery({ queryKey: ["user", 1], queryFn: () => api.user(1) });
  const user2Q = useQuery({ queryKey: ["user", 2], queryFn: () => api.user(2) });
  const user3Q = useQuery({ queryKey: ["user", 3], queryFn: () => api.user(3) });

  const queries = [user1Q, user2Q, user3Q];
  const isLoading = queries.some(q => q.isLoading);

  return (
    <Section title="3. Parallel queries — three fetches at once" bg="#f0fff8">
      {isLoading ? <p style={loadStyle}>Loading users…</p> : (
        <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
          {queries.map((q, i) => q.data && (
            <div key={i} style={{ padding:"10px 14px", background:"#fff", borderRadius:"6px", borderLeft:"3px solid #27ae60", fontSize:"13px" }}>
              <strong>{q.data.name}</strong><br />
              <span style={{ color:"#888" }}>{q.data.email}</span>
            </div>
          ))}
        </div>
      )}
      <Note>
        Three <code>useQuery</code> calls in one component — all fire simultaneously.
        Each has its own cache key: <code>["user", 1]</code>, <code>["user", 2]</code>, etc.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. PAGINATION with keepPreviousData
// ─────────────────────────────────────────────────────────────────────────────
//
// placeholderData: keepPreviousData  →  while page N+1 is loading, keep showing page N's data
// Prevents the blank/loading flash between page changes — smoother UX

function PaginatedQuery() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isPlaceholderData } = useQuery({
    queryKey: ["posts", "paged", page],        // page in the key → new entry per page
    queryFn:  () => api.postsPaged(page),
    placeholderData: keepPreviousData,          // keep old page data while fetching next
    staleTime: 1000 * 60,
  });

  return (
    <Section title="4. Pagination + keepPreviousData" bg="#fff0f8">
      <div style={{ display:"flex", gap:"8px", alignItems:"center", marginBottom:"10px" }}>
        <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} style={smallBtn("#4a90e2")}>← Prev</button>
        <span style={{ fontSize:"13px" }}>
          Page {page}
          {isFetching && !isLoading && <span style={{ color:"#9b59b6", marginLeft:"8px", fontSize:"11px" }}>refreshing…</span>}
        </span>
        <button onClick={() => setPage(p => p+1)} disabled={isPlaceholderData} style={smallBtn("#4a90e2")}>Next →</button>
      </div>

      {isLoading ? <p style={loadStyle}>Loading…</p> : (
        <ul style={{ ...listStyle, opacity: isPlaceholderData ? 0.5 : 1, transition:"opacity 0.2s" }}>
          {data?.map(p => <li key={p.id} style={itemStyle}>#{p.id} — {p.title}</li>)}
        </ul>
      )}
      <Note>
        <code>placeholderData: keepPreviousData</code> — old page stays visible while next page loads.
        <code>isPlaceholderData</code> is true during that transition (list fades to 50%).
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. useMutation — add, update, delete + invalidateQueries + optimistic updates
// ─────────────────────────────────────────────────────────────────────────────

function MutationsDemo() {
  const qc = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [editId,   setEditId]   = useState<number | "">("");
  const [editTitle,setEditTitle]= useState("");

  // ── ADD ──────────────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: api.addPost,
    onSuccess: () => {
      // Invalidate the posts list so it re-fetches after adding
      qc.invalidateQueries({ queryKey: ["posts"] });
      setNewTitle("");
    },
  });

  // ── DELETE ────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: api.deletePost,
    // OPTIMISTIC UPDATE: remove from cache immediately, rollback if server fails
    onMutate: async (id) => {
      // Cancel any in-flight refetches so they don't overwrite our optimistic update
      await qc.cancelQueries({ queryKey: ["posts"] });
      // Snapshot the current data for rollback
      const snapshot = qc.getQueryData<Post[]>(["posts"]);
      // Optimistically remove from cache
      qc.setQueryData<Post[]>(["posts"], (old) => old?.filter(p => p.id !== id));
      return { snapshot };  // return context for onError
    },
    onError: (_err, _id, context) => {
      // Rollback to snapshot if delete fails
      if (context?.snapshot) qc.setQueryData(["posts"], context.snapshot);
    },
    onSettled: () => {
      // Always re-sync with server after mutation completes
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  // ── UPDATE (PATCH) ─────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: api.updatePost,
    onSuccess: (updated) => {
      // Directly update the cache for this specific post — no refetch needed
      qc.setQueryData(["post", updated.id], updated);
      qc.invalidateQueries({ queryKey: ["posts"] });
      setEditId(""); setEditTitle("");
    },
  });

  const { data: posts, isLoading } = useQuery({ queryKey: ["posts"], queryFn: api.posts });

  return (
    <Section title="5. useMutation — add / update / delete + optimistic updates" bg="#f5f5ff">

      {/* ADD */}
      <div style={{ display:"flex", gap:"8px", marginBottom:"14px" }}>
        <input
          value={newTitle} onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && newTitle.trim() && addMutation.mutate({ title: newTitle, body:"...", userId:1 })}
          placeholder="New post title…"
          style={{ flex:1, padding:"6px 10px", border:"1px solid #ddd", borderRadius:"4px", fontSize:"13px" }}
        />
        <button
          onClick={() => addMutation.mutate({ title: newTitle, body:"...", userId:1 })}
          disabled={addMutation.isPending || !newTitle.trim()}
          style={smallBtn("#27ae60")}
        >
          {addMutation.isPending ? "Saving…" : "Add"}
        </button>
        {addMutation.isSuccess && <span style={{ fontSize:"12px", color:"#27ae60", alignSelf:"center" }}>✓ Added (id:101)</span>}
      </div>

      {/* EDIT FORM */}
      {editId !== "" && (
        <div style={{ display:"flex", gap:"8px", marginBottom:"12px", padding:"10px", background:"#fff3cd", borderRadius:"6px" }}>
          <input
            value={editTitle} onChange={e => setEditTitle(e.target.value)}
            placeholder="New title…"
            style={{ flex:1, padding:"5px 10px", border:"1px solid #ddd", borderRadius:"4px", fontSize:"13px" }}
          />
          <button onClick={() => updateMutation.mutate({ id: editId as number, title: editTitle })} style={smallBtn("#e67e22")}>Save</button>
          <button onClick={() => setEditId("")} style={smallBtn("#888")}>Cancel</button>
        </div>
      )}

      {isLoading ? <p style={loadStyle}>Loading…</p> : (
        <ul style={listStyle}>
          {posts?.slice(0,5).map(p => (
            <li key={p.id} style={{ ...itemStyle, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span>#{p.id} — {p.title.substring(0,40)}{p.title.length > 40 ? "…":""}</span>
              <div style={{ display:"flex", gap:"6px" }}>
                <button onClick={() => { setEditId(p.id); setEditTitle(p.title); }} style={tinyBtn("#e67e22")}>Edit</button>
                <button onClick={() => deleteMutation.mutate(p.id)} style={tinyBtn("#e74c3c")}>✕</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Note>
        <strong>Delete</strong> uses optimistic update — UI removes item instantly, rolls back on error.<br />
        <strong>Add</strong> uses <code>invalidateQueries</code> — refetches list after server confirms.<br />
        <strong>Update</strong> uses <code>setQueryData</code> — patches cache directly, no extra refetch.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. useInfiniteQuery — infinite scroll / load more
// ─────────────────────────────────────────────────────────────────────────────
//
// Instead of replacing data on each page (like pagination),
// useInfiniteQuery ACCUMULATES pages in a single cache entry.
// data.pages = array of pages [ page1[], page2[], page3[] ]
// data.pageParams = array of page args used [ 1, 2, 3 ]

function InfiniteQuery() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["posts", "infinite"],
    queryFn:  api.postsInfinite,
    initialPageParam: 1,
    // getNextPageParam tells TanStack Query what arg to pass for the next page
    // Return undefined to signal there are no more pages
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === 5 ? allPages.length + 1 : undefined,
  });

  // Flatten all pages into one list for rendering
  const allPosts = data?.pages.flat() ?? [];

  return (
    <Section title="6. useInfiniteQuery — load more / infinite scroll" bg="#f0f8ff">
      {isLoading ? <p style={loadStyle}>Loading…</p> : (
        <>
          <ul style={listStyle}>
            {allPosts.map(p => <li key={p.id} style={itemStyle}>#{p.id} — {p.title}</li>)}
          </ul>
          <div style={{ marginTop:"10px" }}>
            <button
              onClick={() => fetchNextPage()}
              disabled={!hasNextPage || isFetchingNextPage}
              style={smallBtn(hasNextPage ? "#4a90e2" : "#ccc")}
            >
              {isFetchingNextPage ? "Loading more…" : hasNextPage ? "Load more" : "No more posts"}
            </button>
            <span style={{ fontSize:"11px", color:"#888", marginLeft:"10px" }}>
              {allPosts.length} posts loaded across {data?.pages.length} pages
            </span>
          </div>
        </>
      )}
      <Note>
        <code>data.pages</code> = array of page arrays — flattened for rendering.
        <code>getNextPageParam</code> returns the next page number (or <code>undefined</code> when done).
        <code>hasNextPage</code> is <code>false</code> when <code>getNextPageParam</code> returns <code>undefined</code>.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. PREFETCHING — warm the cache before the user navigates
// ─────────────────────────────────────────────────────────────────────────────
//
// prefetchQuery() fetches and stores data in cache WITHOUT rendering anything.
// Typical use: prefetch on hover so the page loads instantly on click.

function PrefetchDemo() {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<number | null>(null);

  const postQ = useQuery({
    queryKey: ["post", activeId],
    queryFn:  () => api.post(activeId!),
    enabled:  activeId !== null,
  });

  async function prefetch(id: number) {
    // If already in cache and not stale, this is a no-op — free
    await qc.prefetchQuery({
      queryKey: ["post", id],
      queryFn:  () => api.post(id),
      staleTime: 1000 * 30,
    });
  }

  return (
    <Section title="7. Prefetching — hover to warm cache, click to show instantly" bg="#fffff0">
      <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"12px" }}>
        {[1,2,3,4,5].map(id => (
          <button
            key={id}
            onMouseEnter={() => prefetch(id)}   // prefetch on hover
            onClick={() => setActiveId(id)}      // show on click
            style={{
              ...smallBtn(activeId === id ? "#4a90e2" : "#888"),
              transition: "background 0.2s",
            }}
          >
            Post {id}
          </button>
        ))}
        {activeId && <button onClick={() => setActiveId(null)} style={smallBtn("#ccc")}>Clear</button>}
      </div>

      {postQ.isLoading && <p style={loadStyle}>Fetching…</p>}
      {postQ.data && (
        <div style={{ padding:"10px", background:"#fff", borderRadius:"6px", borderLeft:"3px solid #f1c40f" }}>
          <strong style={{ fontSize:"13px" }}>#{postQ.data.id} — {postQ.data.title}</strong>
          <p style={{ fontSize:"12px", color:"#666", margin:"4px 0 0" }}>{postQ.data.body}</p>
        </div>
      )}
      <Note>
        Hover a button → <code>prefetchQuery()</code> fires in background.
        Click → data is already in cache → instant render, no loading spinner.
      </Note>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — QueryClientProvider + ReactQueryDevtools
// ─────────────────────────────────────────────────────────────────────────────

const TanStackQueryDemo = () => (
  // QueryClientProvider wraps everything — provides queryClient to all hooks
  <QueryClientProvider client={queryClient}>
    <div>
      <h2>TanStack Query (React Query)</h2>
      <p style={{ fontSize:"13px", color:"#666", marginBottom:"16px" }}>
        Industry-standard server-state library. Manages fetching, caching, background sync, and mutations.
        Open the <strong>floating ⚛ devtools panel</strong> (bottom-right) to inspect the cache live.
      </p>

      <BasicQuery />
      <ConditionalQuery />
      <ParallelQueries />
      <PaginatedQuery />
      <MutationsDemo />
      <InfiniteQuery />
      <PrefetchDemo />

      <div style={{ marginTop:"20px", padding:"12px", background:"#f5f5f5", borderRadius:"6px", fontSize:"13px" }}>
        <strong>Full feature reference:</strong>
        <ul style={{ margin:"6px 0 0", paddingLeft:"18px", lineHeight:"1.8" }}>
          <li><code>useQuery({"{ queryKey, queryFn, staleTime, gcTime, enabled, select, retry }"})</code></li>
          <li><code>useMutation({"{ mutationFn, onMutate, onSuccess, onError, onSettled }"})</code></li>
          <li><code>useInfiniteQuery({"{ queryKey, queryFn, initialPageParam, getNextPageParam }"})</code></li>
          <li><code>useQueryClient()</code> → <code>invalidateQueries</code>, <code>setQueryData</code>, <code>getQueryData</code>, <code>prefetchQuery</code></li>
          <li><code>placeholderData: keepPreviousData</code> — smooth pagination</li>
          <li><code>onMutate</code> + <code>cancelQueries</code> + <code>setQueryData</code> — optimistic updates</li>
          <li><code>enabled: false / !!dep</code> — conditional + dependent queries</li>
          <li><code>refetchOnWindowFocus</code>, <code>retry</code> — global defaults in QueryClient</li>
          <li><code>&lt;ReactQueryDevtools /&gt;</code> — floating cache inspector panel</li>
        </ul>
      </div>
    </div>

    {/* Devtools panel — only in development, auto-removed in production builds */}
    <ReactQueryDevtools initialIsOpen={false} />
  </QueryClientProvider>
);

export default TanStackQueryDemo;

// ─── shared UI helpers ────────────────────────────────────────────────────────

function Section({ title, bg, children }: { title: string; bg: string; children: React.ReactNode }) {
  return (
    <div style={{ padding:"16px", background: bg, borderRadius:"8px", marginBottom:"16px" }}>
      <h4 style={{ margin:"0 0 12px", fontSize:"14px" }}>{title}</h4>
      {children}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize:"11px", color:"#888", margin:"10px 0 0", lineHeight:"1.6" }}>
      {children}
    </p>
  );
}

function StatusBadge({ label, active, color }: { label: string; active: boolean; color: string }) {
  return (
    <span style={{
      padding:"2px 8px", borderRadius:"12px", fontSize:"11px",
      background: active ? color : "#eee",
      color: active ? "#fff" : "#aaa",
    }}>
      {label}
    </span>
  );
}

function smallBtn(bg: string): React.CSSProperties {
  return { padding:"5px 12px", background: bg, color:"#fff", border:"none", borderRadius:"4px", cursor:"pointer", fontSize:"12px" };
}
function tinyBtn(bg: string): React.CSSProperties {
  return { padding:"2px 8px", background: bg, color:"#fff", border:"none", borderRadius:"3px", cursor:"pointer", fontSize:"11px" };
}

const listStyle: React.CSSProperties = { listStyle:"none", margin:0, padding:0 };
const itemStyle: React.CSSProperties = { padding:"6px 8px", marginBottom:"4px", background:"#fff", borderRadius:"4px", fontSize:"12px" };
const loadStyle: React.CSSProperties = { color:"#888", fontSize:"13px", margin:"6px 0" };
const errStyle:  React.CSSProperties = { color:"#e74c3c", fontSize:"13px", margin:"6px 0" };
