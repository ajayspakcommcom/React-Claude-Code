// SEPARATION OF CONCERNS — components/TaskList.tsx
// LAYER 4 — Presentation Layer
//
// Single responsibility: renders the task list and empty state.
// Pure props in, JSX out. Zero logic.

import React from "react";
import { TaskCard } from "./TaskCard";
import type { Task } from "../types";

interface Props {
  tasks:    Task[];
  onDelete: (id: number) => void;
  onToggle: (id: number) => void;
}

export const TaskList = ({ tasks, onDelete, onToggle }: Props) => {
  if (tasks.length === 0) {
    return (
      <div style={s.empty}>
        <span style={{ fontSize: 40 }}>📋</span>
        <p style={{ color: "#6b7280", marginTop: 8 }}>No tasks match your filters.</p>
      </div>
    );
  }

  return (
    <div style={s.list}>
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onDelete={onDelete}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  list:  { display: "flex", flexDirection: "column", gap: 10 },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0" },
};
