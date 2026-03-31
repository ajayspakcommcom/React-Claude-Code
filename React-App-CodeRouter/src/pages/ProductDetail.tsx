// FILE: src/pages/ProductDetail.tsx
// ROUTE: /products/$productId — nested under productsRoute in router.tsx
//
// Demonstrates: parallel loaders result, useParams from nested component

import { getRouteApi, Link, useParams } from "@tanstack/react-router";

const routeApi = getRouteApi("/products/$productId");

// Nested component reading params independently — no prop drilling needed
function ProductBreadcrumb() {
  const { productId } = useParams({ from: "/products/$productId" });
  return (
    <div style={{ fontSize: "12px", color: "#888", marginBottom: "12px" }}>
      <Link to="/products" style={{ color: "#e67e22", textDecoration: "none" }}>Products</Link>
      {" › "}Product #{productId}
      {" · "}
      <code style={{ fontSize: "11px" }}>
        useParams({"{ from: '/products/$productId' }"}) → productId: "{productId}"
      </code>
    </div>
  );
}

export function ProductDetailPage() {
  // product + reviews were fetched in parallel via Promise.all in router.tsx
  const { product, reviews } = routeApi.useLoaderData();

  return (
    <div>
      <ProductBreadcrumb />

      <h2>{product.name}</h2>
      <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>
        {product.category} · <strong style={{ color: "#2ecc71" }}>${product.price}</strong>
      </div>
      <p>{product.description}</p>

      <h3 style={{ marginTop: "20px" }}>Reviews ({reviews.length})</h3>
      {reviews.length === 0 && <p style={{ color: "#aaa" }}>No reviews yet.</p>}
      {reviews.map((r, i) => (
        <div key={i} style={{ marginBottom: "10px", padding: "10px", background: "#f9f9f9", borderRadius: "6px" }}>
          <strong>{r.reviewer}</strong>
          <span style={{ color: "#f39c12", marginLeft: "8px" }}>
            {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
          </span>
          <p style={{ margin: "4px 0 0", fontSize: "13px" }}>{r.comment}</p>
        </div>
      ))}

      <div style={{ marginTop: "16px", padding: "10px", background: "#f0fff0", borderRadius: "6px", fontSize: "13px" }}>
        <strong>Parallel loaders:</strong> product (600ms) + reviews (400ms) fetched
        simultaneously via <code>Promise.all</code> in router.tsx — total ≈ 600ms, not 1000ms.
      </div>
    </div>
  );
}
