// TOPIC: Controlled vs Uncontrolled Components
//
// CONTROLLED:
//   React owns the input value via state.
//   value={state} + onChange={setState} — React is the single source of truth.
//   ✅ Instant validation, conditional disabling, formatting on type
//
// UNCONTROLLED:
//   The DOM owns the input value. You read it via a ref when needed.
//   No value prop, no onChange — use defaultValue for initial value.
//   ✅ Simple forms, file inputs, integrating with non-React libraries
//
// Rule of thumb: prefer CONTROLLED. Use UNCONTROLLED only when necessary.

import { useState, useRef } from "react";

// ════════════════════════════════════════════════════════════
// Example 1: Controlled Input
// ════════════════════════════════════════════════════════════
const ControlledExample = () => {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState("");

  return (
    <div style={{ marginBottom: "20px" }}>
      <h3>Controlled Input</h3>
      <p style={{ fontSize: "13px", color: "#666" }}>
        React state drives the input. Value is always in sync with state.
      </p>
      <input
        value={value}                          // React controls the value
        onChange={(e) => setValue(e.target.value)} // update state on every keystroke
        placeholder="Type something…"
      />
      <button onClick={() => setSubmitted(value)} style={{ marginLeft: "8px" }}>Submit</button>

      {/* Instant feedback — only possible with controlled */}
      <p style={{ fontSize: "13px", color: value.length > 10 ? "red" : "green" }}>
        {value.length} / 10 characters {value.length > 10 ? "— too long!" : ""}
      </p>
      {submitted && <p>Submitted: <strong>{submitted}</strong></p>}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// Example 2: Uncontrolled Input
// ════════════════════════════════════════════════════════════
const UncontrolledExample = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState("");

  const handleSubmit = () => {
    // Read the value from the DOM when needed, not on every keystroke
    if (inputRef.current) {
      setSubmitted(inputRef.current.value);
    }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <h3>Uncontrolled Input</h3>
      <p style={{ fontSize: "13px", color: "#666" }}>
        DOM owns the value. React reads it via ref only on submit.
      </p>
      <input
        ref={inputRef}           // attach ref to the DOM node
        defaultValue="initial"   // sets initial value without controlling it
        placeholder="Type something…"
      />
      <button onClick={handleSubmit} style={{ marginLeft: "8px" }}>Submit</button>
      {submitted && <p>Submitted: <strong>{submitted}</strong></p>}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// Example 3: File Input — always uncontrolled
// ════════════════════════════════════════════════════════════
const FileInputExample = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleRead = () => {
    const file = fileRef.current?.files?.[0];
    if (file) setFileName(`${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <h3>File Input (always uncontrolled)</h3>
      <p style={{ fontSize: "13px", color: "#666" }}>
        File inputs cannot be controlled — the browser owns the value for security.
      </p>
      <input type="file" ref={fileRef} onChange={handleRead} />
      {fileName && <p>Selected: <strong>{fileName}</strong></p>}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// Example 4: Side-by-side comparison form
// ════════════════════════════════════════════════════════════
const ComparisonForm = () => {
  // Controlled fields
  const [username, setUsername] = useState("");
  // Uncontrolled field
  const passwordRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ username: string; password: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult({ username, password: passwordRef.current?.value ?? "" });
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <h3>Mixed Form — Controlled + Uncontrolled</h3>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "280px" }}>
        <label>
          Username (controlled):
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Password (uncontrolled):
          <input type="password" ref={passwordRef} defaultValue="" required />
        </label>
        <button type="submit">Login</button>
      </form>
      {result && (
        <p style={{ marginTop: "10px" }}>
          User: <strong>{result.username}</strong> | Password length: <strong>{result.password.length}</strong>
        </p>
      )}
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const ControlledVsUncontrolledDemo = () => (
  <div>
    <h2>Controlled vs Uncontrolled Components</h2>
    <ControlledExample />
    <UncontrolledExample />
    <FileInputExample />
    <ComparisonForm />
  </div>
);

export default ControlledVsUncontrolledDemo;
