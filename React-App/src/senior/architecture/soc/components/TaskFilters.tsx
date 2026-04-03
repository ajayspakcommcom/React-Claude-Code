// SEPARATION OF CONCERNS — components/TaskFilters.tsx
// LAYER 4 — Presentation Layer
//
// Single responsibility: renders the search + filter controls.
// All state lives in useTaskFilters hook — this component just calls props.

import React from "react";
import type { TaskFilters } from "../types";

interface Props {
  filters:     TaskFilters;
  activeCount: number;
  onSearch:    (v: string) => void;
  onStatus:    (v: TaskFilters["status"]) => void;
  onPriority:  (v: TaskFilters["priority"]) => void;
  onSortBy:    (v: TaskFilters["sortBy"]) => void;
  onReset:     () => void;
}

export const TaskFiltersBar = ({
  filters, activeCount, onSearch, onStatus, onPriority, onSortBy, onReset,
}: Props) => (
  <div style={s.bar}>
    {/* Search */}
    <input
      placeholder="Search tasks…"
      value={filters.search}
      onChange={(e) => onSearch(e.target.value)}
      style={s.search}
    />

    {/* Status */}
    <select
      value={filters.status}
      onChange={(e) => onStatus(e.target.value as TaskFilters["status"])}
      style={s.select}
    >
      <option value="all">All statuses</option>
      <option value="todo">Todo</option>
      <option value="in-progress">In Progress</option>
      <option value="done">Done</option>
    </select>

    {/* Priority */}
    <select
      value={filters.priority}
      onChange={(e) => onPriority(e.target.value as TaskFilters["priority"])}
      style={s.select}
    >
      <option value="all">All priorities</option>
      <option value="high">High</option>
      <option value="medium">Medium</option>
      <option value="low">Low</option>
    </select>

    {/* Sort */}
    <select
      value={filters.sortBy}
      onChange={(e) => onSortBy(e.target.value as TaskFilters["sortBy"])}
      style={s.select}
    >
      <option value="dueDate">Sort: Due date</option>
      <option value="priority">Sort: Priority</option>
      <option value="createdAt">Sort: Created</option>
    </select>

    {/* Reset */}
    {activeCount > 0 && (
      <button onClick={onReset} style={s.reset}>
        Clear ({activeCount})
      </button>
    )}
  </div>
);

const s: Record<string, React.CSSProperties> = {
  bar:    { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  search: { flex: 1, minWidth: 180, padding: "8px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none" },
  select: { padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff", cursor: "pointer" },
  reset:  { padding: "8px 14px", border: "1.5px solid #fca5a5", borderRadius: 8, background: "#fff", color: "#dc2626", fontSize: 13, cursor: "pointer", fontWeight: 600 },
};
