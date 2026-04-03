// SEPARATION OF CONCERNS — components/TaskCard.tsx
// LAYER 4 — Presentation Layer
//
// Single responsibility: renders ONE task. Nothing else.
// Receives data and callbacks as props — has ZERO business logic.
// If the design changes, ONLY this file changes.
// It knows nothing about how tasks are stored, fetched, or validated.

import React from "react";
import type { Task } from "../types";

interface Props {
  task:     Task;
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
}

export const TaskCard = ({ task, onDelete, onToggle }: Props) => {
  const isDone = task.status === "done";

  return (
    <div style={{ ...s.card, opacity: isDone ? 0.7 : 1 }}>
      <div style={s.top}>
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          style={{ ...s.check, ...(isDone ? s.checkDone : {}) }}
          title={isDone ? "Mark as todo" : "Mark as done"}
        >
          {isDone ? "✓" : ""}
        </button>

        <div style={s.body}>
          <span style={{ ...s.title, textDecoration: isDone ? "line-through" : "none", color: isDone ? "#9ca3af" : "#111827" }}>
            {task.title}
          </span>
          {task.description && (
            <span style={s.desc}>{task.description}</span>
          )}
        </div>

        <div style={s.right}>
          <span style={{ ...s.priority, ...PRIORITY_STYLES[task.priority] }}>
            {task.priority}
          </span>
          <span style={{ ...s.statusBadge, ...STATUS_STYLES[task.status] }}>
            {task.status}
          </span>
          <button style={s.deleteBtn} onClick={() => onDelete(task.id)} title="Delete">
            ✕
          </button>
        </div>
      </div>

      <div style={s.bottom}>
        <span style={s.due}>📅 {task.dueDate}</span>
        {task.tags.map((tag) => (
          <span key={tag} style={s.tag}>{tag}</span>
        ))}
      </div>
    </div>
  );
};

const PRIORITY_STYLES: Record<Task["priority"], React.CSSProperties> = {
  high:   { background: "#fee2e2", color: "#991b1b" },
  medium: { background: "#fef3c7", color: "#92400e" },
  low:    { background: "#dcfce7", color: "#166534" },
};

const STATUS_STYLES: Record<Task["status"], React.CSSProperties> = {
  "todo":        { background: "#f1f5f9", color: "#475569" },
  "in-progress": { background: "#dbeafe", color: "#1d4ed8" },
  "done":        { background: "#dcfce7", color: "#166534" },
};

const s: Record<string, React.CSSProperties> = {
  card:      { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 },
  top:       { display: "flex", alignItems: "flex-start", gap: 12 },
  check:     { width: 22, height: 22, flexShrink: 0, borderRadius: 6, border: "2px solid #d1d5db", background: "#f9fafb", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" },
  checkDone: { background: "#22c55e", borderColor: "#22c55e" },
  body:      { flex: 1, display: "flex", flexDirection: "column", gap: 3 },
  title:     { fontSize: 14, fontWeight: 600 },
  desc:      { fontSize: 12, color: "#6b7280", lineHeight: 1.5 },
  right:     { display: "flex", alignItems: "center", gap: 6, flexShrink: 0 },
  priority:  { fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, textTransform: "uppercase" },
  statusBadge:{ fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 600 },
  deleteBtn: { background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 14, padding: "2px 4px" },
  bottom:    { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
  due:       { fontSize: 12, color: "#6b7280" },
  tag:       { fontSize: 11, background: "#f1f5f9", color: "#475569", padding: "1px 8px", borderRadius: 20 },
};
