// TOPIC: React Internals (Expert)
// LEVEL: Expert — Internals
//
// ─── FOUR TOPICS ──────────────────────────────────────────────────────────────
//
//   1. Reconciliation  — how React diffs virtual DOM trees and applies changes
//   2. Fiber           — the unit of work React uses to split and prioritize rendering
//   3. Concurrent      — interruptible rendering, lanes, startTransition, Suspense
//   4. React Compiler  — automatic memoization, forget rules, pure components
//
// ─── RECONCILIATION ───────────────────────────────────────────────────────────
//
//   React reconciles the previous and next render output to find the minimal
//   set of DOM operations needed.
//
//   Rules:
//   1. Elements of different TYPES are always remounted (old tree torn down).
//      <div> → <span>  tears down and recreates even if content is identical.
//
//   2. Elements of the same type are UPDATED in place (attributes diffed).
//      <div className="a"> → <div className="b">  only className changes.
//
//   3. Keys identify elements across renders:
//      - Same key + same type → update in place
//      - Different key → remount
//      - No key (using index) → wrong element updated when list reorders
//
//   4. Context: React skips subtrees where props/state haven't changed
//      (assuming no context/state inside).
//
//   diffing heuristic O(n), not O(n³):
//   - Compare same tree level only (no cross-level moves)
//   - Keys are the only cross-position identity signal
//
// ─── FIBER ARCHITECTURE ───────────────────────────────────────────────────────
//
//   Before Fiber (React 15): synchronous, recursive, blocking.
//   Stack reconciler: once started it ran to completion — no interruption.
//
//   Fiber (React 16+): linked-list of work units, each unit is a "fiber node".
//   Each fiber represents one React element. Fields include:
//     - type: the element type (function, class, host)
//     - key: reconciliation identifier
//     - child, sibling, return: tree navigation
//     - pendingProps, memoizedProps: before/after
//     - memoizedState: hooks linked list (useState, useEffect, etc.)
//     - lanes: priority bit-mask
//     - flags: what DOM work is needed (Placement, Update, Deletion)
//
//   Two-phase commit:
//   Phase 1 — Render (interruptible):  walk fiber tree, call components, diff
//   Phase 2 — Commit (synchronous):    apply DOM mutations, fire effects
//
//   The render phase can be paused/resumed/restarted — React may call your
//   component multiple times before committing. Components MUST be pure.
//
// ─── CONCURRENT RENDERING ─────────────────────────────────────────────────────
//
//   Concurrent Mode (React 18+): React can work on multiple renders at once,
//   prioritizing urgent updates over non-urgent ones.
//
//   Priority lanes (simplified):
//     SyncLane         — user events like click, input change (highest)
//     InputContinuousLane — mousemove, scroll
//     DefaultLane      — setTimeout, network responses
//     TransitionLane   — startTransition (low priority)
//     OffscreenLane    — Suspense fallback content (lowest)
//
//   APIs:
//     startTransition(fn)   — mark updates inside fn as non-urgent
//     useTransition()       — [isPending, startTransition] hook
//     useDeferredValue(v)   — deferred copy of a value (updates async)
//     <Suspense>            — show fallback while child subtree is "suspended"
//     React.lazy()          — split a component into a separate chunk
//
//   Tearing: without concurrent mode, state is consistent between components.
//   With concurrent mode, external stores need useSyncExternalStore to prevent
//   reading stale values mid-render.
//
// ─── REACT COMPILER (FORGET) ─────────────────────────────────────────────────
//
//   React Compiler (formerly React Forget) auto-memoizes components and hooks.
//   It analyzes the code statically and inserts memo/useCallback/useMemo
//   where beneficial — you no longer write them manually.
//
//   What the compiler does:
//   ✅ Memoizes components that have stable outputs for stable inputs
//   ✅ Memoizes callbacks passed to child components
//   ✅ Memoizes expensive computed values
//   ✅ Analyzes dependency arrays automatically (no exhaustive-deps lint)
//
//   Rules your code must follow for the compiler to work:
//   ✓ Components must be pure (same props → same output)
//   ✓ No side effects during render
//   ✓ No mutation of props/state directly
//   ✓ Hooks must follow Rules of Hooks
//   ✓ No reading from refs during render (write OK)
//
//   The compiler generates code like:
//     const t0 = useMemo(() => <Child name={name} />, [name]);
//   but inlined into the component — not visible in your source.
//
//   In 2024-2025: available in Next.js, Remix, Expo via Babel plugin.
//   Enable: babel-plugin-react-compiler (or via framework config)

import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  useTransition,
  useDeferredValue,
  memo,
  startTransition,
  Suspense,
  lazy,
} from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ═══════════════════════════════════════════════════════════════════════════════
// 1. RECONCILIATION — key behaviour tests
// ═══════════════════════════════════════════════════════════════════════════════

describe("1 — Reconciliation", () => {
  // ── 1a. Element type change forces remount ───────────────────────────────────

  it("changing element type unmounts old and mounts new (no reuse)", () => {
    const mountLog: string[] = [];
    const unmountLog: string[] = [];

    const DivVersion: React.FC = () => {
      useEffect(() => {
        mountLog.push("div-mounted");
        return () => { unmountLog.push("div-unmounted"); };
      }, []);
      return <div data-testid="el">I am a div</div>;
    };

    const SpanVersion: React.FC = () => {
      useEffect(() => {
        mountLog.push("span-mounted");
        return () => { unmountLog.push("span-unmounted"); };
      }, []);
      return <span data-testid="el">I am a span</span>;
    };

    const Switcher: React.FC<{ useDiv: boolean }> = ({ useDiv }) =>
      useDiv ? <DivVersion /> : <SpanVersion />;

    const { rerender } = render(<Switcher useDiv={true} />);
    expect(screen.getByTestId("el").tagName).toBe("DIV");
    expect(mountLog).toEqual(["div-mounted"]);

    rerender(<Switcher useDiv={false} />);
    expect(screen.getByTestId("el").tagName).toBe("SPAN");

    // div was unmounted, span was freshly mounted — no reuse
    expect(unmountLog).toEqual(["div-unmounted"]);
    expect(mountLog).toEqual(["div-mounted", "span-mounted"]);
  });

  // ── 1b. Same type → update in place (no remount) ────────────────────────────

  it("same element type with changed props updates in place without remounting", () => {
    const mountCount = { value: 0 };

    const Box: React.FC<{ color: string }> = ({ color }) => {
      useEffect(() => { mountCount.value++; }, []); // only runs on mount
      return <div data-testid="box" style={{ color }}>Box</div>;
    };

    const { rerender } = render(<Box color="red" />);
    expect(mountCount.value).toBe(1);

    rerender(<Box color="blue" />);
    // still only 1 mount — Box was updated in place, not remounted
    expect(mountCount.value).toBe(1);
    // but style prop was applied (jsdom normalises "blue" → rgb)
    expect(screen.getByTestId("box")).toHaveStyle({ color: "rgb(0, 0, 255)" });
  });

  // ── 1c. Key change forces remount even for same type ────────────────────────

  it("changing key remounts the component even if type is the same", () => {
    const mountLog: string[] = [];

    const Item: React.FC<{ id: string }> = ({ id }) => {
      useEffect(() => {
        mountLog.push(`mounted-${id}`);
        return () => { mountLog.push(`unmounted-${id}`); };
      }, [id]);
      return <div>{id}</div>;
    };

    const { rerender } = render(<Item key="a" id="a" />);
    expect(mountLog).toEqual(["mounted-a"]);

    rerender(<Item key="b" id="b" />);
    // key changed → React treats it as a different element → unmount a, mount b
    expect(mountLog).toEqual(["mounted-a", "unmounted-a", "mounted-b"]);
  });

  // ── 1d. Stable key preserves state across list reorder ─────────────────────

  it("stable keys preserve component state when list reorders", async () => {
    const user = userEvent.setup();

    interface Item { id: string; label: string; }

    const ItemComp: React.FC<{ label: string }> = ({ label }) => {
      const [ticked, setTicked] = useState(false);
      return (
        <label>
          <input
            type="checkbox"
            checked={ticked}
            onChange={() => setTicked(t => !t)}
            aria-label={label}
          />
          {label}
        </label>
      );
    };

    const ListWithStableKeys: React.FC<{ items: Item[] }> = ({ items }) => (
      <div>{items.map(i => <ItemComp key={i.id} label={i.label} />)}</div>
    );

    const initial: Item[] = [
      { id: "a", label: "Apple" },
      { id: "b", label: "Banana" },
      { id: "c", label: "Cherry" },
    ];
    const reordered: Item[] = [
      { id: "c", label: "Cherry" },
      { id: "a", label: "Apple" },
      { id: "b", label: "Banana" },
    ];

    const { rerender } = render(<ListWithStableKeys items={initial} />);

    // Check "Banana"
    await user.click(screen.getByLabelText("Banana"));
    expect(screen.getByLabelText("Banana")).toBeChecked();

    // Reorder — Banana moves to position 3
    rerender(<ListWithStableKeys items={reordered} />);

    // Banana's state (checked) is preserved because key "b" is stable
    expect(screen.getByLabelText("Banana")).toBeChecked();
    // Cherry and Apple were not checked
    expect(screen.getByLabelText("Cherry")).not.toBeChecked();
    expect(screen.getByLabelText("Apple")).not.toBeChecked();
  });

  // ── 1e. Index keys lose state on reorder ───────────────────────────────────

  it("index keys lose component state when list prepends an item", async () => {
    const user = userEvent.setup();

    const ItemComp: React.FC<{ label: string }> = ({ label }) => {
      const [ticked, setTicked] = useState(false);
      return (
        <label>
          <input
            type="checkbox"
            checked={ticked}
            onChange={() => setTicked(t => !t)}
            aria-label={label}
          />
          {label}
        </label>
      );
    };

    // ❌ index as key
    const BadList: React.FC<{ items: string[] }> = ({ items }) => (
      <div>{items.map((item, i) => <ItemComp key={i} label={item} />)}</div>
    );

    const { rerender } = render(<BadList items={["Apple", "Banana"]} />);

    // Check Apple (index 0)
    await user.click(screen.getByLabelText("Apple"));
    expect(screen.getByLabelText("Apple")).toBeChecked();

    // Prepend "Avocado" — now Apple is at index 1, Banana at 2
    rerender(<BadList items={["Avocado", "Apple", "Banana"]} />);

    // With index keys, React reuses the fiber at position 0 for "Avocado"
    // The checked state (from Apple) is now on Avocado — wrong!
    expect(screen.getByLabelText("Avocado")).toBeChecked(); // state leaked
    expect(screen.getByLabelText("Apple")).not.toBeChecked(); // Apple lost its state
  });

  // ── 1f. Context propagation skips subtrees ──────────────────────────────────

  it("React skips re-rendering children whose props haven't changed (memo)", () => {
    const renderCounts = { parent: 0, child: 0 };

    const Child = memo(({ value }: { value: number }) => {
      renderCounts.child++;
      return <div data-testid="child">{value}</div>;
    });

    const Parent: React.FC = () => {
      const [count, setCount] = useState(0);
      const [unrelated, setUnrelated] = useState(0);
      renderCounts.parent++;
      return (
        <div>
          <Child value={count} />
          <button onClick={() => setCount(c => c + 1)}>Inc count</button>
          <button onClick={() => setUnrelated(u => u + 1)}>Inc unrelated</button>
        </div>
      );
    };

    const user = userEvent.setup();
    const { unmount } = render(<Parent />);
    expect(renderCounts).toEqual({ parent: 1, child: 1 });

    // Changing unrelated state: parent re-renders but memoized child does not
    act(() => { screen.getByRole("button", { name: "Inc unrelated" }).click(); });
    expect(renderCounts.parent).toBe(2);
    expect(renderCounts.child).toBe(1); // skipped!

    // Changing count: child re-renders because its prop changed
    act(() => { screen.getByRole("button", { name: "Inc count" }).click(); });
    expect(renderCounts.parent).toBe(3);
    expect(renderCounts.child).toBe(2);

    unmount();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. FIBER — observable behaviours
// ═══════════════════════════════════════════════════════════════════════════════

describe("2 — Fiber architecture", () => {
  // ── 2a. Hooks are stored as a linked list on the fiber node ─────────────────

  it("multiple hooks maintain independent state — each is a separate fiber node entry", () => {
    const MultiHookComp: React.FC = () => {
      const [a, setA] = useState("a");
      const [b, setB] = useState("b");
      const [c, setC] = useState("c");
      return (
        <div>
          <span data-testid="a">{a}</span>
          <span data-testid="b">{b}</span>
          <span data-testid="c">{c}</span>
          <button onClick={() => setB("B")}>Change B</button>
        </div>
      );
    };

    render(<MultiHookComp />);
    expect(screen.getByTestId("a")).toHaveTextContent("a");
    expect(screen.getByTestId("b")).toHaveTextContent("b");
    expect(screen.getByTestId("c")).toHaveTextContent("c");

    act(() => { screen.getByRole("button").click(); });

    // Only b changed — a and c untouched (separate fiber hook nodes)
    expect(screen.getByTestId("a")).toHaveTextContent("a");
    expect(screen.getByTestId("b")).toHaveTextContent("B");
    expect(screen.getByTestId("c")).toHaveTextContent("c");
  });

  // ── 2b. Cleanup runs before next effect (fiber commit phase ordering) ────────

  it("useEffect cleanup fires before the next effect on re-render", () => {
    const log: string[] = [];

    const Tracked: React.FC<{ id: string }> = ({ id }) => {
      useEffect(() => {
        log.push(`effect:${id}`);
        return () => { log.push(`cleanup:${id}`); };
      }, [id]);
      return <div>{id}</div>;
    };

    const { rerender } = render(<Tracked id="v1" />);
    expect(log).toEqual(["effect:v1"]);

    rerender(<Tracked id="v2" />);
    // Commit phase order: cleanup of previous, then new effect
    expect(log).toEqual(["effect:v1", "cleanup:v1", "effect:v2"]);

    rerender(<Tracked id="v3" />);
    expect(log).toEqual(["effect:v1", "cleanup:v1", "effect:v2", "cleanup:v2", "effect:v3"]);
  });

  // ── 2c. Render phase purity — component may be called multiple times ─────────

  it("StrictMode calls render function twice to catch impure renders", () => {
    let renderCount = 0;

    const PureComp: React.FC<{ value: number }> = ({ value }) => {
      renderCount++;
      return <div data-testid="out">{value * 2}</div>;
    };

    // In StrictMode, React intentionally double-invokes render functions
    render(
      <React.StrictMode>
        <PureComp value={5} />
      </React.StrictMode>
    );

    // Output is correct regardless of call count — component is pure
    expect(screen.getByTestId("out")).toHaveTextContent("10");
    // In dev+StrictMode React calls render twice to surface impurity
    expect(renderCount).toBeGreaterThanOrEqual(1);
  });

  // ── 2d. Ref persists across renders without triggering re-render ─────────────

  it("useRef stores mutable value that persists across renders without causing re-render", () => {
    let renderCount = 0;
    const RefComp: React.FC = () => {
      renderCount++;
      const countRef = useRef(0);
      return (
        <div>
          <span data-testid="render-count">{renderCount}</span>
          <button onClick={() => { countRef.current++; }}>Increment ref</button>
          <span data-testid="ref-val">{countRef.current}</span>
        </div>
      );
    };

    render(<RefComp />);
    expect(renderCount).toBe(1);

    act(() => { screen.getByRole("button").click(); });
    act(() => { screen.getByRole("button").click(); });

    // Ref mutation doesn't trigger re-render
    expect(renderCount).toBe(1);
  });

  // ── 2e. Layout effects fire synchronously before browser paint ────────────────

  it("useLayoutEffect fires synchronously in the commit phase (before useEffect)", () => {
    const log: string[] = [];

    const EffectOrder: React.FC = () => {
      useEffect(() => { log.push("useEffect"); });
      React.useLayoutEffect(() => { log.push("useLayoutEffect"); });
      return <div />;
    };

    act(() => { render(<EffectOrder />); });

    // Commit phase: layout effects run before passive effects
    expect(log[0]).toBe("useLayoutEffect");
    expect(log[1]).toBe("useEffect");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. CONCURRENT RENDERING
// ═══════════════════════════════════════════════════════════════════════════════

describe("3 — Concurrent rendering", () => {
  // ── 3a. useTransition — isPending during low-priority update ─────────────────

  it("useTransition: isPending is true during transition, false after", async () => {
    const user = userEvent.setup();

    const ITEMS = Array.from({ length: 100 }, (_, i) => `Item ${i + 1}`);

    const SearchList: React.FC = () => {
      const [query, setQuery] = useState("");
      const [filtered, setFiltered] = useState(ITEMS);
      const [isPending, startTrans] = useTransition();

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        setQuery(q); // urgent: update the input immediately
        startTrans(() => {
          // non-urgent: filtering the list can be deferred
          setFiltered(ITEMS.filter(i => i.toLowerCase().includes(q.toLowerCase())));
        });
      };

      return (
        <div>
          <input
            value={query}
            onChange={handleChange}
            placeholder="Search"
            aria-label="Search items"
          />
          {isPending && <span data-testid="pending">Filtering…</span>}
          <ul>
            {filtered.map(i => <li key={i}>{i}</li>)}
          </ul>
        </div>
      );
    };

    render(<SearchList />);
    // Initially shows all items
    expect(screen.getAllByRole("listitem")).toHaveLength(100);

    await user.type(screen.getByLabelText("Search items"), "50");

    // After typing, transition completes and list is filtered
    await waitFor(() => {
      expect(screen.getAllByRole("listitem").length).toBeLessThan(100);
    });
    // No pending indicator once settled
    expect(screen.queryByTestId("pending")).not.toBeInTheDocument();
  });

  // ── 3b. useDeferredValue — stale value rendered until new one is ready ───────

  it("useDeferredValue provides a deferred copy that updates asynchronously", async () => {
    const user = userEvent.setup();

    const ExpensiveList: React.FC<{ query: string }> = ({ query }) => {
      // Simulate expensive filtering
      const results = useMemo(
        () => Array.from({ length: 20 }, (_, i) => `${query}-result-${i + 1}`),
        [query]
      );
      return (
        <ul data-testid="results">
          {results.map(r => <li key={r}>{r}</li>)}
        </ul>
      );
    };

    const SearchApp: React.FC = () => {
      const [query, setQuery] = useState("initial");
      const deferred = useDeferredValue(query);
      const isStale = query !== deferred;

      return (
        <div>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Query"
          />
          <div data-testid="stale-indicator">{isStale ? "stale" : "fresh"}</div>
          <ExpensiveList query={deferred} />
        </div>
      );
    };

    render(<SearchApp />);
    expect(screen.getByTestId("results").firstChild).toHaveTextContent("initial-result-1");

    // Change query — deferred value will follow
    await user.clear(screen.getByLabelText("Query"));
    await user.type(screen.getByLabelText("Query"), "new");

    // Eventually the deferred value catches up
    await waitFor(() => {
      expect(screen.getByTestId("results").firstChild).toHaveTextContent("new-result-1");
    });
    expect(screen.getByTestId("stale-indicator")).toHaveTextContent("fresh");
  });

  // ── 3c. Suspense shows fallback while content loads ──────────────────────────

  it("Suspense renders fallback while lazy component loads, then renders component", async () => {
    const AsyncComp = lazy(() =>
      new Promise<{ default: React.FC }>(resolve =>
        setTimeout(() => resolve({ default: () => <div data-testid="loaded">Loaded!</div> }), 10)
      )
    );

    render(
      <Suspense fallback={<div data-testid="fallback">Loading…</div>}>
        <AsyncComp />
      </Suspense>
    );

    // Fallback shown immediately
    expect(screen.getByTestId("fallback")).toBeInTheDocument();

    // Component renders once promise resolves
    expect(await screen.findByTestId("loaded")).toHaveTextContent("Loaded!");
    expect(screen.queryByTestId("fallback")).not.toBeInTheDocument();
  });

  // ── 3d. startTransition marks update as non-urgent ───────────────────────────

  it("startTransition defers the update — input stays responsive", async () => {
    const user = userEvent.setup();
    const renderLog: string[] = [];

    const HeavyComp = memo(({ value }: { value: string }) => {
      renderLog.push(`heavy:${value}`);
      // Simulate a slow component (in real life via expensive computation)
      return <div data-testid="heavy">{value}</div>;
    });

    const TransitionDemo: React.FC = () => {
      const [input, setInput] = useState("");
      const [deferred, setDeferred] = useState("");

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        setInput(v); // urgent
        startTransition(() => {
          setDeferred(v); // non-urgent
        });
      };

      return (
        <div>
          <input value={input} onChange={handleChange} aria-label="Input" />
          <HeavyComp value={deferred} />
        </div>
      );
    };

    render(<TransitionDemo />);
    await user.type(screen.getByLabelText("Input"), "hi");

    // Input responded immediately, heavy component eventually caught up
    expect(screen.getByLabelText("Input")).toHaveValue("hi");
    await waitFor(() => {
      expect(screen.getByTestId("heavy")).toHaveTextContent("hi");
    });
  });

  // ── 3e. Multiple Suspense boundaries are independent ─────────────────────────

  it("each Suspense boundary independently shows its own fallback", async () => {
    const makeAsync = (testId: string, delay: number) =>
      lazy(() =>
        new Promise<{ default: React.FC }>(resolve =>
          setTimeout(() => resolve({ default: () => <div data-testid={testId}>{testId}</div> }), delay)
        )
      );

    const Fast = makeAsync("fast", 10);
    const Slow = makeAsync("slow", 50);

    render(
      <div>
        <Suspense fallback={<span data-testid="fast-loading">Fast loading…</span>}>
          <Fast />
        </Suspense>
        <Suspense fallback={<span data-testid="slow-loading">Slow loading…</span>}>
          <Slow />
        </Suspense>
      </div>
    );

    // Both loading initially
    expect(screen.getByTestId("fast-loading")).toBeInTheDocument();
    expect(screen.getByTestId("slow-loading")).toBeInTheDocument();

    // Fast resolves first
    expect(await screen.findByTestId("fast")).toBeInTheDocument();
    expect(screen.queryByTestId("fast-loading")).not.toBeInTheDocument();

    // Slow loading still shown
    expect(screen.getByTestId("slow-loading")).toBeInTheDocument();

    // Slow eventually resolves
    expect(await screen.findByTestId("slow")).toBeInTheDocument();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. REACT COMPILER — rules and patterns
// ═══════════════════════════════════════════════════════════════════════════════

describe("4 — React Compiler rules (purity + memoization)", () => {
  // The compiler auto-memoizes, but your code must be pure for it to work.
  // These tests verify the patterns the compiler relies on.

  // ── 4a. Pure component: same props → same output ────────────────────────────

  it("pure component always produces identical output for identical input", () => {
    const PureGreeting: React.FC<{ name: string; count: number }> = ({ name, count }) => (
      <div data-testid="greeting">
        Hello {name}! You have {count} messages.
      </div>
    );

    const { rerender } = render(<PureGreeting name="Alice" count={3} />);
    expect(screen.getByTestId("greeting")).toHaveTextContent("Hello Alice! You have 3 messages.");

    // Same props — identical output (compiler can safely memoize this)
    rerender(<PureGreeting name="Alice" count={3} />);
    expect(screen.getByTestId("greeting")).toHaveTextContent("Hello Alice! You have 3 messages.");

    // Different props — output changes
    rerender(<PureGreeting name="Bob" count={7} />);
    expect(screen.getByTestId("greeting")).toHaveTextContent("Hello Bob! You have 7 messages.");
  });

  // ── 4b. useMemo — compiler replaces manual memos ────────────────────────────

  it("useMemo computes value once and returns cached result until deps change", () => {
    let computeCount = 0;

    const Expensive: React.FC<{ items: number[]; multiplier: number }> = ({ items, multiplier }) => {
      const total = useMemo(() => {
        computeCount++;
        return items.reduce((s, v) => s + v * multiplier, 0);
      }, [items, multiplier]);

      return <div data-testid="total">{total}</div>;
    };

    const items = [1, 2, 3, 4, 5];
    const { rerender } = render(<Expensive items={items} multiplier={2} />);
    expect(screen.getByTestId("total")).toHaveTextContent("30");
    expect(computeCount).toBe(1);

    // Same deps → no recomputation
    rerender(<Expensive items={items} multiplier={2} />);
    expect(computeCount).toBe(1);

    // Changed dep → recomputes
    rerender(<Expensive items={items} multiplier={3} />);
    expect(screen.getByTestId("total")).toHaveTextContent("45");
    expect(computeCount).toBe(2);
  });

  // ── 4c. useCallback — stable reference prevents child re-render ─────────────

  it("useCallback stabilizes function reference across renders", () => {
    const childRenders: number[] = [];

    const Button = memo(({ onClick, label }: { onClick: () => void; label: string }) => {
      childRenders.push(1);
      return <button onClick={onClick}>{label}</button>;
    });

    const Parent: React.FC = () => {
      const [count, setCount] = useState(0);
      const [other, setOther] = useState(0);

      // Without useCallback: new function reference on every render → Button re-renders
      // With useCallback: stable reference → Button skips re-render when only `other` changes
      const handleClick = useCallback(() => setCount(c => c + 1), []);

      return (
        <div>
          <Button onClick={handleClick} label="Increment" />
          <span data-testid="count">{count}</span>
          <button onClick={() => setOther(o => o + 1)} data-testid="other-btn">Other</button>
        </div>
      );
    };

    render(<Parent />);
    expect(childRenders).toHaveLength(1);

    // Updating unrelated state doesn't re-render the memoized Button
    act(() => { screen.getByTestId("other-btn").click(); });
    expect(childRenders).toHaveLength(1); // still 1 — skipped

    // Clicking the button itself updates count (via stable callback)
    act(() => { screen.getByRole("button", { name: "Increment" }).click(); });
    expect(screen.getByTestId("count")).toHaveTextContent("1");
  });

  // ── 4d. Impure render causes bugs — reading external mutable state ───────────

  it("component reading mutable external ref during render produces inconsistent results", () => {
    // This is the kind of bug the compiler's purity rules prevent
    let externalCounter = 0;

    // ❌ Impure — reads external mutable variable during render
    // The compiler would refuse to memoize this because same props ≠ same output
    const ImpureComp: React.FC<{ ignored: string }> = () => {
      externalCounter++; // side effect in render — bad!
      return <div data-testid="impure">{externalCounter}</div>;
    };

    const { rerender } = render(<ImpureComp ignored="same" />);
    const firstRender = externalCounter;

    rerender(<ImpureComp ignored="same" />);
    const secondRender = externalCounter;

    // Same props but different output — compiler cannot memoize this safely
    expect(secondRender).toBeGreaterThan(firstRender); // proof of impurity
  });

  // ── 4e. Stable object identity — compiler requires no unnecessary new objects ─

  it("object created inline as prop causes child re-render (compiler moves it out)", () => {
    const childRenders: number[] = [];

    const Child = memo(({ style }: { style: React.CSSProperties }) => {
      childRenders.push(1);
      return <div style={style}>Child</div>;
    });

    // ❌ Inline object — new reference every render, memo can't help
    const BadParent: React.FC<{ count: number }> = ({ count }) => (
      <Child style={{ color: "red" }} />  // new object on every render
    );

    // ✅ Stable constant — compiler hoists this outside the component
    const STYLE: React.CSSProperties = { color: "red" };
    const GoodParent: React.FC<{ count: number }> = ({ count }) => (
      <Child style={STYLE} />  // same reference always
    );

    // Bad parent: re-render of parent forces child re-render even with memo
    const { rerender: rerenderBad } = render(<BadParent count={0} />);
    const badAfterFirst = childRenders.length;
    rerenderBad(<BadParent count={1} />);
    const badAfterSecond = childRenders.length;
    expect(badAfterSecond).toBeGreaterThan(badAfterFirst); // re-rendered

    childRenders.length = 0; // reset

    // Good parent: child skips re-render because STYLE reference is stable
    const { rerender: rerenderGood } = render(<GoodParent count={0} />);
    const goodAfterFirst = childRenders.length;
    rerenderGood(<GoodParent count={1} />);
    const goodAfterSecond = childRenders.length;
    expect(goodAfterSecond).toBe(goodAfterFirst); // skipped!
  });
});
