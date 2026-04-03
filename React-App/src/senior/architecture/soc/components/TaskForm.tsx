// SEPARATION OF CONCERNS — components/TaskForm.tsx
// LAYER 4 — Presentation Layer
//
// Single responsibility: renders the "add task" form.
// Has ZERO validation logic — just calls props when inputs change.
// The validation error messages come in as props from useTaskForm.

import React from "react";
import type { TaskFormData } from "../types";

interface Props {
  form:         TaskFormData;
  errors:       Partial<Record<keyof TaskFormData, string>>;
  setField:     <K extends keyof TaskFormData>(field: K, value: TaskFormData[K]) => void;
  onSubmit:     (e: React.FormEvent) => void;
  onCancel:     () => void;
}

export const TaskForm = ({ form, errors, setField, onSubmit, onCancel }: Props) => (
  <form onSubmit={onSubmit} style={s.form}>
    <div style={s.row}>
      {/* Title */}
      <div style={s.field}>
        <label style={s.label}>Title *</label>
        <input
          value={form.title}
          onChange={(e) => setField("title", e.target.value)}
          placeholder="Task title…"
          style={{ ...s.input, ...(errors.title ? s.inputError : {}) }}
        />
        {errors.title && <span style={s.error}>{errors.title}</span>}
      </div>

      {/* Due date */}
      <div style={{ ...s.field, maxWidth: 160 }}>
        <label style={s.label}>Due date *</label>
        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => setField("dueDate", e.target.value)}
          style={{ ...s.input, ...(errors.dueDate ? s.inputError : {}) }}
        />
        {errors.dueDate && <span style={s.error}>{errors.dueDate}</span>}
      </div>
    </div>

    {/* Description */}
    <div style={s.field}>
      <label style={s.label}>Description</label>
      <textarea
        value={form.description}
        onChange={(e) => setField("description", e.target.value)}
        placeholder="Optional description…"
        rows={2}
        style={{ ...s.input, resize: "vertical" }}
      />
    </div>

    <div style={s.row}>
      {/* Priority */}
      <div style={s.field}>
        <label style={s.label}>Priority</label>
        <select
          value={form.priority}
          onChange={(e) => setField("priority", e.target.value as TaskFormData["priority"])}
          style={s.input}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Status */}
      <div style={s.field}>
        <label style={s.label}>Status</label>
        <select
          value={form.status}
          onChange={(e) => setField("status", e.target.value as TaskFormData["status"])}
          style={s.input}
        >
          <option value="todo">Todo</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      {/* Tags */}
      <div style={s.field}>
        <label style={s.label}>Tags (comma-separated)</label>
        <input
          value={form.tags}
          onChange={(e) => setField("tags", e.target.value)}
          placeholder="e.g. backend, auth"
          style={s.input}
        />
      </div>
    </div>

    <div style={s.actions}>
      <button type="submit" style={s.submitBtn}>Add Task</button>
      <button type="button" onClick={onCancel} style={s.cancelBtn}>Cancel</button>
    </div>
  </form>
);

const s: Record<string, React.CSSProperties> = {
  form:      { background: "#f8fafc", border: "1.5px solid #e5e7eb", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 14 },
  row:       { display: "flex", gap: 12, flexWrap: "wrap" },
  field:     { flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 140 },
  label:     { fontSize: 12, fontWeight: 600, color: "#374151" },
  input:     { padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", background: "#fff", width: "100%", boxSizing: "border-box" as const },
  inputError:{ borderColor: "#f87171" },
  error:     { fontSize: 12, color: "#dc2626" },
  actions:   { display: "flex", gap: 8 },
  submitBtn: { padding: "9px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  cancelBtn: { padding: "9px 16px", background: "none", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, cursor: "pointer", color: "#6b7280" },
};
