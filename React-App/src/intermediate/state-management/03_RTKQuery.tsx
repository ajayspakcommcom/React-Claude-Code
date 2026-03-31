// TOPIC: RTK Query — createApi + fetchBaseQuery + useQuery + useMutation
//
// RTK Query is built INTO @reduxjs/toolkit — no extra install needed.
// It replaces manual fetch logic (useEffect + useState for loading/error/data).
//
// KEY PIECES:
//   createApi()          → defines an "API service" (base URL + all endpoints)
//   fetchBaseQuery()     → thin wrapper around fetch (sets base URL, headers)
//   builder.query()      → a GET endpoint — auto-fetches, caches, deduplicates
//   builder.mutation()   → a POST/PATCH/DELETE endpoint — trigger manually
//   configureStore()     → add api.reducer + api.middleware to the store
//   useGetPostsQuery()   → auto-generated hook — returns { data, isLoading, isError, refetch }
//   useAddPostMutation() → auto-generated hook — returns [trigger, { isLoading, isSuccess }]
//
// WHAT RTK QUERY GIVES YOU FOR FREE:
//   ✅ Caching — same query args = same cached result, no duplicate network calls
//   ✅ Loading / error states — no manual useState needed
//   ✅ Auto re-fetch on mount (configurable with refetchOnMountOrArgChange)
//   ✅ Cache invalidation — mutation can "invalidateTags" to refresh related queries
//   ✅ Optimistic updates (advanced — not shown here)
//
// DEMO: JSONPlaceholder API — list posts + add post + delete post

import React, { useState } from "react";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";

// ─────────────────────────────────────────────────────────────────────────────
// 1. TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Post {
  id:     number;
  title:  string;
  body:   string;
  userId: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. API DEFINITION — createApi()
// ─────────────────────────────────────────────────────────────────────────────
//
// createApi() is called ONCE per API base URL.
// reducerPath  → key in Redux state where RTK Query stores cache ("postsApi")
// baseQuery    → how to make requests (fetchBaseQuery sets base URL + JSON headers)
// tagTypes     → labels used for cache invalidation ("Post")
// endpoints    → each function on this object becomes a typed hook

const postsApi = createApi({
  reducerPath: "postsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "https://jsonplaceholder.typicode.com" }),

  // Tags are used for cache invalidation:
  // when a mutation invalidates "Post", all queries that provide "Post" re-fetch
  tagTypes: ["Post"],

  endpoints: (builder) => ({

    // ── GET /posts?_limit=10 ──────────────────────────────────────────────
    // builder.query<ResultType, ArgType>
    // ArgType = void means no argument needed to call the hook
    getPosts: builder.query<Post[], void>({
      query: () => "/posts?_limit=10",
      // providesTags tells RTK Query: "this result IS the Post list"
      // When something invalidates "Post", this query re-fetches
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Post" as const, id })),
              { type: "Post", id: "LIST" },
            ]
          : [{ type: "Post", id: "LIST" }],
    }),

    // ── GET /posts/:id ────────────────────────────────────────────────────
    // ArgType = number — pass a post ID to get a single post
    getPostById: builder.query<Post, number>({
      query: (id) => `/posts/${id}`,
      providesTags: (_result, _err, id) => [{ type: "Post", id }],
    }),

    // ── POST /posts ───────────────────────────────────────────────────────
    // builder.mutation<ResultType, ArgType>
    // Returns a [trigger, status] tuple — you call trigger(arg) manually
    addPost: builder.mutation<Post, Omit<Post, "id">>({
      query: (newPost) => ({
        url: "/posts",
        method: "POST",
        body: newPost,
      }),
      // Invalidating "LIST" causes getPosts to re-fetch after this mutation
      invalidatesTags: [{ type: "Post", id: "LIST" }],
    }),

    // ── DELETE /posts/:id ─────────────────────────────────────────────────
    deletePost: builder.mutation<void, number>({
      query: (id) => ({
        url: `/posts/${id}`,
        method: "DELETE",
      }),
      // Invalidate this specific post AND the list
      invalidatesTags: (_result, _err, id) => [
        { type: "Post", id },
        { type: "Post", id: "LIST" },
      ],
    }),

  }),
});

// Auto-generated hooks — one hook per endpoint, named use<EndpointName>Query / use<EndpointName>Mutation
export const {
  useGetPostsQuery,
  useGetPostByIdQuery,
  useAddPostMutation,
  useDeletePostMutation,
} = postsApi;

// ─────────────────────────────────────────────────────────────────────────────
// 3. STORE — add postsApi reducer + middleware
// ─────────────────────────────────────────────────────────────────────────────
//
// Two things MUST be added to the store:
//   reducer   → postsApi.reducer (stores cache under "postsApi" key)
//   middleware → postsApi.middleware (handles cache expiry, invalidation, polling)

const store = configureStore({
  reducer: {
    [postsApi.reducerPath]: postsApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(postsApi.middleware),
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// ── Post List — uses useGetPostsQuery ────────────────────────────────────────
function PostList() {
  // useGetPostsQuery() — no arg needed (ArgType = void)
  // Returns: { data, isLoading, isFetching, isError, error, refetch }
  const { data: posts, isLoading, isFetching, isError, refetch } = useGetPostsQuery();
  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation();

  if (isLoading) return <p style={loadingStyle}>Loading posts…</p>;
  if (isError)   return <p style={errorStyle}>Failed to load posts.</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <h4 style={{ margin: 0 }}>Posts (from JSONPlaceholder)</h4>
        <button onClick={refetch} disabled={isFetching} style={smallBtn("#4a90e2")}>
          {isFetching ? "Refreshing…" : "Refetch"}
        </button>
      </div>

      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {posts?.map((post) => (
          <li
            key={post.id}
            style={{
              display: "flex", alignItems: "flex-start", gap: "10px",
              padding: "10px", marginBottom: "6px",
              background: "#f9f9f9", borderRadius: "6px",
              borderLeft: "3px solid #4a90e2",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: "bold", color: "#333", marginBottom: "2px" }}>
                #{post.id} — {post.title}
              </div>
              <div style={{ fontSize: "12px", color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {post.body}
              </div>
            </div>
            <button
              onClick={() => deletePost(post.id)}
              disabled={isDeleting}
              style={{ border: "none", background: "none", color: "#e74c3c", cursor: "pointer", fontSize: "14px", flexShrink: 0 }}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Add Post — uses useAddPostMutation ───────────────────────────────────────
function AddPostForm() {
  const [title, setTitle] = useState("");
  const [body,  setBody]  = useState("");

  // useMutation returns [triggerFn, statusObject]
  // isSuccess resets after a short delay (configurable with fixedCacheKey)
  const [addPost, { isLoading, isSuccess, reset }] = useAddPostMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await addPost({ title, body, userId: 1 });
    setTitle("");
    setBody("");
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: "14px", background: "#f0fff0", borderRadius: "8px", marginBottom: "20px" }}>
      <h4 style={{ margin: "0 0 10px" }}>Add Post (mutation)</h4>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        style={inputStyle}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Body"
        rows={2}
        style={{ ...inputStyle, resize: "vertical", fontFamily: "sans-serif" }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <button type="submit" disabled={isLoading || !title.trim()} style={smallBtn("#27ae60")}>
          {isLoading ? "Saving…" : "Add Post"}
        </button>
        {isSuccess && (
          <span style={{ fontSize: "12px", color: "#27ae60" }}>
            ✓ Post created (JSONPlaceholder returns id: 101 for all new posts)
            {" "}<button onClick={reset} style={{ border: "none", background: "none", color: "#aaa", cursor: "pointer", fontSize: "11px" }}>dismiss</button>
          </span>
        )}
      </div>
    </form>
  );
}

// ── Single Post Lookup — uses useGetPostByIdQuery ────────────────────────────
function PostLookup() {
  const [id, setId] = useState<number | "">("");

  // Pass the id as the argument — query is skipped when id is ""
  const { data, isLoading, isError } = useGetPostByIdQuery(id as number, {
    skip: id === "",       // skip = don't fetch until we have an id
  });

  return (
    <div style={{ padding: "14px", background: "#fff8f0", borderRadius: "8px", marginBottom: "20px" }}>
      <h4 style={{ margin: "0 0 10px" }}>Single Post Lookup (skip option)</h4>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="number"
          min={1}
          max={100}
          value={id}
          onChange={(e) => setId(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="Enter post ID (1–100)"
          style={{ ...inputStyle, marginBottom: 0, width: "180px" }}
        />
        {id !== "" && <button onClick={() => setId("")} style={smallBtn("#888")}>Clear</button>}
      </div>

      {isLoading && <p style={loadingStyle}>Fetching post #{id}…</p>}
      {isError   && <p style={errorStyle}>Post not found.</p>}
      {data && (
        <div style={{ marginTop: "10px", padding: "10px", background: "#fff", borderRadius: "6px", borderLeft: "3px solid #e67e22" }}>
          <div style={{ fontSize: "13px", fontWeight: "bold" }}>#{data.id} — {data.title}</div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>{data.body}</div>
          <div style={{ fontSize: "11px", color: "#aaa", marginTop: "4px" }}>userId: {data.userId}</div>
        </div>
      )}
      <p style={{ fontSize: "11px", color: "#aaa", margin: "8px 0 0" }}>
        <code>skip: id === ""</code> — query does not fire until you type an ID
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

const RTKQueryDemo = () => (
  <Provider store={store}>
    <div>
      <h2>RTK Query</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
        Built-in data fetching layer for Redux Toolkit.
        Defines endpoints once in <code>createApi()</code> — gets auto-generated hooks,
        caching, loading states, and cache invalidation for free.
      </p>

      <AddPostForm />
      <PostLookup />
      <PostList />

      <div style={{ marginTop: "20px", padding: "12px", background: "#f5f5f5", borderRadius: "6px", fontSize: "13px" }}>
        <strong>RTK Query pattern summary:</strong>
        <ul style={{ margin: "6px 0 0", paddingLeft: "18px", lineHeight: "1.8" }}>
          <li><code>createApi({"{ reducerPath, baseQuery, tagTypes, endpoints }"})</code> — define the service</li>
          <li><code>builder.query&lt;Result, Arg&gt;({"{ query }"})</code> — auto-fetches, cached by arg</li>
          <li><code>builder.mutation&lt;Result, Arg&gt;({"{ query }"})</code> — manual trigger (POST/PATCH/DELETE)</li>
          <li><code>providesTags</code> on queries + <code>invalidatesTags</code> on mutations → automatic re-fetch</li>
          <li><code>useGetPostsQuery()</code> → <code>{"{ data, isLoading, isFetching, isError, refetch }"}</code></li>
          <li><code>useAddPostMutation()</code> → <code>[trigger, {"{ isLoading, isSuccess }"}]</code></li>
          <li><code>skip: true</code> option → prevents a query from firing until ready</li>
          <li>Store needs <code>postsApi.reducer</code> + <code>postsApi.middleware</code></li>
        </ul>
      </div>
    </div>
  </Provider>
);

export default RTKQueryDemo;

// ─── shared styles ────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  display: "block", width: "100%", padding: "6px 10px", marginBottom: "8px",
  border: "1px solid #ddd", borderRadius: "4px", fontSize: "13px",
  boxSizing: "border-box",
};

function smallBtn(bg: string): React.CSSProperties {
  return { padding: "5px 14px", background: bg, color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" };
}

const loadingStyle: React.CSSProperties = { color: "#888",    fontSize: "13px", margin: "8px 0" };
const errorStyle:   React.CSSProperties = { color: "#e74c3c", fontSize: "13px", margin: "8px 0" };
