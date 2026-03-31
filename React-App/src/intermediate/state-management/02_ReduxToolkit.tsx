// TOPIC: Redux Toolkit — createSlice + configureStore + Provider + useSelector + useDispatch
//
// Redux Toolkit (RTK) is the official, opinionated toolset for Redux.
// It eliminates the boilerplate of classic Redux (action creators, action types, switch statements).
//
// KEY PIECES:
//   createSlice()      → defines a slice of state: name + initialState + reducers (actions + reducer in one)
//   configureStore()   → assembles slices into one store (replaces createStore)
//   Provider           → makes the store available to all components (from react-redux)
//   useSelector()      → reads state from the store (subscribes component to updates)
//   useDispatch()      → dispatches actions to update the store
//
// MENTAL MODEL vs Context+Reducer:
//   Context+Reducer  → React built-in, great for 1-3 slices, no extra deps
//   Redux Toolkit    → external lib, better for many slices, devtools, complex async (RTK Query)
//
// THIS DEMO: two slices — counter + todo list — showing how multiple slices compose in one store.

import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Provider, useSelector, useDispatch } from "react-redux";

// ─────────────────────────────────────────────────────────────────────────────
// 1. COUNTER SLICE
// ─────────────────────────────────────────────────────────────────────────────
//
// createSlice() takes:
//   name         → prefix for auto-generated action types ("counter/increment")
//   initialState → initial value of this slice of state
//   reducers     → object of reducer functions (RTK uses Immer under the hood,
//                  so you can "mutate" draft state directly — it's safe)

interface CounterState {
  value: number;
  step:  number;
}

const counterSlice = createSlice({
  name: "counter",
  initialState: { value: 0, step: 1 } as CounterState,
  reducers: {
    // PayloadAction<T> types the action.payload
    increment(state)                            { state.value += state.step; },
    decrement(state)                            { state.value -= state.step; },
    reset(state)                                { state.value = 0; },
    setStep(state, action: PayloadAction<number>) { state.step = action.payload; },
  },
});

// createSlice auto-generates action creators — each reducer key becomes an action creator
export const { increment, decrement, reset, setStep } = counterSlice.actions;

// ─────────────────────────────────────────────────────────────────────────────
// 2. TODO SLICE
// ─────────────────────────────────────────────────────────────────────────────

interface TodoItem {
  id:        number;
  text:      string;
  completed: boolean;
}

interface TodoState {
  items:  TodoItem[];
  nextId: number;
}

const todoSlice = createSlice({
  name: "todos",
  initialState: { items: [], nextId: 1 } as TodoState,
  reducers: {
    addTodo(state, action: PayloadAction<string>) {
      // Immer allows direct "mutation" of draft — RTK converts this to an immutable update
      state.items.push({ id: state.nextId++, text: action.payload, completed: false });
    },
    toggleTodo(state, action: PayloadAction<number>) {
      const todo = state.items.find((t) => t.id === action.payload);
      if (todo) todo.completed = !todo.completed;
    },
    removeTodo(state, action: PayloadAction<number>) {
      state.items = state.items.filter((t) => t.id !== action.payload);
    },
    clearCompleted(state) {
      state.items = state.items.filter((t) => !t.completed);
    },
  },
});

export const { addTodo, toggleTodo, removeTodo, clearCompleted } = todoSlice.actions;

// ─────────────────────────────────────────────────────────────────────────────
// 3. STORE — assembles all slices
// ─────────────────────────────────────────────────────────────────────────────
//
// configureStore() takes a { reducer } object — each key becomes a top-level
// state key:  store.getState().counter  /  store.getState().todos

const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
    todos:   todoSlice.reducer,
  },
});

// Infer types from the store — avoids writing types manually and keeps them in sync
type RootState    = ReturnType<typeof store.getState>;
type AppDispatch  = typeof store.dispatch;

// Typed wrappers — use these instead of raw useSelector / useDispatch
const useAppSelector = <T,>(selector: (s: RootState) => T) => useSelector(selector);
const useAppDispatch = () => useDispatch<AppDispatch>();

// ─────────────────────────────────────────────────────────────────────────────
// 4. CONSUMER COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function CounterDemo() {
  // useSelector — subscribe to a slice of state; re-renders when that slice changes
  const { value, step } = useAppSelector((s) => s.counter);
  const dispatch = useAppDispatch();

  return (
    <div style={{ padding: "16px", background: "#f8f9ff", borderRadius: "8px", marginBottom: "20px" }}>
      <h4 style={{ margin: "0 0 12px" }}>Counter slice</h4>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <button onClick={() => dispatch(decrement())} style={btn("#e74c3c")}>−</button>
        <span style={{ fontSize: "28px", fontWeight: "bold", minWidth: "50px", textAlign: "center" }}>{value}</span>
        <button onClick={() => dispatch(increment())} style={btn("#27ae60")}>+</button>
        <button onClick={() => dispatch(reset())} style={btn("#888")}>Reset</button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
        <span>Step:</span>
        {[1, 5, 10].map((s) => (
          <button
            key={s}
            onClick={() => dispatch(setStep(s))}
            style={{
              padding: "3px 10px", border: "1px solid #ddd", borderRadius: "4px",
              background: step === s ? "#4a90e2" : "#fff",
              color: step === s ? "#fff" : "#333",
              cursor: "pointer", fontSize: "13px",
            }}
          >
            {s}
          </button>
        ))}
        <span style={{ color: "#888", marginLeft: "4px" }}>current step: {step}</span>
      </div>

      <p style={{ fontSize: "11px", color: "#aaa", margin: "10px 0 0" }}>
        Actions dispatched: <code>counter/increment</code>, <code>counter/decrement</code>,{" "}
        <code>counter/reset</code>, <code>counter/setStep</code>
      </p>
    </div>
  );
}

function TodoDemo() {
  const { items } = useAppSelector((s) => s.todos);
  const dispatch   = useAppDispatch();
  const [text, setText] = React.useState("");

  const pending   = items.filter((t) => !t.completed).length;
  const completed = items.filter((t) =>  t.completed).length;

  function handleAdd() {
    const trimmed = text.trim();
    if (!trimmed) return;
    dispatch(addTodo(trimmed));
    setText("");
  }

  return (
    <div style={{ padding: "16px", background: "#fff8f0", borderRadius: "8px" }}>
      <h4 style={{ margin: "0 0 12px" }}>
        Todos slice{" "}
        <span style={{ fontWeight: "normal", fontSize: "13px", color: "#888" }}>
          ({pending} pending, {completed} done)
        </span>
      </h4>

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="New todo…"
          style={{ flex: 1, padding: "6px 10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "13px" }}
        />
        <button onClick={handleAdd} style={btn("#4a90e2")}>Add</button>
        {completed > 0 && (
          <button onClick={() => dispatch(clearCompleted())} style={btn("#e67e22")}>Clear done</button>
        )}
      </div>

      {items.length === 0 ? (
        <p style={{ color: "#aaa", fontSize: "13px", margin: 0 }}>No todos yet — add one above.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {items.map((todo) => (
            <li
              key={todo.id}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "6px 0", borderBottom: "1px solid #f0e8e0",
              }}
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => dispatch(toggleTodo(todo.id))}
                style={{ cursor: "pointer" }}
              />
              <span
                style={{
                  flex: 1, fontSize: "13px",
                  textDecoration: todo.completed ? "line-through" : "none",
                  color: todo.completed ? "#aaa" : "#333",
                }}
              >
                {todo.text}
              </span>
              <button
                onClick={() => dispatch(removeTodo(todo.id))}
                style={{ border: "none", background: "none", color: "#e74c3c", cursor: "pointer", fontSize: "14px" }}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <p style={{ fontSize: "11px", color: "#aaa", margin: "10px 0 0" }}>
        Actions dispatched: <code>todos/addTodo</code>, <code>todos/toggleTodo</code>,{" "}
        <code>todos/removeTodo</code>, <code>todos/clearCompleted</code>
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. MAIN EXPORT — Provider wraps everything to give store access
// ─────────────────────────────────────────────────────────────────────────────

import React from "react";

const ReduxToolkitDemo = () => (
  // Provider makes the store available to CounterDemo + TodoDemo via hooks
  // (just like CartProvider in Context+Reducer — but store is external, not React context)
  <Provider store={store}>
    <div>
      <h2>Redux Toolkit</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
        Two slices (<code>counter</code> + <code>todos</code>) composed in one store.
        <code>createSlice</code> = actions + reducer in one place.
        <code>useSelector</code> reads state. <code>useDispatch</code> updates it.
      </p>

      <CounterDemo />
      <TodoDemo />

      <div style={{ marginTop: "20px", padding: "12px", background: "#f5f5f5", borderRadius: "6px", fontSize: "13px" }}>
        <strong>RTK pattern summary:</strong>
        <ul style={{ margin: "6px 0 0", paddingLeft: "18px", lineHeight: "1.8" }}>
          <li><code>createSlice({"{ name, initialState, reducers }"})</code> — generates action creators + reducer</li>
          <li><code>configureStore({"{ reducer: { counter, todos } }"})</code> — one store from many slices</li>
          <li><code>&lt;Provider store={"{store}"}&gt;</code> — makes store available (like React context)</li>
          <li><code>useSelector(s =&gt; s.counter)</code> — subscribe to a state slice, re-renders on change</li>
          <li><code>useDispatch()</code> + <code>dispatch(increment())</code> — fire actions</li>
          <li>Immer built-in — write <code>state.value += 1</code> instead of <code>{"{ ...state, value: state.value + 1 }"}</code></li>
          <li>Action type strings auto-generated: <code>"counter/increment"</code>, <code>"todos/addTodo"</code></li>
        </ul>
      </div>
    </div>
  </Provider>
);

export default ReduxToolkitDemo;

// ─── shared button style helper ───────────────────────────────────────────────
function btn(bg: string): React.CSSProperties {
  return {
    padding: "5px 14px", background: bg, color: "#fff",
    border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px",
  };
}
