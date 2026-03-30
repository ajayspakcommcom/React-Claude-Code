// TOPIC: JSX
// JSX is a syntax extension that lets you write HTML-like code inside JavaScript.
// React transforms JSX into React.createElement() calls under the hood.

const JSXDemo = () => {
  const name = "React Learner";
  const isLoggedIn = true;

  // JSX must return a single root element
  // Use className instead of class, htmlFor instead of for
  return (
    <div className="jsx-demo">
      {/* This is a JSX comment */}
      <h2>JSX Demo</h2>

      {/* Embedding JavaScript expressions with {} */}
      <p>Hello, {name}!</p>
      <p>2 + 2 = {2 + 2}</p>
      <p>Uppercase: {name.toUpperCase()}</p>

      {/* Ternary expression inside JSX */}
      <p>Status: {isLoggedIn ? "Logged In" : "Logged Out"}</p>

      {/* Inline styles use an object with camelCase properties */}
      <p style={{ color: "blue", fontSize: "18px" }}>Styled with inline CSS</p>
    </div>
  );
};

export default JSXDemo;
