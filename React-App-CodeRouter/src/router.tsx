// FILE: src/router.tsx
//
// CODE-BASED ROUTING — the entire route tree is assembled here manually.
//
// CONTRAST WITH FILE-BASED ROUTING (React-App-FileRouter):
//   File-based:  create a file → route exists automatically (plugin does the wiring)
//   Code-based:  create a route object → manually add it to the tree → router sees it
//
// KEY APIs:
//   createRootRouteWithContext() — root layout + typed loader context
//   createRoute()               — a single route (path + component + loader + …)
//   route.addChildren()         — nest child routes under a parent
//   createRouter()              — combine the tree + config into the final router
//   lazyRouteComponent()        — code-split a component (lazy loading)

import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  Link,
  redirect,
} from "@tanstack/react-router";
import { z } from "zod";
import { authStore } from "./auth";

// ─── Pages ───────────────────────────────────────────────────────────────────
import { HomePage }          from "./pages/Home";
import { AboutPage }         from "./pages/About";
import { UsersPage }         from "./pages/Users";
import { UserDetailPage }    from "./pages/UserDetail";
import { ProductsPage }      from "./pages/Products";
import { ProductDetailPage } from "./pages/ProductDetail";
import { ContactPage }       from "./pages/Contact";
import { LoginPage }         from "./pages/Login";
import { DashboardPage }     from "./pages/Dashboard";

// ─── Mock data ────────────────────────────────────────────────────────────────
const USERS = [
  { id: "1", name: "Alice Johnson", role: "Admin",     email: "alice@example.com", joined: "Jan 2022" },
  { id: "2", name: "Bob Smith",     role: "Developer", email: "bob@example.com",   joined: "Mar 2022" },
  { id: "3", name: "Carol White",   role: "Designer",  email: "carol@example.com", joined: "Jun 2023" },
  { id: "4", name: "Dave Brown",    role: "Manager",   email: "dave@example.com",  joined: "Sep 2023" },
];

const ALL_PRODUCTS: Record<string, { id: string; name: string; category: string; price: number; description: string }> = {
  "1": { id: "1", name: "Mechanical Keyboard", category: "tech",      price: 129, description: "Tactile switches, RGB backlight, TKL layout." },
  "2": { id: "2", name: "Ergonomic Chair",      category: "furniture", price: 399, description: "Lumbar support, adjustable arms, mesh back." },
  "3": { id: "3", name: "USB-C Hub",            category: "tech",      price: 49,  description: "7-in-1: HDMI, USB-A×3, SD, microSD, PD." },
  "4": { id: "4", name: "Standing Desk",        category: "furniture", price: 599, description: "Electric height adjustment, memory presets." },
};

const PRODUCT_REVIEWS: Record<string, { reviewer: string; rating: number; comment: string }[]> = {
  "1": [{ reviewer: "Alice", rating: 5, comment: "Love the tactile feel!" }, { reviewer: "Bob", rating: 4, comment: "Great but a bit loud." }],
  "2": [{ reviewer: "Carol", rating: 5, comment: "Back pain gone in a week." }],
  "3": [{ reviewer: "Dave",  rating: 4, comment: "Works great with MacBook." }],
  "4": [{ reviewer: "Bob",   rating: 5, comment: "Changed my work life." }, { reviewer: "Alice", rating: 4, comment: "Worth every cent." }],
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONCEPT: Context in loaders
// Define the shape of router-level context.
// Every loader receives this via the `context` argument — fully typed.
// ═══════════════════════════════════════════════════════════════════════════════
export type RouterContext = {
  theme: "light" | "dark";
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1 — Root route
// ═══════════════════════════════════════════════════════════════════════════════
// CONCEPT: createRootRouteWithContext<RouterContext>()
// Instead of createRootRoute(), this version types the `context` object so every
// child loader can access it safely. The actual values are set in createRouter().
// Note the double-call: createRootRouteWithContext<T>()({ ...options })

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <div style={{ fontFamily: "sans-serif", maxWidth: "860px", margin: "0 auto", padding: "20px" }}>
      <nav style={{ display: "flex", gap: "4px", marginBottom: "24px", flexWrap: "wrap" }}>
        {[
          { to: "/",          label: "Home",      exact: true  },
          { to: "/about",     label: "About",     exact: false },
          { to: "/users",     label: "Users",     exact: false },
          { to: "/products",  label: "Products",  exact: false },
          { to: "/contact",   label: "Contact",   exact: false },
          { to: "/lazy-demo", label: "Lazy Demo", exact: false },
          { to: "/dashboard", label: "Dashboard", exact: false },
          { to: "/login",     label: "Login",     exact: false },
        ].map(({ to, label, exact }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact }}
            style={{ padding: "6px 14px", background: "#eee", borderRadius: "4px", textDecoration: "none", color: "#333", fontSize: "14px" }}
            activeProps={{ style: { padding: "6px 14px", background: "#e67e22", borderRadius: "4px", textDecoration: "none", color: "#fff", fontSize: "14px", fontWeight: "bold" } }}
          >
            {label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </div>
  ),
  notFoundComponent: () => (
    <div style={{ textAlign: "center", color: "#e74c3c" }}>
      <h2>404 — Not Found</h2>
      <Link to="/">Go Home</Link>
    </div>
  ),
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2 — Define each route
// ═══════════════════════════════════════════════════════════════════════════════

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/about",
  component: AboutPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  validateSearch: z.object({ redirect: z.string().optional() }),
  component: LoginPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  beforeLoad: ({ location }) => {
    if (!authStore.isLoggedIn()) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: DashboardPage,
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users",
  staleTime: 10_000,
  pendingComponent: () => <p style={{ color: "#888" }}>⟳ Loading users...</p>,
  loader: async () => {
    await new Promise((r) => setTimeout(r, 1000));
    return USERS;
  },
  component: UsersPage,
});

const userDetailRoute = createRoute({
  getParentRoute: () => usersRoute,
  path: "$userId",
  pendingComponent: () => <p style={{ color: "#888" }}>⟳ Loading user...</p>,
  loader: async ({ params }) => {
    await new Promise((r) => setTimeout(r, 600));
    const user = USERS.find((u) => u.id === params.userId);
    if (!user) throw new Error(`User "${params.userId}" not found`);
    return user;
  },
  errorComponent: ({ error }) => (
    <div style={{ color: "#e74c3c", padding: "10px", background: "#fff5f5", borderRadius: "6px" }}>
      <strong>Error:</strong> {(error as Error).message}
    </div>
  ),
  component: UserDetailPage,
});

const productsSearchSchema = z.object({
  category: z.enum(["all", "tech", "furniture"]).optional().default("all"),
  sort:     z.enum(["name", "price"]).optional().default("name"),
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products",
  validateSearch: productsSearchSchema,
  loaderDeps: ({ search }) => ({ category: search.category, sort: search.sort }),
  staleTime: 15_000,
  pendingComponent: () => <p style={{ color: "#888" }}>⟳ Filtering products...</p>,

  // CONCEPT: Context in loaders
  // `context` is typed as RouterContext because the root route uses
  // createRootRouteWithContext<RouterContext>(). Access context.theme safely.
  loader: async ({ deps, context }) => {
    await new Promise((r) => setTimeout(r, 700));
    const themeNote = `Loaded with theme: ${context.theme}`;
    let products = Object.values(
      deps.category === "all"
        ? ALL_PRODUCTS
        : Object.fromEntries(Object.entries(ALL_PRODUCTS).filter(([, p]) => p.category === deps.category))
    );
    products = [...products].sort((a, b) =>
      deps.sort === "price" ? a.price - b.price : a.name.localeCompare(b.name)
    );
    return { products, themeNote };
  },
  component: ProductsPage,
});

// /products/$productId — nested under productsRoute
// CONCEPT: Parallel loaders
// Promise.all runs both fetches at the same time.
// Total time = max(fetch1, fetch2), not their sum.
const productDetailRoute = createRoute({
  getParentRoute: () => productsRoute,
  path: "$productId",
  pendingComponent: () => <p style={{ color: "#888" }}>⟳ Loading product + reviews in parallel...</p>,
  errorComponent: ({ error }) => (
    <div style={{ color: "#e74c3c", padding: "10px", background: "#fff5f5", borderRadius: "6px" }}>
      <strong>Product not found:</strong> {(error as Error).message}
    </div>
  ),
  loader: async ({ params }) => {
    // CONCEPT: Parallel loaders — both fetches run simultaneously via Promise.all.
    // If fetchProduct takes 600ms and fetchReviews takes 400ms,
    // total wait = 600ms (not 1000ms like sequential would be).
    const [product, reviews] = await Promise.all([
      new Promise<(typeof ALL_PRODUCTS)[string]>((resolve, reject) =>
        setTimeout(() => {
          const p = ALL_PRODUCTS[params.productId];
          if (p) resolve(p);
          else reject(new Error(`Product "${params.productId}" not found`));
        }, 600)
      ),
      new Promise<{ reviewer: string; rating: number; comment: string }[]>((resolve) =>
        setTimeout(() => resolve(PRODUCT_REVIEWS[params.productId] ?? []), 400)
      ),
    ]);
    return { product, reviews };
  },
  component: ProductDetailPage,
});

const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contact",
  component: ContactPage,
});

// CONCEPT: Lazy routes — lazyRouteComponent
// The LazyPage component is NOT bundled into main.js.
// Vite splits it into a separate chunk, downloaded only when /lazy-demo is visited.
// pendingComponent shows while the chunk is being downloaded.
const lazyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/lazy-demo",
  component: lazyRouteComponent(() => import("./pages/LazyPage")),
  pendingComponent: () => (
    <div style={{ color: "#888" }}>
      ⟳ Downloading component chunk...
      <p style={{ fontSize: "13px", margin: "4px 0 0" }}>
        Open DevTools → Network tab to see the chunk arrive.
      </p>
    </div>
  ),
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3 — Assemble the route tree manually
// ═══════════════════════════════════════════════════════════════════════════════

const routeTree = rootRoute.addChildren([
  indexRoute,
  aboutRoute,
  loginRoute,
  dashboardRoute,
  usersRoute.addChildren([userDetailRoute]),
  // productsRoute owns $productId — nested so params are available
  productsRoute.addChildren([productDetailRoute]),
  contactRoute,
  lazyRoute,
]);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4 — Create the router
// ═══════════════════════════════════════════════════════════════════════════════

export const router = createRouter({
  routeTree,
  defaultPendingMs:    500,
  defaultPendingMinMs: 300,
  scrollRestoration:   true,

  // CONCEPT: Context in loaders
  // These values flow into every loader's `context` argument.
  // Typed as RouterContext because createRootRouteWithContext<RouterContext>() was used.
  context: {
    theme: "light",
  } satisfies RouterContext,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
