// TOPIC: Refs (Advanced useRef Patterns)
//
// We covered basic useRef in Beginner/Hooks.
// Here we focus on INTERMEDIATE patterns:
//   1. forwardRef   — pass a ref through a component to a child DOM node
//   2. Callback ref — run logic when a ref is attached/detached
//   3. Ref as instance cache — store expensive object across renders
//   4. Combining refs — use both a forwarded ref and a local ref

import { useRef, useState, useCallback, useEffect, forwardRef } from "react";

// ════════════════════════════════════════════════════════════
// 1. forwardRef — expose a child's DOM node to a parent
// ════════════════════════════════════════════════════════════

// Without forwardRef, putting ref on a component gives the component instance,
// not the DOM node. forwardRef lets you forward the ref to an inner DOM element.

const FancyInput = forwardRef<HTMLInputElement, { placeholder?: string }>(
  ({ placeholder }, ref) => (
    <input
      ref={ref}
      placeholder={placeholder}
      style={{ padding: "6px 10px", border: "2px solid #4a90e2", borderRadius: "6px", fontSize: "14px" }}
    />
  )
);

const ForwardRefExample = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ marginBottom: "20px" }}>
      <h3>1 — forwardRef</h3>
      <p style={{ fontSize: "13px", color: "#666" }}>
        Parent holds a ref to the DOM node inside a child component.
      </p>
      <FancyInput ref={inputRef} placeholder="I am inside FancyInput" />
      <button onClick={() => inputRef.current?.focus()} style={{ marginLeft: "8px" }}>
        Focus (from parent)
      </button>
      <button onClick={() => { if (inputRef.current) inputRef.current.value = ""; }} style={{ marginLeft: "8px" }}>
        Clear
      </button>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// 2. Callback ref — run code when element mounts / unmounts
// ════════════════════════════════════════════════════════════

// A callback ref is a function passed as ref.
// React calls it with the DOM node when mounting, and with null when unmounting.
// Useful when you need to DO something the moment an element appears in the DOM.

const CallbackRefExample = () => {
  const [height, setHeight] = useState<number | null>(null);

  // useCallback ensures the ref function is stable (not recreated every render)
  const measuredRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null) {
      setHeight(node.getBoundingClientRect().height);
    }
  }, []);

  return (
    <div style={{ marginBottom: "20px" }}>
      <h3>2 — Callback Ref (measure on mount)</h3>
      <p style={{ fontSize: "13px", color: "#666" }}>
        The callback fires the instant the element enters the DOM — no useEffect needed.
      </p>
      <div
        ref={measuredRef}
        style={{ background: "#f0f7ff", padding: "12px", borderRadius: "6px" }}
      >
        <p>This box's height is measured via a callback ref.</p>
        <p>Add more lines of text to change the height.</p>
      </div>
      {height !== null && <p>Measured height: <strong>{Math.round(height)}px</strong></p>}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// 3. Ref as instance cache — store expensive objects without re-render
// ════════════════════════════════════════════════════════════

const InstanceCacheExample = () => {
  const [count, setCount] = useState(0);

  // Store a render count that doesn't cause re-renders when incremented
  const renderCount = useRef(0);
  renderCount.current += 1;

  // Store an interval ID without triggering re-renders
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [running, setRunning] = useState(false);

  const start = () => {
    if (intervalRef.current) return;
    setRunning(true);
    intervalRef.current = setInterval(() => setCount((c) => c + 1), 500);
  };

  const stop = () => {
    clearInterval(intervalRef.current!);
    intervalRef.current = null;
    setRunning(false);
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <h3>3 — Ref as Instance Cache</h3>
      <p style={{ fontSize: "13px", color: "#666" }}>
        renderCount and intervalId live in refs — they don't cause re-renders when they change.
      </p>
      <p>Auto-count: <strong>{count}</strong></p>
      <p style={{ fontSize: "13px", color: "#888" }}>Component has rendered <strong>{renderCount.current}</strong> times.</p>
      <button onClick={start} disabled={running}>Start</button>
      <button onClick={stop} disabled={!running} style={{ marginLeft: "8px" }}>Stop</button>
      <button onClick={() => setCount(0)} style={{ marginLeft: "8px" }}>Reset Count</button>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// 4. Combining forwardRef + local ref (mergeRefs pattern)
// ════════════════════════════════════════════════════════════

// Sometimes a component needs its own ref AND needs to forward one to the parent.
// Solution: maintain a local ref, and manually sync it with the forwarded ref.

const AutoFocusInput = forwardRef<HTMLInputElement, { label: string }>(
  ({ label }, forwardedRef) => {
    const localRef = useRef<HTMLInputElement>(null);

    // Sync forwarded ref with local ref
    useEffect(() => {
      if (!forwardedRef) return;
      if (typeof forwardedRef === "function") {
        forwardedRef(localRef.current);
      } else {
        (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = localRef.current;
      }
    }, [forwardedRef]);

    // Use localRef for internal auto-focus logic
    useEffect(() => {
      localRef.current?.focus();
    }, []);

    return (
      <label style={{ display: "block", marginBottom: "6px" }}>
        {label}
        <input ref={localRef} style={{ marginLeft: "8px", padding: "4px" }} />
      </label>
    );
  }
);

const CombinedRefExample = () => {
  const parentRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ marginBottom: "20px" }}>
      <h3>4 — Combined forwardRef + Local Ref</h3>
      <p style={{ fontSize: "13px", color: "#666" }}>
        AutoFocusInput uses its own local ref for auto-focus AND forwards the same node to the parent.
      </p>
      <AutoFocusInput ref={parentRef} label="Auto-focused on mount:" />
      <button onClick={() => parentRef.current?.select()}>
        Select all text (via parent ref)
      </button>
    </div>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────
const RefsAdvancedDemo = () => (
  <div>
    <h2>Refs — Advanced Patterns</h2>
    <ForwardRefExample />
    <CallbackRefExample />
    <InstanceCacheExample />
    <CombinedRefExample />
  </div>
);

export default RefsAdvancedDemo;
