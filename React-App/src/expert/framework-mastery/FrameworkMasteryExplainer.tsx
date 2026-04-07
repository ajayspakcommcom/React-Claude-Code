// TOPIC: Framework Mastery — Visual Explainer
// Next.js App Router, Server Components, Edge Rendering

import React, { useState } from "react";

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = {
  container: { fontFamily: "monospace", fontSize: 13, padding: 20, maxWidth: 900 } as React.CSSProperties,
  h2: { fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#1e293b" } as React.CSSProperties,
  h3: { fontSize: 15, fontWeight: 700, marginBottom: 8, color: "#334155" } as React.CSSProperties,
  tabs: { display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" as const },
  tab: (active: boolean): React.CSSProperties => ({
    padding: "6px 14px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    background: active ? "#6366f1" : "#e2e8f0",
    color: active ? "#fff" : "#334155",
    fontFamily: "monospace",
    fontSize: 12,
    fontWeight: 600,
  }),
  code: {
    background: "#0f172a",
    color: "#e2e8f0",
    borderRadius: 8,
    padding: "14px 16px",
    overflowX: "auto" as const,
    lineHeight: 1.6,
    fontSize: 12,
    marginBottom: 12,
  } as React.CSSProperties,
  card: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    padding: "12px 16px",
    marginBottom: 10,
  } as React.CSSProperties,
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 } as React.CSSProperties,
  label: (color: string): React.CSSProperties => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 4,
    background: color,
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
  }),
  pill: (ok: boolean): React.CSSProperties => ({
    display: "inline-block",
    padding: "1px 8px",
    borderRadius: 10,
    background: ok ? "#dcfce7" : "#fee2e2",
    color: ok ? "#166534" : "#991b1b",
    fontSize: 11,
    fontWeight: 600,
    marginRight: 4,
  }),
  row: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6 } as React.CSSProperties,
  divider: { border: "none", borderTop: "1px solid #e2e8f0", margin: "16px 0" } as React.CSSProperties,
  note: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: 6,
    padding: "8px 12px",
    fontSize: 12,
    marginBottom: 10,
    color: "#78350f",
  } as React.CSSProperties,
};

// ─── Demo 1: App Router File Conventions ─────────────────────────────────────

const FILE_CONVENTION_TABS = [
  "special files",
  "route patterns",
  "data fetching",
  "segment config",
] as const;

type FileTab = (typeof FILE_CONVENTION_TABS)[number];

const AppRouterDemo: React.FC = () => {
  const [tab, setTab] = useState<FileTab>("special files");

  return (
    <div>
      <div style={s.tabs}>
        {FILE_CONVENTION_TABS.map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "special files" && (
        <>
          <div style={s.note}>
            Every folder in <code>app/</code> is a route segment. Drop a special file inside to activate that behaviour.
          </div>
          {[
            { file: "page.tsx", desc: "Unique UI for the route. Makes the segment publicly accessible.", required: true },
            { file: "layout.tsx", desc: "Shared UI that wraps page + children. Persists across navigation (state preserved).", required: false },
            { file: "loading.tsx", desc: "Suspense fallback rendered while page/data loads. Like a skeleton screen.", required: false },
            { file: "error.tsx", desc: "Error boundary for the segment. Must be a Client Component ('use client').", required: false },
            { file: "not-found.tsx", desc: "Rendered when notFound() is thrown. Also catches 404 from the segment.", required: false },
            { file: "route.ts", desc: "API endpoint handler. Replaces pages/api/*. Receives Request, returns Response.", required: false },
            { file: "middleware.ts", desc: "Runs before every request. Auth guards, A/B tests, redirects. Edge only.", required: false },
            { file: "template.tsx", desc: "Like layout but re-mounts on every navigation. Useful for animations.", required: false },
          ].map(({ file, desc, required }) => (
            <div key={file} style={{ ...s.card, display: "flex", gap: 12, alignItems: "flex-start" }}>
              <code style={{ color: "#6366f1", minWidth: 120, fontWeight: 700 }}>{file}</code>
              <span style={{ color: "#475569", fontSize: 12 }}>{desc}</span>
              {required && <span style={s.pill(true)}>required</span>}
            </div>
          ))}
        </>
      )}

      {tab === "route patterns" && (
        <>
          <div style={s.note}>
            The folder name determines the URL segment. Special syntax creates dynamic and grouped routes.
          </div>
          <div style={s.code}>
            {`app/
├── page.tsx                          → /
├── about/page.tsx                    → /about
├── blog/
│   ├── page.tsx                      → /blog
│   └── [slug]/page.tsx               → /blog/:slug   (dynamic)
├── docs/[...path]/page.tsx           → /docs/a/b/c   (catch-all)
├── help/[[...path]]/page.tsx         → /help OR /help/a/b  (optional)
├── (marketing)/                      → route group — no URL segment
│   ├── about/page.tsx                → /about
│   └── pricing/page.tsx              → /pricing
├── @modal/                           → parallel route slot
│   └── photo/page.tsx                → slot rendered alongside main
└── (.)photo/[id]/page.tsx            → intercepting route`}
          </div>
          <div style={s.grid}>
            <div style={s.card}>
              <div style={s.label("#6366f1")}>Route Groups (marketing)</div>
              <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>
                Wrap folders in <code>()</code> to organise routes without affecting the URL. Share a layout across a subset of routes.
              </p>
            </div>
            <div style={s.card}>
              <div style={s.label("#0891b2")}>Parallel Routes @slot</div>
              <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>
                Render multiple independent pages in the same layout simultaneously. Each slot loads and updates independently.
              </p>
            </div>
          </div>
        </>
      )}

      {tab === "data fetching" && (
        <>
          <div style={s.note}>
            Next.js extends the native <code>fetch()</code> API with cache options. These map to rendering strategies.
          </div>
          {[
            {
              label: "force-cache",
              color: "#059669",
              strategy: "Static (SSG)",
              desc: "Data fetched at build time. Never refetched. Fastest TTFB.",
              code: `fetch('/api/posts', { cache: 'force-cache' })`,
            },
            {
              label: "no-store",
              color: "#dc2626",
              strategy: "Dynamic (SSR)",
              desc: "Data fetched on every request. Always fresh. Slowest.",
              code: `fetch('/api/posts', { cache: 'no-store' })`,
            },
            {
              label: "revalidate",
              color: "#d97706",
              strategy: "ISR",
              desc: "Cached but expires after N seconds. Best of both worlds.",
              code: `fetch('/api/posts', { next: { revalidate: 60 } })`,
            },
            {
              label: "tags",
              color: "#7c3aed",
              strategy: "On-demand ISR",
              desc: "Tagged cache entry. Invalidate programmatically via revalidateTag().",
              code: `fetch('/api/posts', { next: { tags: ['posts'] } })`,
            },
          ].map(({ label, color, strategy, desc, code: snippet }) => (
            <div key={label} style={s.card}>
              <div style={s.row}>
                <span style={s.label(color)}>{label}</span>
                <strong style={{ fontSize: 12 }}>{strategy}</strong>
              </div>
              <p style={{ margin: "0 0 6px", fontSize: 12, color: "#475569" }}>{desc}</p>
              <div style={{ ...s.code, marginBottom: 0 }}>{snippet}</div>
            </div>
          ))}
        </>
      )}

      {tab === "segment config" && (
        <>
          <div style={s.note}>
            Export these constants from any <code>page.tsx</code> or <code>layout.tsx</code> to control rendering behaviour.
          </div>
          <div style={s.code}>
            {`// Force all requests to be dynamic (SSR)
export const dynamic = 'force-dynamic';

// ISR — regenerate every hour
export const revalidate = 3600;

// Run on edge runtime (V8 isolates)
export const runtime = 'edge';

// Override all fetches in the segment
export const fetchCache = 'force-no-store';

// Opt out of dynamic behaviour entirely (fail at build if dynamic usage found)
export const dynamic = 'error';`}
          </div>
          <div style={s.grid}>
            {[
              { key: "dynamic", values: ["'auto'", "'force-dynamic'", "'error'", "'force-static'"] },
              { key: "revalidate", values: ["false (never)", "0 (always)", "3600 (1hr ISR)"] },
              { key: "runtime", values: ["'nodejs' (default)", "'edge'"] },
              { key: "fetchCache", values: ["'auto'", "'force-cache'", "'force-no-store'"] },
            ].map(({ key, values }) => (
              <div key={key} style={s.card}>
                <code style={{ color: "#6366f1", fontWeight: 700 }}>{key}</code>
                <ul style={{ margin: "6px 0 0", paddingLeft: 16, fontSize: 11, color: "#475569" }}>
                  {values.map(v => <li key={v}>{v}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Demo 2: Server vs Client Components ─────────────────────────────────────

const RSC_TABS = ["comparison", "data flow", "server actions", "cache()"] as const;
type RscTab = (typeof RSC_TABS)[number];

const ServerComponentsDemo: React.FC = () => {
  const [tab, setTab] = useState<RscTab>("comparison");

  return (
    <div>
      <div style={s.tabs}>
        {RSC_TABS.map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "comparison" && (
        <>
          <div style={s.grid}>
            <div style={{ ...s.card, borderTop: "3px solid #6366f1" }}>
              <div style={s.label("#6366f1")}>Server Component (default)</div>
              {[
                { can: true, text: "async / await data directly" },
                { can: true, text: "import server-only libs (db, fs)" },
                { can: true, text: "read environment variables" },
                { can: true, text: "zero JS sent to client" },
                { can: false, text: "useState / useEffect" },
                { can: false, text: "onClick, onChange handlers" },
                { can: false, text: "window / document / localStorage" },
                { can: false, text: "Context consumers" },
              ].map(({ can, text }) => (
                <div key={text} style={s.row}>
                  <span style={{ fontSize: 14 }}>{can ? "✅" : "❌"}</span>
                  <span style={{ fontSize: 12, color: "#334155" }}>{text}</span>
                </div>
              ))}
            </div>
            <div style={{ ...s.card, borderTop: "3px solid #0891b2" }}>
              <div style={s.label("#0891b2")}>Client Component ('use client')</div>
              {[
                { can: true, text: "useState, useEffect, all hooks" },
                { can: true, text: "onClick, onChange, all events" },
                { can: true, text: "browser APIs (window, localStorage)" },
                { can: true, text: "Context consumers" },
                { can: false, text: "async component function" },
                { can: false, text: "import server-only modules" },
                { can: false, text: "access filesystem / DB directly" },
                { can: false, text: "read secrets (only via props)" },
              ].map(({ can, text }) => (
                <div key={text} style={s.row}>
                  <span style={{ fontSize: 14 }}>{can ? "✅" : "❌"}</span>
                  <span style={{ fontSize: 12, color: "#334155" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={s.note}>
            <strong>Key insight:</strong> Server Components run once on the server — their output (React elements) is serialized and sent to the browser as RSC payload. No component code or secrets reach the client.
          </div>
        </>
      )}

      {tab === "data flow" && (
        <>
          <div style={s.note}>
            Server Components fetch data and pass it as <strong>serialisable props</strong> to Client Components. The boundary is one-way.
          </div>
          <div style={s.code}>
            {`// ✅ Server Component — async, fetches directly
// app/blog/page.tsx  (no 'use client')
async function BlogPage() {
  const posts = await db.post.findMany();   // runs on server only

  return (
    <div>
      {posts.map(post => (
        // ✅ pass serialisable props to Client Component
        <LikeButton key={post.id} postId={post.id} initialLikes={post.likes} />
      ))}
    </div>
  );
}

// ✅ Client Component — receives props, handles interaction
// components/LikeButton.tsx
'use client'

function LikeButton({ postId, initialLikes }: { postId: number; initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);
  return <button onClick={() => setLikes(l => l + 1)}>{likes} likes</button>;
}

// ❌ This would BREAK — cannot pass a function from server to client
<LikeButton onLike={async (id) => { await db.update(id); }} />`}
          </div>
          <div style={s.card}>
            <strong style={{ fontSize: 12 }}>Serialisable props:</strong>
            <div style={{ marginTop: 6 }}>
              {[
                { ok: true, type: "string, number, boolean, null, undefined" },
                { ok: true, type: "plain objects and arrays" },
                { ok: true, type: "Date, Map, Set (serialised)" },
                { ok: false, type: "functions (closures, callbacks)" },
                { ok: false, type: "class instances with methods" },
                { ok: false, type: "React components (as props)" },
              ].map(({ ok, type }) => (
                <div key={type} style={s.row}>
                  <span style={s.pill(ok)}>{ok ? "✓" : "✗"}</span>
                  <code style={{ fontSize: 11, color: "#334155" }}>{type}</code>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "server actions" && (
        <>
          <div style={s.note}>
            <strong>'use server'</strong> marks a function as a Server Action — it runs on the server and can be called from the client. Replaces API routes for mutations.
          </div>
          <div style={s.code}>
            {`// actions/posts.ts
'use server'

import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string;

  // Runs on the server — can access DB directly
  const post = await db.post.create({ data: { title } });

  // Revalidate the /blog page cache
  revalidatePath('/blog');

  return { success: true, post };
}

// ─── Client Component uses the Server Action ───────────────────────
'use client'

import { createPost } from '@/actions/posts';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>{pending ? 'Saving…' : 'Create'}</button>;
}

function NewPostForm() {
  return (
    // Next.js wires this up as a progressive enhancement
    <form action={createPost}>
      <input name="title" required />
      <SubmitButton />
    </form>
  );
}`}
          </div>
        </>
      )}

      {tab === "cache()" && (
        <>
          <div style={s.note}>
            <code>cache()</code> from React deduplicates identical async function calls within a single server request — like React's <code>memo</code> but for async server functions.
          </div>
          <div style={s.code}>
            {`import { cache } from 'react';

// Wrap expensive async functions with cache()
const getUser = cache(async (id: string) => {
  console.log('Fetching user', id);       // only logs once per request
  return await db.user.findUnique({ where: { id } });
});

// ─── Used in multiple Server Components ───────────────────────────

async function ProfileHeader() {
  const user = await getUser('u1');        // fetch runs here
  return <h1>{user.name}</h1>;
}

async function ProfileStats() {
  const user = await getUser('u1');        // deduplicated — no second fetch
  return <p>{user.posts} posts</p>;
}

// Both components called in same request →  only ONE database query
// Without cache() → TWO database queries`}
          </div>
          <div style={s.grid}>
            <div style={s.card}>
              <div style={s.label("#6366f1")}>Same request</div>
              <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>
                <code>cache()</code> deduplicates. Call the same function 10 times with the same args → 1 underlying fetch.
              </p>
            </div>
            <div style={s.card}>
              <div style={s.label("#0891b2")}>Different requests</div>
              <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>
                Cache is per-request. User A and User B never share the same cache entry — no cross-user data leaks.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Demo 3: Edge Runtime & Middleware ───────────────────────────────────────

const EDGE_TABS = ["edge vs node", "middleware patterns", "streaming at edge"] as const;
type EdgeTab = (typeof EDGE_TABS)[number];

const EdgeRenderingDemo: React.FC = () => {
  const [tab, setTab] = useState<EdgeTab>("edge vs node");
  const [middlewareCase, setMiddlewareCase] = useState<"auth" | "ab" | "geo" | "ratelimit">("auth");

  const middlewareExamples = {
    auth: {
      label: "Auth Guard",
      desc: "Redirect unauthenticated users before they ever reach the route handler.",
      code: `export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/account/:path*'],
};`,
    },
    ab: {
      label: "A/B Testing",
      desc: "Split traffic between two variants by rewriting the URL transparently.",
      code: `export function middleware(request: NextRequest) {
  const variant = request.cookies.get('ab-variant')?.value ?? 'a';

  if (request.nextUrl.pathname === '/') {
    if (variant === 'b') {
      return NextResponse.rewrite(new URL('/home-v2', request.url));
    }
  }
  return NextResponse.next();
}`,
    },
    geo: {
      label: "Geolocation",
      desc: "Block or redirect requests based on the user's country.",
      code: `export function middleware(request: NextRequest) {
  const country = request.geo?.country;
  const blockedCountries = ['XX', 'YY'];

  if (blockedCountries.includes(country ?? '')) {
    return NextResponse.redirect(new URL('/not-available', request.url));
  }
  return NextResponse.next();
}`,
    },
    ratelimit: {
      label: "Rate Limiting",
      desc: "Inject headers or return 429 when a client exceeds request limits.",
      code: `export function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const remaining = getRateLimitRemaining(ip);   // edge KV store

  if (remaining <= 0) {
    return new NextResponse('Too many requests', { status: 429 });
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  return response;
}`,
    },
  };

  return (
    <div>
      <div style={s.tabs}>
        {EDGE_TABS.map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "edge vs node" && (
        <>
          <div style={s.note}>
            Edge Runtime runs your code in V8 isolates at CDN PoPs worldwide — closer to users, faster cold starts, but a limited subset of Node.js APIs.
          </div>
          <div style={s.grid}>
            <div style={{ ...s.card, borderTop: "3px solid #059669" }}>
              <div style={s.label("#059669")}>Available on Edge</div>
              {[
                "fetch / Request / Response / Headers",
                "URL / URLSearchParams",
                "TextEncoder / TextDecoder",
                "Web Crypto API (crypto.subtle)",
                "ReadableStream / WritableStream",
                "setTimeout / setInterval",
                "console.*",
                "structuredClone",
              ].map(api => (
                <div key={api} style={{ fontSize: 12, color: "#166534", padding: "2px 0" }}>✅ {api}</div>
              ))}
            </div>
            <div style={{ ...s.card, borderTop: "3px solid #dc2626" }}>
              <div style={s.label("#dc2626")}>NOT available on Edge</div>
              {[
                "fs (filesystem)",
                "path / os / net",
                "child_process",
                "Native Node modules (.node files)",
                "require() (CommonJS)",
                "Node-specific globals (Buffer, process.nextTick)",
                "Most ORM clients (Prisma needs Node adapter)",
                "Large npm packages with Node internals",
              ].map(api => (
                <div key={api} style={{ fontSize: 12, color: "#991b1b", padding: "2px 0" }}>❌ {api}</div>
              ))}
            </div>
          </div>
          <div style={s.card}>
            <strong style={{ fontSize: 12 }}>When to use Edge Runtime</strong>
            <ul style={{ fontSize: 12, color: "#475569", marginTop: 6, paddingLeft: 16 }}>
              <li>Middleware (auth, redirects, A/B) — runs before every request</li>
              <li>Personalised responses with low latency (geo, locale)</li>
              <li>Lightweight API routes that only use Web APIs</li>
              <li>Streaming responses closest to user</li>
            </ul>
          </div>
        </>
      )}

      {tab === "middleware patterns" && (
        <>
          <div style={s.tabs}>
            {(["auth", "ab", "geo", "ratelimit"] as const).map(c => (
              <button
                key={c}
                style={s.tab(middlewareCase === c)}
                onClick={() => setMiddlewareCase(c)}
              >
                {middlewareExamples[c].label}
              </button>
            ))}
          </div>
          <div style={s.note}>{middlewareExamples[middlewareCase].desc}</div>
          <div style={s.code}>{middlewareExamples[middlewareCase].code}</div>
        </>
      )}

      {tab === "streaming at edge" && (
        <>
          <div style={s.note}>
            Combine <strong>edge runtime</strong> + <strong>React Suspense</strong> for the lowest possible Time-to-First-Byte. The HTML shell is generated at the edge (fast), while slower data streams in from origin.
          </div>
          <div style={s.code}>
            {`// app/blog/page.tsx
export const runtime = 'edge';      // run at CDN edge nodes

// Shell rendered immediately at edge — no data needed
// Suspense boundaries fill in as data arrives from origin
export default function BlogPage() {
  return (
    <RootLayout>
      {/* Rendered immediately at edge */}
      <h1>Our Blog</h1>
      <nav>...</nav>

      {/* Suspense boundary streams in — data from DB/API */}
      <Suspense fallback={<PostsSkeleton />}>
        <PostList />           {/* async Server Component */}
      </Suspense>

      {/* Independent boundary — loads in parallel */}
      <Suspense fallback={<SidebarSkeleton />}>
        <TrendingSidebar />    {/* different async Server Component */}
      </Suspense>
    </RootLayout>
  );
}`}
          </div>
          <div style={s.grid}>
            <div style={s.card}>
              <div style={s.label("#059669")}>Shell (edge, instant)</div>
              <ul style={{ fontSize: 12, color: "#475569", margin: "6px 0 0", paddingLeft: 16 }}>
                <li>Layout, nav, headings</li>
                <li>Suspense skeletons</li>
                <li>Static content</li>
              </ul>
            </div>
            <div style={s.card}>
              <div style={s.label("#6366f1")}>Streams (origin, async)</div>
              <ul style={{ fontSize: 12, color: "#475569", margin: "6px 0 0", paddingLeft: 16 }}>
                <li>Database-fetched lists</li>
                <li>Personalised content</li>
                <li>Third-party API data</li>
              </ul>
            </div>
          </div>
          <div style={s.card}>
            <strong style={{ fontSize: 12 }}>Flow</strong>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: "#334155", marginTop: 6, lineHeight: 1.8 }}>
              1. Request hits CDN edge node<br />
              2. Edge renders shell HTML in &lt;1ms (no DB needed)<br />
              3. Shell flushed to browser — page starts rendering<br />
              4. Origin fetches resolve asynchronously<br />
              5. Streamed HTML chunks replace skeletons via&nbsp;<code>&lt;script&gt;</code> swap<br />
              6. React hydrates interactive islands
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Main Explainer ───────────────────────────────────────────────────────────

const MAIN_TABS = [
  "App Router",
  "Server Components",
  "Edge Rendering",
] as const;
type MainTab = (typeof MAIN_TABS)[number];

export const FrameworkMasteryExplainer: React.FC = () => {
  const [tab, setTab] = useState<MainTab>("App Router");

  return (
    <div style={s.container}>
      <h2 style={s.h2}>Expert — Framework Mastery</h2>
      <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>
        Next.js App Router · React Server Components · Edge Rendering
      </p>

      <div style={s.tabs}>
        {MAIN_TABS.map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "App Router" && (
        <>
          <h3 style={s.h3}>Next.js App Router</h3>
          <AppRouterDemo />
        </>
      )}

      {tab === "Server Components" && (
        <>
          <h3 style={s.h3}>React Server Components</h3>
          <ServerComponentsDemo />
        </>
      )}

      {tab === "Edge Rendering" && (
        <>
          <h3 style={s.h3}>Edge Runtime & Middleware</h3>
          <EdgeRenderingDemo />
        </>
      )}
    </div>
  );
};

export default FrameworkMasteryExplainer;
