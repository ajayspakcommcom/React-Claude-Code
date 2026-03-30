// TOPIC: Lifting State Up
//
// When two sibling components need to share state, move (lift) the state
// to their closest common PARENT. The parent holds the state and passes
// it down via props. Children communicate back up via callback props.
//
// Pattern:
//   Parent   → holds state, passes value + setter as props
//   Child A  → reads/updates the shared state via props
//   Child B  → reads the same shared state via props
//
// This is the foundation of React's one-way data flow.

import { useState } from "react";

// ════════════════════════════════════════════════════════════
// Example 1: Temperature Converter (classic lifting state example)
// ════════════════════════════════════════════════════════════

// Both inputs share the same temperature — lifted to the parent
const TemperatureInput = ({
  scale,
  value,
  onChange,
}: {
  scale: "C" | "F";
  value: string;
  onChange: (v: string) => void;
}) => (
  <label style={{ display: "block", marginBottom: "8px" }}>
    Temperature in °{scale}:
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ marginLeft: "8px", width: "100px" }}
    />
  </label>
);

const TemperatureConverter = () => {
  // ONE state in the parent — not duplicated in each child
  const [celsius, setCelsius] = useState("0");

  const fahrenheit = celsius !== "" ? String((parseFloat(celsius) * 9) / 5 + 32) : "";

  const handleCelsiusChange    = (v: string) => setCelsius(v);
  const handleFahrenheitChange = (v: string) =>
    setCelsius(v !== "" ? String(((parseFloat(v) - 32) * 5) / 9) : "");

  const temp = parseFloat(celsius);
  const boiling = !isNaN(temp) && temp >= 100;

  return (
    <div style={{ marginBottom: "20px" }}>
      <h3>Example 1 — Temperature Converter</h3>
      <p style={{ fontSize: "13px", color: "#666" }}>
        Both inputs share one state lifted to the parent. Changing either updates both.
      </p>
      <TemperatureInput scale="C" value={celsius}     onChange={handleCelsiusChange} />
      <TemperatureInput scale="F" value={fahrenheit}  onChange={handleFahrenheitChange} />
      {!isNaN(temp) && (
        <p style={{ color: boiling ? "red" : "blue" }}>
          {boiling ? "🔥 Water would boil!" : "❄️ Water would not boil."}
        </p>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// Example 2: Shopping Cart — siblings share cart state
// ════════════════════════════════════════════════════════════

interface Product {
  id: number;
  name: string;
  price: number;
}

const PRODUCTS: Product[] = [
  { id: 1, name: "React Book",   price: 29 },
  { id: 2, name: "TypeScript Course", price: 49 },
  { id: 3, name: "CSS Mastery", price: 19 },
];

// ProductList — adds items to cart (callback from parent)
const ProductList = ({
  cart,
  onAdd,
}: {
  cart: Product[];
  onAdd: (product: Product) => void;
}) => (
  <div style={{ flex: 1, border: "1px solid #eee", borderRadius: "8px", padding: "12px" }}>
    <h4>Products</h4>
    {PRODUCTS.map((p) => {
      const inCart = cart.some((c) => c.id === p.id);
      return (
        <div key={p.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span>{p.name} — ${p.price}</span>
          <button onClick={() => onAdd(p)} disabled={inCart}
            style={{ padding: "2px 10px", background: inCart ? "#ccc" : "#4a90e2", color: "#fff", border: "none", borderRadius: "4px", cursor: inCart ? "not-allowed" : "pointer" }}>
            {inCart ? "Added" : "Add"}
          </button>
        </div>
      );
    })}
  </div>
);

// Cart — removes items from cart (callback from parent)
const CartSummary = ({
  cart,
  onRemove,
}: {
  cart: Product[];
  onRemove: (id: number) => void;
}) => (
  <div style={{ flex: 1, border: "1px solid #eee", borderRadius: "8px", padding: "12px" }}>
    <h4>Cart ({cart.length})</h4>
    {cart.length === 0 ? (
      <p style={{ color: "#aaa" }}>Empty</p>
    ) : (
      <>
        {cart.map((p) => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span>{p.name}</span>
            <button onClick={() => onRemove(p.id)}
              style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer" }}>✕</button>
          </div>
        ))}
        <hr />
        <strong>Total: ${cart.reduce((sum, p) => sum + p.price, 0)}</strong>
      </>
    )}
  </div>
);

// PARENT — lifts cart state so both siblings share it
const ShoppingCart = () => {
  const [cart, setCart] = useState<Product[]>([]); // state lives here

  const addToCart    = (p: Product) => setCart((prev) => [...prev, p]);
  const removeFromCart = (id: number) => setCart((prev) => prev.filter((p) => p.id !== id));

  return (
    <div style={{ marginBottom: "20px" }}>
      <h3>Example 2 — Shopping Cart (siblings share lifted state)</h3>
      <p style={{ fontSize: "13px", color: "#666" }}>
        ProductList and CartSummary are siblings. Cart state is lifted to their parent.
      </p>
      <div style={{ display: "flex", gap: "16px" }}>
        <ProductList cart={cart} onAdd={addToCart} />
        <CartSummary  cart={cart} onRemove={removeFromCart} />
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// Example 3: Accordion — only one panel open at a time
// ════════════════════════════════════════════════════════════

const panels = [
  { id: 1, title: "What is lifting state up?",   body: "Moving state to the closest common ancestor of components that need it." },
  { id: 2, title: "When should I lift state?",   body: "When two sibling components need to read or update the same piece of data." },
  { id: 3, title: "What is one-way data flow?", body: "Data flows down via props; events flow up via callbacks. This makes React apps predictable." },
];

const AccordionPanel = ({
  title, body, isOpen, onToggle,
}: {
  title: string; body: string; isOpen: boolean; onToggle: () => void;
}) => (
  <div style={{ border: "1px solid #ddd", borderRadius: "6px", marginBottom: "6px", overflow: "hidden" }}>
    <button
      onClick={onToggle}
      style={{ width: "100%", textAlign: "left", padding: "10px 14px", background: isOpen ? "#4a90e2" : "#f5f5f5",
        color: isOpen ? "#fff" : "#333", border: "none", cursor: "pointer", fontWeight: "bold" }}
    >
      {isOpen ? "▾" : "▸"} {title}
    </button>
    {isOpen && <div style={{ padding: "10px 14px", fontSize: "14px" }}>{body}</div>}
  </div>
);

const Accordion = () => {
  // openId is lifted to parent — ensures only ONE panel is open at a time
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div style={{ marginBottom: "20px" }}>
      <h3>Example 3 — Accordion (one panel open, state lifted)</h3>
      {panels.map((p) => (
        <AccordionPanel
          key={p.id}
          title={p.title}
          body={p.body}
          isOpen={openId === p.id}
          onToggle={() => setOpenId(openId === p.id ? null : p.id)}
        />
      ))}
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const LiftingStateUpDemo = () => (
  <div>
    <h2>Lifting State Up</h2>
    <TemperatureConverter />
    <ShoppingCart />
    <Accordion />
  </div>
);

export default LiftingStateUpDemo;
