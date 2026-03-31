// FILE: src/pages/Products.tsx
// ROUTE: /products
//
// Demonstrates: useSearch, useNavigate, Link activeOptions, route masking

import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";

const routeApi = getRouteApi("/products");

export function ProductsPage() {
  const { products, themeNote } = routeApi.useLoaderData();
  const { category, sort }      = routeApi.useSearch();
  const navigate                = useNavigate();

  const setCategory = (cat: typeof category) =>
    navigate({ to: "/products", search: { category: cat, sort } });

  const setSort = (s: typeof sort) =>
    navigate({ to: "/products", search: { category, sort: s } });

  return (
    <div>
      <h2>🛍️ Products</h2>

      {/* Context in loaders — value read from context.theme in router.tsx loader */}
      <p style={{ fontSize: "12px", color: "#888", margin: "0 0 12px" }}>{themeNote}</p>

      {/* Category filter — Link activeOptions includeSearch */}
      <div style={{ marginBottom: "12px" }}>
        <span style={{ fontSize: "13px", color: "#666", marginRight: "8px" }}>Category:</span>
        {(["all", "tech", "furniture"] as const).map((cat) => (
          <Link
            key={cat}
            to="/products"
            search={{ category: cat, sort }}
            activeOptions={{ exact: true, includeSearch: true }}
            style={{ padding: "4px 10px", marginRight: "4px", borderRadius: "4px", textDecoration: "none", background: "#eee", color: "#333", fontSize: "13px" }}
            activeProps={{ style: { padding: "4px 10px", marginRight: "4px", borderRadius: "4px", textDecoration: "none", background: "#e67e22", color: "#fff", fontSize: "13px", fontWeight: "bold" } }}
          >
            {cat}
          </Link>
        ))}

        <span style={{ fontSize: "13px", color: "#666", margin: "0 8px" }}>Sort:</span>
        {(["name", "price"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            style={{ padding: "4px 10px", marginRight: "4px", borderRadius: "4px", border: "1px solid #ccc", background: sort === s ? "#e67e22" : "#fff", color: sort === s ? "#fff" : "#333", cursor: "pointer", fontSize: "13px" }}
          >
            {s}
          </button>
        ))}
      </div>

      <p style={{ fontSize: "12px", color: "#888", marginBottom: "12px" }}>
        <code>useSearch() → {JSON.stringify({ category, sort })}</code>
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: "10px" }}>
        {products.map((p) => (
          <div key={p.id} style={{ border: "1px solid #eee", borderRadius: "8px", padding: "12px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{p.name}</div>
            <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>
              {p.category} · ${p.price}
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {/* Normal navigation → /products/$productId (URL changes) */}
              <Link
                to="/products/$productId"
                params={{ productId: p.id }}
                style={{ padding: "4px 8px", background: "#e67e22", color: "#fff", borderRadius: "4px", textDecoration: "none", fontSize: "12px" }}
              >
                Detail
              </Link>

              {/* CONCEPT: Route masking
                  Navigates to /products/$productId (real route renders),
                  but the browser URL stays as /products?category=...&sort=...
                  Refreshing or sharing the masked URL opens /products — not the detail.
                  Use case: modal overlays, keeping the background URL visible. */}
              <Link
                to="/products/$productId"
                params={{ productId: p.id }}
                mask={{ to: "/products", search: { category, sort } }}
                style={{ padding: "4px 8px", background: "#f0f0f0", color: "#333", borderRadius: "4px", textDecoration: "none", fontSize: "12px" }}
              >
                Preview (masked)
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "16px", padding: "10px", background: "#f9f9f9", borderRadius: "6px", fontSize: "13px" }}>
        <strong>Route masking:</strong> "Preview (masked)" renders <code>/products/$productId</code> but
        the URL stays as <code>/products?category={category}&sort={sort}</code>.
        Copy the URL and open it — you'll land on the list, not the detail.
      </div>
    </div>
  );
}
