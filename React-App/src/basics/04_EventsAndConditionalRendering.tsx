// TOPIC: Events & Conditional Rendering
//
// EVENTS — React uses camelCase event names (onClick, onChange, onSubmit…).
//          Event handlers receive a synthetic event object.
//
// CONDITIONAL RENDERING — show/hide UI based on state or props using:
//   • Ternary operator   condition ? <A /> : <B />
//   • Short-circuit (&&)  condition && <A />
//   • if/else before the return

import { useState } from "react";

const EventsAndConditionalDemo = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Event handler — receives the synthetic event
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setSubmitted(false); // reset on new input
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // prevent page reload
    setSubmitted(true);
  };

  return (
    <div>
      <h2>Events & Conditional Rendering Demo</h2>

      {/* --- Toggle visibility with onClick --- */}
      <section>
        <h3>Toggle (ternary)</h3>
        <button onClick={() => setIsVisible(!isVisible)}>
          {isVisible ? "Hide" : "Show"} Message
        </button>
        {/* Ternary: renders one of two elements */}
        {isVisible ? <p style={{ color: "green" }}>Hello! I am visible.</p> : <p style={{ color: "red" }}>I am hidden.</p>}
      </section>

      {/* --- Short-circuit rendering --- */}
      <section>
        <h3>Short-circuit (&&)</h3>
        <p>Type something below:</p>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Type here…"
        />
        {/* && only renders the right side when condition is truthy */}
        {inputValue.length > 0 && (
          <p>You typed: <strong>{inputValue}</strong></p>
        )}
      </section>

      {/* --- onSubmit event --- */}
      <section>
        <h3>Form Submit Event</h3>
        <form onSubmit={handleSubmit}>
          <button type="submit">Submit</button>
        </form>
        {submitted && <p style={{ color: "blue" }}>Form submitted!</p>}
      </section>
    </div>
  );
};

export default EventsAndConditionalDemo;
