// TOPIC: Separation of Concerns
// LEVEL: Senior — Architecture
//
// ─── WHAT IT MEANS ───────────────────────────────────────────────────────────
//
// Each module should have ONE reason to change.
// Split code into layers — if one thing changes, only ONE file needs to update.
//
// ─── THE 4 LAYERS ────────────────────────────────────────────────────────────
//
//   LAYER 1 — Types        (types.ts)
//   ├─ What:  Data shapes, interfaces, constants
//   ├─ React: ❌ None
//   └─ Changes when: The data model changes
//
//   LAYER 2 — Service      (services/taskService.ts)
//   ├─ What:  Data access — read, create, update, delete
//   ├─ React: ❌ None (pure TypeScript functions)
//   └─ Changes when: The data source changes (REST → GraphQL → DB)
//
//   LAYER 3 — Hooks        (hooks/useTasks, useTaskFilters, useTaskForm)
//   ├─ What:  Business logic — validation rules, business decisions, React state
//   ├─ React: ✅ Yes (useState, useCallback, useReducer)
//   └─ Changes when: Business rules change
//
//   LAYER 4 — Components   (components/TaskCard, TaskList, TaskForm, TaskFiltersBar)
//   ├─ What:  Pure rendering — props in, JSX out
//   ├─ React: ✅ Yes (JSX only, no logic)
//   └─ Changes when: The UI design changes
//
// ─── THE KEY INSIGHT ─────────────────────────────────────────────────────────
//
//   Bad (tangled):
//     MyComponent.tsx  ← fetch, validate, sort, render — ALL in one place
//
//   Good (separated):
//     taskService.ts   ← fetch/store/sort (pure TS, no React)
//     useTasks.ts      ← React state + business logic (no JSX)
//     TaskList.tsx     ← render only (no fetch, no validation)
//
//   Result: swap the API without touching the UI.
//           redesign the UI without touching the data layer.

import React, { useState } from "react";

// LAYER 3 — Hooks (business logic)
import { useTasks }       from "./soc/hooks/useTasks";
import { useTaskFilters } from "./soc/hooks/useTaskFilters";
import { useTaskForm }    from "./soc/hooks/useTaskForm";

// LAYER 4 — Components (presentation)
import { TaskList }       from "./soc/components/TaskList";
import { TaskForm }       from "./soc/components/TaskForm";
import { TaskFiltersBar } from "./soc/components/TaskFilters";

// ─── Root component — wires the layers together ───────────────────────────────

const SeparationOfConcernsDemo = () => {
  const [activeTab, setActiveTab] = useState<"layers" | "demo">("layers");

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.h2}>Separation of Concerns</h2>
        <p style={s.subtitle}>Senior Architecture — split code so each layer has one reason to change</p>
        <div style={s.tabs}>
          {(["layers", "demo"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ ...s.tab, ...(activeTab === tab ? s.tabActive : {}) }}
            >
              {tab === "layers" ? "📐 Layers" : "✅ Live Demo"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "layers" ? <LayersView /> : <DemoView />}
    </div>
  );
};

// ─── Layers view — architecture explanation ───────────────────────────────────

const LayersView = () => (
  <div style={s.layersWrap}>

    {/* Before / After */}
    <div style={s.compareGrid}>
      <div style={s.compareCard}>
        <div style={{ ...s.compareTitle, color: "#dc2626" }}>❌ Tangled (everything in one component)</div>
        <pre style={s.code}>{MESSY_CODE}</pre>
        <ul style={s.badList}>
          <li>Swap API → edit the component</li>
          <li>Change a validation rule → edit the component</li>
          <li>Redesign UI → risk breaking fetch logic</li>
          <li>Can't test logic without rendering</li>
        </ul>
      </div>

      <div style={{ ...s.compareCard, borderColor: "#22c55e" }}>
        <div style={{ ...s.compareTitle, color: "#166534" }}>✅ Separated (4 focused layers)</div>
        <pre style={s.code}>{CLEAN_CODE}</pre>
        <ul style={s.goodList}>
          <li>Swap API → only edit taskService.ts</li>
          <li>Change validation → only edit useTaskForm.ts</li>
          <li>Redesign UI → only edit TaskList.tsx</li>
          <li>Test logic with a plain function call</li>
        </ul>
      </div>
    </div>

    {/* Layer cards */}
    <div style={s.layerGrid}>
      {LAYERS.map((layer, i) => (
        <div key={i} style={{ ...s.layerCard, borderLeftColor: layer.color }}>
          <div style={s.layerTop}>
            <span style={{ ...s.layerNum, background: layer.color }}>{i + 1}</span>
            <div>
              <div style={s.layerTitle}>{layer.title}</div>
              <div style={s.layerFile}>{layer.file}</div>
            </div>
          </div>
          <div style={s.layerDesc}>{layer.desc}</div>
          <div style={s.layerMeta}>
            <span style={s.chip}>React: {layer.react}</span>
            <span style={s.chip}>Changes when: {layer.changeWhen}</span>
          </div>
          <pre style={s.snippet}>{layer.snippet}</pre>
        </div>
      ))}
    </div>
  </div>
);

// ─── Demo view — fully working Task Manager ───────────────────────────────────

const DemoView = () => {
  const [showForm, setShowForm] = useState(false);

  // LAYER 3: hooks provide all state + logic
  const filterState = useTaskFilters();
  const { tasks, stats, createTask, deleteTask, toggleTask } = useTasks(filterState.filters);
  const form = useTaskForm((data) => {
    createTask(data);
    setShowForm(false);
  });

  return (
    <div style={s.demo}>

      {/* Stats bar */}
      <div style={s.statsBar}>
        {[
          { label: "Total",       value: stats.total,      color: "#6b7280" },
          { label: "Todo",        value: stats.todo,       color: "#f59e0b" },
          { label: "In Progress", value: stats.inProgress, color: "#3b82f6" },
          { label: "Done",        value: stats.done,       color: "#22c55e" },
        ].map((stat) => (
          <div key={stat.label} style={s.statCard}>
            <span style={{ ...s.statValue, color: stat.color }}>{stat.value}</span>
            <span style={s.statLabel}>{stat.label}</span>
          </div>
        ))}

        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={() => { setShowForm((v) => !v); form.reset(); }}
            style={s.addBtn}
          >
            {showForm ? "✕ Cancel" : "+ Add Task"}
          </button>
        </div>
      </div>

      {/* Form (LAYER 4 component — driven by LAYER 3 hook) */}
      {showForm && (
        <TaskForm
          form={form.form}
          errors={form.errors}
          setField={form.setField}
          onSubmit={form.handleSubmit}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Filters (LAYER 4 component — driven by LAYER 3 hook) */}
      <TaskFiltersBar
        filters={filterState.filters}
        activeCount={filterState.activeCount}
        onSearch={filterState.setSearch}
        onStatus={filterState.setStatus}
        onPriority={filterState.setPriority}
        onSortBy={filterState.setSortBy}
        onReset={filterState.resetFilters}
      />

      {/* Task count */}
      <div style={s.resultLine}>
        {tasks.length} task{tasks.length !== 1 ? "s" : ""} shown
        {filterState.activeCount > 0 && (
          <span style={{ color: "#6b7280" }}> (filtered)</span>
        )}
      </div>

      {/* List (LAYER 4 component — pure rendering) */}
      <TaskList
        tasks={tasks}
        onDelete={deleteTask}
        onToggle={toggleTask}
      />
    </div>
  );
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const MESSY_CODE = `// ❌ TaskManager.tsx — 200+ lines, does EVERYTHING
const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  // Fetch lives here
  useEffect(() => {
    fetch("/api/tasks")
      .then(r => r.json())
      .then(data => setTasks(data));
  }, []);

  // Validation lives here
  const handleSubmit = (e) => {
    if (!title.trim()) { setError("Required"); return; }
    fetch("/api/tasks", { method: "POST", body: ... });
  };

  // Sorting lives here
  const sorted = tasks
    .filter(t => t.title.includes(search))
    .sort((a, b) => ...);

  // Rendering lives here
  return ( <div> ... </div> );
};`;

const CLEAN_CODE = `// ✅ Each file has ONE job

// Layer 2 — Service (no React)
// taskService.ts — swap API here only
export const taskService = {
  getAll: (filters) => { /* filter + sort */ },
  create: (data) => { /* POST */ },
};

// Layer 3 — Hook (React state, no JSX)
// useTasks.ts — business logic here only
const useTasks = (filters) => {
  const tasks = taskService.getAll(filters);
  const createTask = (data) => taskService.create(data);
  return { tasks, createTask };
};

// Layer 4 — Component (pure rendering)
// TaskList.tsx — UI design here only
const TaskList = ({ tasks, onDelete }) => (
  tasks.map(t => <TaskCard task={t} ... />)
);`;

const LAYERS = [
  {
    title:      "Types",
    file:       "soc/types.ts",
    color:      "#8b5cf6",
    react:      "❌ None",
    changeWhen: "Data model changes",
    desc:       "Interfaces and constants only. No logic, no React, no side effects. Everything else imports from here.",
    snippet:    `interface Task {\n  id: number;\n  title: string;\n  priority: Priority;\n  status: Status;\n}`,
  },
  {
    title:      "Service",
    file:       "soc/services/taskService.ts",
    color:      "#f59e0b",
    react:      "❌ None",
    changeWhen: "Data source changes",
    desc:       "Pure TypeScript functions. No useState, no useEffect, no JSX. If you swap REST for GraphQL, only this file changes.",
    snippet:    `export const taskService = {\n  getAll(filters): Task[] { ... },\n  create(data): Task { ... },\n  delete(id): void  { ... },\n};`,
  },
  {
    title:      "Hooks",
    file:       "soc/hooks/useTasks|useTaskFilters|useTaskForm",
    color:      "#3b82f6",
    react:      "✅ useState / useCallback",
    changeWhen: "Business rules change",
    desc:       "Bridges the service and UI layers. Holds React state and encodes business decisions. No JSX.",
    snippet:    `const useTasks = (filters) => {\n  const tasks = taskService.getAll(filters);\n  const createTask = (data) => {\n    taskService.create(data);\n    forceUpdate();\n  };\n  return { tasks, createTask };\n};`,
  },
  {
    title:      "Components",
    file:       "soc/components/TaskCard|TaskList|TaskForm|TaskFiltersBar",
    color:      "#22c55e",
    react:      "✅ JSX only",
    changeWhen: "UI design changes",
    desc:       "Pure presentation. Props in, JSX out. Zero business logic. Zero data fetching. Zero validation.",
    snippet:    `const TaskCard = ({ task, onDelete, onToggle }) => (\n  <div>\n    <button onClick={() => onToggle(task.id)}>✓</button>\n    <span>{task.title}</span>\n    <button onClick={() => onDelete(task.id)}>✕</button>\n  </div>\n);`,
  },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page:        { fontFamily: "system-ui,-apple-system,sans-serif", padding: "32px 24px", maxWidth: 1200, margin: "0 auto" },
  header:      { marginBottom: 28 },
  h2:          { fontSize: 26, fontWeight: 800, color: "#111827", margin: "0 0 6px" },
  subtitle:    { color: "#6b7280", margin: "0 0 20px" },
  tabs:        { display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 10, padding: 4, width: "fit-content" },
  tab:         { padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600, background: "transparent", color: "#6b7280" },
  tabActive:   { background: "#fff", color: "#111827", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" },

  // Layers view
  layersWrap:  { display: "flex", flexDirection: "column", gap: 24 },
  compareGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
  compareCard: { background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: 24 },
  compareTitle:{ fontSize: 14, fontWeight: 700, marginBottom: 14 },
  code:        { fontSize: 11.5, lineHeight: 1.8, background: "#0f172a", color: "#e2e8f0", padding: 16, borderRadius: 8, overflow: "auto", margin: "0 0 16px", fontFamily: "monospace" },
  badList:     { margin: 0, padding: "0 0 0 18px", color: "#dc2626", fontSize: 13, display: "flex", flexDirection: "column", gap: 4 },
  goodList:    { margin: 0, padding: "0 0 0 18px", color: "#166534", fontSize: 13, display: "flex", flexDirection: "column", gap: 4 },
  layerGrid:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  layerCard:   { background: "#fff", border: "1px solid #e5e7eb", borderLeft: "4px solid", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 10 },
  layerTop:    { display: "flex", alignItems: "center", gap: 12 },
  layerNum:    { width: 28, height: 28, borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  layerTitle:  { fontSize: 15, fontWeight: 700, color: "#111827" },
  layerFile:   { fontSize: 12, color: "#6b7280", fontFamily: "monospace" },
  layerDesc:   { fontSize: 13, color: "#374151", lineHeight: 1.6 },
  layerMeta:   { display: "flex", gap: 8, flexWrap: "wrap" },
  chip:        { fontSize: 11, background: "#f1f5f9", color: "#475569", padding: "3px 10px", borderRadius: 20 },
  snippet:     { fontSize: 11, lineHeight: 1.7, background: "#0f172a", color: "#e2e8f0", padding: 12, borderRadius: 8, overflow: "auto", margin: 0, fontFamily: "monospace" },

  // Demo view
  demo:        { display: "flex", flexDirection: "column", gap: 16 },
  statsBar:    { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  statCard:    { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  statValue:   { fontSize: 24, fontWeight: 800 },
  statLabel:   { fontSize: 12, color: "#6b7280" },
  addBtn:      { padding: "9px 18px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  resultLine:  { fontSize: 13, color: "#374151", fontWeight: 600 },
};

export default SeparationOfConcernsDemo;
