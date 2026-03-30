// TOPIC: Basic Forms
//
// CONTROLLED COMPONENT — form input value is stored in React state.
//   React is the single source of truth; every keystroke updates state via onChange.
//
// Steps:
//   1. Create state for each field
//   2. Bind value={state} to the input
//   3. Update state with onChange
//   4. Handle submission with onSubmit (always call e.preventDefault())

import { useState } from "react";

interface FormData {
  username: string;
  email: string;
  role: string;
  agreed: boolean;
}

const BasicFormsDemo = () => {
  const [form, setForm] = useState<FormData>({
    username: "",
    email: "",
    role: "developer",
    agreed: false,
  });

  const [submitted, setSubmitted] = useState<FormData | null>(null);

  // Generic change handler works for text, select, and checkbox inputs
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(form); // save a snapshot to display below
  };

  const handleReset = () => {
    setForm({ username: "", email: "", role: "developer", agreed: false });
    setSubmitted(null);
  };

  return (
    <div>
      <h2>Basic Forms Demo</h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "320px" }}>
        {/* Text input */}
        <label>
          Username:
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Enter username"
            required
          />
        </label>

        {/* Email input */}
        <label>
          Email:
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />
        </label>

        {/* Select / dropdown */}
        <label>
          Role:
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="developer">Developer</option>
            <option value="designer">Designer</option>
            <option value="manager">Manager</option>
          </select>
        </label>

        {/* Checkbox */}
        <label>
          <input
            type="checkbox"
            name="agreed"
            checked={form.agreed}
            onChange={handleChange}
          />
          {" "}I agree to the terms
        </label>

        <div>
          <button type="submit" disabled={!form.agreed}>
            Submit
          </button>
          <button type="button" onClick={handleReset} style={{ marginLeft: "8px" }}>
            Reset
          </button>
        </div>
      </form>

      {/* Show submitted data */}
      {submitted && (
        <div style={{ marginTop: "16px", background: "#f0f0f0", padding: "10px" }}>
          <h3>Submitted Data:</h3>
          <pre>{JSON.stringify(submitted, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default BasicFormsDemo;
