// TOPIC: Props vs State
//
// PROPS  — data passed FROM a parent TO a child. Read-only inside the child.
// STATE  — data managed INSIDE a component. Changing state re-renders the component.

import { useState } from "react";

// --- Props example ---
// TypeScript interface defines the shape of props
interface UserCardProps {
  name: string;
  age: number;
}

const UserCard = ({ name, age }: UserCardProps) => {
  // name and age come from the parent — this component cannot change them
  return (
    <div style={{ border: "1px solid gray", padding: "8px", marginBottom: "8px" }}>
      <strong>Name:</strong> {name} | <strong>Age:</strong> {age}
    </div>
  );
};

// --- State example ---
const Counter = () => {
  // useState returns [currentValue, setterFunction]
  // Calling the setter triggers a re-render with the new value
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count (state): {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)} style={{ marginLeft: "8px" }}>
        Decrement
      </button>
      <button onClick={() => setCount(0)} style={{ marginLeft: "8px" }}>
        Reset
      </button>
    </div>
  );
};

// --- Parent wires both together ---
const PropsVsStateDemo = () => {
  return (
    <div>
      <h2>Props vs State Demo</h2>

      <h3>Props (passed from parent, read-only in child)</h3>
      <UserCard name="Alice" age={28} />
      <UserCard name="Bob" age={34} />

      <h3>State (managed inside the component)</h3>
      <Counter />
    </div>
  );
};

export default PropsVsStateDemo;
