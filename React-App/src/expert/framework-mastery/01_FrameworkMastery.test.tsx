// TOPIC: Framework Mastery (Expert)
// LEVEL: Expert — Framework Mastery
//
// ─── THREE TOPICS ─────────────────────────────────────────────────────────────
//
//   1. Next.js App Router  — file-based routing, layouts, special files
//   2. Server Components   — RSC, 'use client', server/client boundary
//   3. Edge Rendering      — edge runtime, middleware, streaming at the edge
//
// ─── NEXT.JS APP ROUTER ───────────────────────────────────────────────────────
//
//   The App Router (Next.js 13+) uses a file-system convention inside app/.
//
//   Special files (co-located in any route segment):
//     page.tsx        — unique UI for the route, makes segment publicly accessible
//     layout.tsx      — shared UI wrapping page + children (persists across nav)
//     loading.tsx     — Suspense fallback shown while page loads
//     error.tsx       — Error boundary for the segment ('use client' required)
//     not-found.tsx   — rendered when notFound() is thrown
//     route.ts        — API endpoint (replaces pages/api/)
//     middleware.ts   — runs on every request before route handler (edge only)
//     template.tsx    — like layout but re-mounts on navigation (rare)
//     default.tsx     — fallback for parallel routes
//
//   Routing patterns:
//     app/blog/[slug]/page.tsx         → /blog/react-hooks
//     app/blog/[...slug]/page.tsx      → /blog/2026/04/post (catch-all)
//     app/blog/[[...slug]]/page.tsx    → /blog OR /blog/2026/04/post (optional)
//     app/(marketing)/about/page.tsx   → /about (group — no URL segment)
//     app/@modal/photo/page.tsx        → parallel route slot
//     app/(.)photo/[id]/page.tsx       → intercepting route
//
//   Data fetching in App Router:
//     Server Components can be async:
//       async function Page() {
//         const data = await fetch('/api/posts');  // runs on server
//         return <PostList posts={data} />;
//       }
//
//     Next.js extends fetch() with cache options:
//       fetch(url, { cache: 'force-cache' })      — static (like SSG)
//       fetch(url, { cache: 'no-store' })          — dynamic (like SSR)
//       fetch(url, { next: { revalidate: 60 } })  — ISR (revalidate after 60s)
//       fetch(url, { next: { tags: ['posts'] } })  — tagged for on-demand revalidation
//
//   Route Segment Config (exported constants):
//     export const dynamic = 'force-dynamic';       // always SSR
//     export const revalidate = 3600;               // ISR — regenerate every 1hr
//     export const runtime = 'edge';                // edge runtime
//     export const fetchCache = 'force-no-store';   // all fetches uncached
//
// ─── SERVER COMPONENTS (RSC) ──────────────────────────────────────────────────
//
//   React Server Components run ONLY on the server.
//   They never ship to the browser — zero JS bundle impact.
//
//   Server Component (default in App Router):
//   ✅ Can be async (await data directly)
//   ✅ Can import server-only libraries (DB, fs, secrets)
//   ✅ Can read environment variables directly
//   ✅ Zero JS sent to client
//   ❌ Cannot use useState, useEffect, useContext
//   ❌ Cannot use event handlers (onClick, onChange)
//   ❌ Cannot use browser APIs (window, document, localStorage)
//
//   Client Component ('use client' at top of file):
//   ✅ Full React: hooks, events, browser APIs
//   ✅ Receives serialisable props from Server Components
//   ❌ Cannot be async (not supported)
//   ❌ Cannot import server-only modules (db, fs)
//
//   Server → Client data flow:
//   Server Component fetches data → passes as props → Client Component renders
//   Props must be serialisable (no functions, class instances, undefined)
//
//   'use server' (Server Actions):
//   Async functions that run on the server, callable from the client.
//   Used for form submissions, mutations — replaces API routes.
//
//     'use server'
//     async function createPost(formData: FormData) {
//       const title = formData.get('title');
//       await db.post.create({ data: { title } });
//       revalidatePath('/blog');
//     }
//
//   cache() function:
//   Deduplicates identical server-side function calls within a request.
//   Like React's memo but for async server functions.
//
// ─── EDGE RENDERING ───────────────────────────────────────────────────────────
//
//   Edge Runtime: V8 isolates running at CDN PoPs (Points of Presence)
//   Faster TTFB than regional servers — code runs closest to the user.
//
//   What's available on Edge (subset of Node.js):
//   ✅ fetch(), Request, Response, Headers, URL
//   ✅ Web Crypto API
//   ✅ Encoding APIs (TextEncoder, TextDecoder)
//   ✅ setTimeout, setInterval (limited)
//   ❌ Node.js built-ins: fs, path, net, os
//   ❌ Native Node modules
//   ❌ Arbitrary npm packages that use Node internals
//
//   Middleware (middleware.ts at project root):
//   Runs on EVERY request before routing.
//   Use cases: auth, A/B testing, geolocation, rate limiting, redirects.
//
//   export function middleware(request: NextRequest) {
//     const token = request.cookies.get('token');
//     if (!token) return NextResponse.redirect('/login');
//     return NextResponse.next();
//   }
//   export const config = { matcher: ['/dashboard/:path*'] };
//
//   Streaming at the edge:
//   Combine edge runtime + Suspense streaming for lowest possible latency.
//   Shell HTML generated at edge, data streamed from origin as it resolves.

import React, {
  useState,
  useEffect,
  useCallback,
  Suspense,
  lazy,
} from "react";

// ── cache() polyfill ──────────────────────────────────────────────────────────
// React 19 ships cache() for per-request deduplication of async server functions.
// React 18 doesn't export it yet; we implement the identical semantics here so
// the test proves the concept without upgrading React.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cache<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  const map = new Map<string, ReturnType<T>>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((...args: any[]): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (map.has(key)) return map.get(key) as ReturnType<T>;
    const result = fn(...args) as ReturnType<T>;
    map.set(key, result);
    return result;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as unknown as T;
}
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ═══════════════════════════════════════════════════════════════════════════════
// SIMULATED SERVER COMPONENT PATTERNS
// (In real Next.js these run on the server; here we simulate the patterns)
// ═══════════════════════════════════════════════════════════════════════════════

// ── Async data fetching (Server Component pattern) ────────────────────────────

interface Post {
  id: number;
  title: string;
  slug: string;
  publishedAt: string;
  views: number;
}

interface User {
  id: string;
  name: string;
  plan: "free" | "pro" | "enterprise";
}

// Simulates: async function BlogPage() { const posts = await getPosts(); ... }
const fetchPosts = async (): Promise<Post[]> => [
  { id: 1, title: "React Server Components", slug: "rsc", publishedAt: "2026-04-01", views: 1200 },
  { id: 2, title: "Next.js App Router", slug: "app-router", publishedAt: "2026-04-02", views: 890 },
  { id: 3, title: "Edge Rendering", slug: "edge", publishedAt: "2026-04-03", views: 650 },
];

const fetchUser = async (id: string): Promise<User> => ({
  id,
  name: id === "u1" ? "Alice Admin" : "Bob User",
  plan: id === "u1" ? "enterprise" : "pro",
});

// ── cache() deduplication simulation ─────────────────────────────────────────

// Tracks how many times the underlying fetch ran
let fetchCallCount = 0;

// cache() wraps an async function — identical calls within same request are deduped
const getCachedUser = cache(async (id: string): Promise<User> => {
  fetchCallCount++;
  return fetchUser(id);
});

// ── Route Segment Config simulation ──────────────────────────────────────────

type CacheStrategy = "force-cache" | "no-store" | "revalidate";

const simulateFetch = async (
  url: string,
  strategy: CacheStrategy,
  revalidateSeconds?: number
): Promise<{ data: string; cached: boolean; expiresIn?: number }> => {
  // Simulate Next.js extended fetch behaviour
  if (strategy === "force-cache") {
    return { data: `Cached data from ${url}`, cached: true };
  }
  if (strategy === "no-store") {
    return { data: `Fresh data from ${url} at ${Date.now()}`, cached: false };
  }
  // ISR: cached but expires after revalidateSeconds
  return {
    data: `ISR data from ${url}`,
    cached: true,
    expiresIn: revalidateSeconds,
  };
};

// ── Client Component patterns ─────────────────────────────────────────────────

// 'use client' — can use hooks + events
const LikeButton: React.FC<{
  postId: number;
  initialLikes: number;
  onLike?: (id: number) => void;
}> = ({ postId, initialLikes, onLike }) => {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);

  const handleLike = useCallback(() => {
    if (liked) return;
    setLikes(l => l + 1);
    setLiked(true);
    onLike?.(postId);
  }, [liked, postId, onLike]);

  return (
    <button
      onClick={handleLike}
      disabled={liked}
      aria-label={`Like post ${postId}`}
      data-testid={`like-${postId}`}
    >
      {liked ? "❤️" : "🤍"} {likes}
    </button>
  );
};

// Server Component renders static, passes serialisable props to Client Component
const PostCard: React.FC<{ post: Post }> = ({ post }) => (
  <article data-testid={`post-${post.id}`}>
    <h2>{post.title}</h2>
    <time>{post.publishedAt}</time>
    <span data-testid={`views-${post.id}`}>{post.views} views</span>
    {/* Client component nested inside server component */}
    <LikeButton postId={post.id} initialLikes={post.views} />
  </article>
);

// ── Loading UI pattern (Suspense + lazy) ──────────────────────────────────────

const PostList: React.FC<{ posts: Post[] }> = ({ posts }) => (
  <ul data-testid="post-list">
    {posts.map(p => (
      <li key={p.id}>
        <PostCard post={p} />
      </li>
    ))}
  </ul>
);

// Simulates a loading.tsx — Suspense fallback for async Server Component
const PostListSkeleton: React.FC = () => (
  <div data-testid="posts-skeleton" aria-busy="true" aria-label="Loading posts">
    {[1, 2, 3].map(i => (
      <div key={i} style={{ height: 80, background: "#f1f5f9", borderRadius: 8, marginBottom: 8 }} />
    ))}
  </div>
);

// ── Error boundary pattern (error.tsx must be 'use client') ───────────────────

class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback ?? (
          <div data-testid="route-error" role="alert">
            <h2>Something went wrong</h2>
            <p>{(this.state.error as Error).message}</p>
            <button onClick={() => this.setState({ error: null })}>Try again</button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

// ── Layout pattern ────────────────────────────────────────────────────────────

const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-testid="root-layout">
    <header data-testid="layout-header">
      <nav>
        <a href="/">Home</a>
        <a href="/blog">Blog</a>
      </nav>
    </header>
    <main>{children}</main>
    <footer data-testid="layout-footer">© 2026 My Site</footer>
  </div>
);

// ── Middleware simulation ─────────────────────────────────────────────────────

interface Request {
  url: string;
  cookies: Map<string, string>;
  headers: Map<string, string>;
  geo?: { country?: string; city?: string };
}

interface MiddlewareResponse {
  action: "next" | "redirect" | "rewrite";
  destination?: string;
  headers?: Record<string, string>;
}

// Simulates Next.js middleware.ts
const middleware = (request: Request): MiddlewareResponse => {
  const { pathname } = new URL(request.url, "https://example.com");

  // Auth guard — protect /dashboard routes
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("auth-token");
    if (!token) {
      return { action: "redirect", destination: "/login" };
    }
  }

  // A/B testing — split traffic by cookie
  if (pathname === "/") {
    const variant = request.cookies.get("ab-variant");
    if (variant === "b") {
      return { action: "rewrite", destination: "/home-v2" };
    }
  }

  // Geolocation — block certain regions
  if (request.geo?.country === "XX") {
    return { action: "redirect", destination: "/not-available" };
  }

  // Rate limiting header injection
  return {
    action: "next",
    headers: { "X-RateLimit-Remaining": "99" },
  };
};

// ── Server Action simulation ──────────────────────────────────────────────────

// 'use server'
let serverPosts: Post[] = [];

const createPost = async (formData: { title: string; slug: string }): Promise<{
  success: boolean;
  post?: Post;
  error?: string;
}> => {
  if (!formData.title.trim()) return { success: false, error: "Title is required" };
  if (serverPosts.some(p => p.slug === formData.slug))
    return { success: false, error: "Slug already exists" };

  const post: Post = {
    id: Date.now(),
    title: formData.title,
    slug: formData.slug,
    publishedAt: new Date().toISOString().split("T")[0],
    views: 0,
  };
  serverPosts.push(post);
  return { success: true, post };
};

// Client form that calls a Server Action
const CreatePostForm: React.FC<{
  onSuccess?: (post: Post) => void;
}> = ({ onSuccess }) => {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError("");
    const result = await createPost({ title, slug });
    setPending(false);
    if (result.success && result.post) {
      onSuccess?.(result.post);
      setTitle("");
      setSlug("");
    } else {
      setError(result.error ?? "Unknown error");
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Create post">
      <label htmlFor="title">Title</label>
      <input id="title" value={title} onChange={e => setTitle(e.target.value)} />
      <label htmlFor="slug">Slug</label>
      <input id="slug" value={slug} onChange={e => setSlug(e.target.value)} />
      <button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create post"}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
};

// ─── Edge capability check ─────────────────────────────────────────────────────

// Simulates what is/isn't available on Edge Runtime
const checkEdgeCompatibility = (feature: string): boolean => {
  const edgeAvailable = new Set([
    "fetch",
    "Request",
    "Response",
    "Headers",
    "URL",
    "URLSearchParams",
    "TextEncoder",
    "TextDecoder",
    "crypto",
    "setTimeout",
    "setInterval",
    "ReadableStream",
    "WritableStream",
  ]);
  const edgeUnavailable = new Set([
    "fs",
    "path",
    "net",
    "os",
    "child_process",
    "require",
    "process.env.HOME", // some process.env works, native bindings don't
  ]);
  if (edgeUnavailable.has(feature)) return false;
  if (edgeAvailable.has(feature)) return true;
  return false;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. NEXT.JS APP ROUTER PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

describe("1 — Next.js App Router patterns", () => {
  it("layout wraps all pages and persists across navigation", () => {
    render(
      <RootLayout>
        <div data-testid="page-content">Blog page</div>
      </RootLayout>
    );

    // Layout elements always present
    expect(screen.getByTestId("layout-header")).toBeInTheDocument();
    expect(screen.getByTestId("layout-footer")).toBeInTheDocument();

    // Page content rendered inside layout
    expect(screen.getByTestId("page-content")).toHaveTextContent("Blog page");
  });

  it("loading.tsx pattern: Suspense wraps async content with skeleton", async () => {
    const AsyncPage = lazy(() =>
      new Promise<{ default: React.FC }>(resolve =>
        setTimeout(() => resolve({
          default: () => <div data-testid="blog-page">Blog loaded</div>,
        }), 20)
      )
    );

    render(
      <RootLayout>
        <Suspense fallback={<PostListSkeleton />}>
          <AsyncPage />
        </Suspense>
      </RootLayout>
    );

    // loading.tsx equivalent shown while page loads
    expect(screen.getByTestId("posts-skeleton")).toBeInTheDocument();
    expect(screen.getByTestId("posts-skeleton")).toHaveAttribute("aria-busy", "true");

    // Page renders when ready
    expect(await screen.findByTestId("blog-page")).toBeInTheDocument();
    expect(screen.queryByTestId("posts-skeleton")).not.toBeInTheDocument();
  });

  it("error.tsx pattern: error boundary catches route-level errors", () => {
    const Broken: React.FC = () => {
      throw new Error("Route render failed");
    };

    render(
      <RootLayout>
        <RouteErrorBoundary>
          <Broken />
        </RouteErrorBoundary>
      </RootLayout>
    );

    // error.tsx fallback shown — layout still visible
    expect(screen.getByTestId("route-error")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Route render failed");

    // Layout persists (error boundary is inside layout)
    expect(screen.getByTestId("layout-header")).toBeInTheDocument();
  });

  it("error.tsx try again resets the error boundary", async () => {
    let shouldThrow = true;
    const MaybeThrow: React.FC = () => {
      if (shouldThrow) throw new Error("Temporary error");
      return <div data-testid="recovered">Page recovered</div>;
    };

    render(
      <RouteErrorBoundary>
        <MaybeThrow />
      </RouteErrorBoundary>
    );

    expect(screen.getByTestId("route-error")).toBeInTheDocument();

    shouldThrow = false;
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByTestId("recovered")).toBeInTheDocument();
  });

  it("fetch caching strategies map to SSG/ISR/SSR behaviours", async () => {
    // SSG equivalent: force-cache — never refetch
    const ssg = await simulateFetch("/api/posts", "force-cache");
    expect(ssg.cached).toBe(true);
    expect(ssg.expiresIn).toBeUndefined();

    // SSR equivalent: no-store — always fresh
    const ssr = await simulateFetch("/api/posts", "no-store");
    expect(ssr.cached).toBe(false);

    // ISR equivalent: revalidate — cached but expires
    const isr = await simulateFetch("/api/posts", "revalidate", 60);
    expect(isr.cached).toBe(true);
    expect(isr.expiresIn).toBe(60);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. SERVER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("2 — Server Components", () => {
  it("server component fetches and renders data without client JS", async () => {
    // Simulates async Server Component
    const posts = await fetchPosts();

    render(<PostList posts={posts} />);

    // All posts rendered — data came from server, no client fetch
    expect(screen.getByTestId("post-list")).toBeInTheDocument();
    expect(screen.getByTestId("post-1")).toBeInTheDocument();
    expect(screen.getByTestId("post-2")).toBeInTheDocument();
    expect(screen.getByTestId("post-3")).toBeInTheDocument();
  });

  it("server → client boundary: server passes serialisable props to client component", async () => {
    const user = userEvent.setup();
    const posts = await fetchPosts();

    render(<PostList posts={posts} />);

    // LikeButton is a Client Component — receives numeric props from Server
    const likeBtn = screen.getByTestId("like-1");
    expect(likeBtn).toHaveTextContent("1200");

    // Client interactivity works (event handler attached)
    await user.click(likeBtn);
    expect(likeBtn).toHaveTextContent("1201");
    expect(likeBtn).toBeDisabled(); // can't like twice
  });

  it("cache() deduplicates identical server-side calls within a request", async () => {
    fetchCallCount = 0;
    // Fresh cache per test — avoids cross-test cache hits
    const dedupedUser = cache(async (id: string): Promise<User> => {
      fetchCallCount++;
      return fetchUser(id);
    });

    // Three calls with same id — should only fetch once
    const [a, b, c] = await Promise.all([
      dedupedUser("u1"),
      dedupedUser("u1"),
      dedupedUser("u1"),
    ]);

    expect(a.name).toBe("Alice Admin");
    expect(b.name).toBe("Alice Admin");
    expect(c.name).toBe("Alice Admin");

    // Underlying fetch only called once — cache() deduplicated
    expect(fetchCallCount).toBe(1);
  });

  it("cache() does NOT deduplicate calls with different arguments", async () => {
    fetchCallCount = 0;
    // Fresh cache per test — avoids cross-test cache hits
    const freshCachedUser = cache(async (id: string): Promise<User> => {
      fetchCallCount++;
      return fetchUser(id);
    });

    const [alice, bob] = await Promise.all([
      freshCachedUser("u1"),
      freshCachedUser("u2"),
    ]);

    expect(alice.name).toBe("Alice Admin");
    expect(bob.name).toBe("Bob User");

    // Different ids → different cache keys → two fetches
    expect(fetchCallCount).toBe(2);
  });

  it("Server Action: createPost validates and persists data on the server", async () => {
    serverPosts = []; // reset

    const result = await createPost({ title: "My Post", slug: "my-post" });

    expect(result.success).toBe(true);
    expect(result.post?.title).toBe("My Post");
    expect(result.post?.views).toBe(0);
    expect(serverPosts).toHaveLength(1);
  });

  it("Server Action: returns validation error for missing title", async () => {
    const result = await createPost({ title: "", slug: "my-post" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("Title is required");
  });

  it("Server Action: client form submits and shows result", async () => {
    serverPosts = [];
    const user = userEvent.setup();
    const onSuccess = jest.fn();

    render(<CreatePostForm onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText("Title"), "Edge Rendering");
    await user.type(screen.getByLabelText("Slug"), "edge-rendering");
    await user.click(screen.getByRole("button", { name: "Create post" }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onSuccess.mock.calls[0][0]).toMatchObject({
      title: "Edge Rendering",
      slug: "edge-rendering",
    });
  });

  it("Server Action: duplicate slug returns error to client", async () => {
    serverPosts = [
      { id: 1, title: "Existing", slug: "my-slug", publishedAt: "2026-01-01", views: 0 },
    ];
    const user = userEvent.setup();

    render(<CreatePostForm />);

    await user.type(screen.getByLabelText("Title"), "Another Post");
    await user.type(screen.getByLabelText("Slug"), "my-slug");
    await user.click(screen.getByRole("button", { name: "Create post" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Slug already exists");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. MIDDLEWARE & EDGE RUNTIME
// ═══════════════════════════════════════════════════════════════════════════════

describe("3 — Middleware & Edge Runtime", () => {
  const makeRequest = (
    url: string,
    cookies: Record<string, string> = {},
    geo?: { country?: string }
  ): Request => ({
    url,
    cookies: new Map(Object.entries(cookies)),
    headers: new Map(),
    geo,
  });

  it("middleware redirects unauthenticated requests to /dashboard", () => {
    const req = makeRequest("https://example.com/dashboard/settings");
    const result = middleware(req);
    expect(result.action).toBe("redirect");
    expect(result.destination).toBe("/login");
  });

  it("middleware allows authenticated requests through to /dashboard", () => {
    const req = makeRequest(
      "https://example.com/dashboard/settings",
      { "auth-token": "valid-jwt-token" }
    );
    const result = middleware(req);
    expect(result.action).toBe("next");
  });

  it("middleware rewrites A/B variant B users to /home-v2", () => {
    const req = makeRequest("https://example.com/", { "ab-variant": "b" });
    const result = middleware(req);
    expect(result.action).toBe("rewrite");
    expect(result.destination).toBe("/home-v2");
  });

  it("middleware serves default for A/B variant A users", () => {
    const req = makeRequest("https://example.com/", { "ab-variant": "a" });
    const result = middleware(req);
    expect(result.action).toBe("next");
  });

  it("middleware blocks requests from restricted regions", () => {
    const req = makeRequest("https://example.com/blog", {}, { country: "XX" });
    const result = middleware(req);
    expect(result.action).toBe("redirect");
    expect(result.destination).toBe("/not-available");
  });

  it("middleware injects rate limit headers on normal requests", () => {
    const req = makeRequest("https://example.com/blog");
    const result = middleware(req);
    expect(result.action).toBe("next");
    expect(result.headers?.["X-RateLimit-Remaining"]).toBe("99");
  });

  it("Edge Runtime: web APIs are available", () => {
    const edgeAvailableAPIs = [
      "fetch", "Request", "Response", "Headers",
      "URL", "URLSearchParams", "TextEncoder", "TextDecoder",
      "crypto", "ReadableStream",
    ];
    edgeAvailableAPIs.forEach(api => {
      expect(checkEdgeCompatibility(api)).toBe(true);
    });
  });

  it("Edge Runtime: Node.js built-ins are NOT available", () => {
    const nodeOnlyAPIs = ["fs", "path", "net", "os", "child_process"];
    nodeOnlyAPIs.forEach(api => {
      expect(checkEdgeCompatibility(api)).toBe(false);
    });
  });

  it("streaming at edge: Suspense boundaries work with edge-rendered shell", async () => {
    // Simulate: edge renders shell instantly, Suspense boundaries fill in
    const SlowData = lazy(() =>
      new Promise<{ default: React.FC }>(resolve =>
        setTimeout(() => resolve({
          default: () => <div data-testid="edge-data">Data from origin</div>,
        }), 20)
      )
    );

    render(
      <div data-testid="edge-shell">
        <h1>Edge-rendered shell</h1>
        <Suspense fallback={<div data-testid="edge-loading">Loading data…</div>}>
          <SlowData />
        </Suspense>
      </div>
    );

    // Shell available immediately (edge rendered)
    expect(screen.getByTestId("edge-shell")).toBeInTheDocument();
    expect(screen.getByTestId("edge-loading")).toBeInTheDocument();

    // Data streams in from origin
    expect(await screen.findByTestId("edge-data")).toBeInTheDocument();
    expect(screen.queryByTestId("edge-loading")).not.toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. METADATA & ROUTE PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

describe("4 — Metadata & route segment patterns", () => {
  // Simulate Next.js generateMetadata function
  const generateMetadata = async (params: { slug: string }) => {
    const posts = await fetchPosts();
    const post = posts.find(p => p.slug === params.slug);
    if (!post) return { title: "Not Found", description: "" };
    return {
      title: `${post.title} | My Blog`,
      description: `${post.title} — ${post.views} views`,
      openGraph: {
        title: post.title,
        type: "article",
        publishedTime: post.publishedAt,
      },
    };
  };

  it("generateMetadata returns correct title and description for a known slug", async () => {
    const meta = await generateMetadata({ slug: "rsc" });
    expect(meta.title).toBe("React Server Components | My Blog");
    expect(meta.description).toContain("1200 views");
  });

  it("generateMetadata returns not-found fallback for unknown slug", async () => {
    const meta = await generateMetadata({ slug: "unknown-slug" });
    expect(meta.title).toBe("Not Found");
  });

  it("generateMetadata includes OpenGraph data for social sharing", async () => {
    const meta = await generateMetadata({ slug: "app-router" });
    expect((meta as { openGraph?: { type?: string } }).openGraph?.type).toBe("article");
    expect((meta as { openGraph?: { title?: string } }).openGraph?.title).toBe("Next.js App Router");
  });

  // Route segment config simulation
  it("route segment config determines rendering strategy", () => {
    // Simulates what happens when you export these constants from a page.tsx

    const staticSegment = {
      dynamic: "error" as const,         // error if dynamic usage detected
      revalidate: false as const,        // never revalidate — purely static
    };

    const dynamicSegment = {
      dynamic: "force-dynamic" as const, // always SSR
      revalidate: 0 as const,            // no caching
    };

    const isrSegment = {
      revalidate: 3600,                  // regenerate every hour
    };

    // Static segment: page is baked at build time, never regenerated
    expect(staticSegment.dynamic).toBe("error");
    expect(staticSegment.revalidate).toBe(false);

    // Dynamic segment: page runs on every request (like SSR)
    expect(dynamicSegment.dynamic).toBe("force-dynamic");
    expect(dynamicSegment.revalidate).toBe(0);

    // ISR segment: page cached, regenerated periodically
    expect(isrSegment.revalidate).toBe(3600);
  });

  it("parallel routes allow independent sections to load and update", async () => {
    // Simulates @modal + @sidebar parallel route slots
    const MainContent: React.FC = () => (
      <div data-testid="main-content">Main blog content</div>
    );
    const Sidebar = lazy(() =>
      new Promise<{ default: React.FC }>(r =>
        setTimeout(() => r({ default: () => <aside data-testid="sidebar">Sidebar</aside> }), 10)
      )
    );
    const Modal = lazy(() =>
      new Promise<{ default: React.FC }>(r =>
        setTimeout(() => r({ default: () => <dialog data-testid="modal">Modal</dialog> }), 20)
      )
    );

    render(
      <div data-testid="parallel-layout">
        <MainContent />
        <Suspense fallback={<div data-testid="sidebar-loading">Loading sidebar…</div>}>
          <Sidebar />
        </Suspense>
        <Suspense fallback={<div data-testid="modal-loading">Loading modal…</div>}>
          <Modal />
        </Suspense>
      </div>
    );

    // Main content is immediately available
    expect(screen.getByTestId("main-content")).toBeInTheDocument();

    // Parallel routes load independently
    expect(await screen.findByTestId("sidebar")).toBeInTheDocument();
    expect(await screen.findByTestId("modal")).toBeInTheDocument();
  });
});
