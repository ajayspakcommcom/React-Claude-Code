// SEPARATION OF CONCERNS — services/taskService.ts
// LAYER 2 — Service / Data Layer
//
// Single responsibility: knows how to read and write task data.
// Has ZERO React (no useState, useEffect, JSX).
// Has ZERO business-rule decisions — it just does what it's told.
//
// If we swap in-memory storage → REST API → GraphQL,
// ONLY this file changes. Nothing else in the app needs to know.

import type { Task, TaskFilters, TaskFormData, Priority } from "../types";

// ─── Seed data ────────────────────────────────────────────────────────────────

const PRIORITY_WEIGHT: Record<Priority, number> = { high: 3, medium: 2, low: 1 };

let nextId = 9;

let db: Task[] = [
  {
    id: 1,
    title: "Set up CI/CD pipeline",
    description: "Configure GitHub Actions for automated testing and deployment.",
    priority: "high",
    status: "in-progress",
    dueDate: "2026-04-05",
    createdAt: "2026-04-01T09:00:00Z",
    tags: ["devops", "automation"],
  },
  {
    id: 2,
    title: "Write unit tests for auth module",
    description: "Achieve 80% coverage on the authentication feature.",
    priority: "high",
    status: "todo",
    dueDate: "2026-04-07",
    createdAt: "2026-04-01T10:00:00Z",
    tags: ["testing", "auth"],
  },
  {
    id: 3,
    title: "Design system audit",
    description: "Review all components for consistency with the design tokens.",
    priority: "medium",
    status: "todo",
    dueDate: "2026-04-10",
    createdAt: "2026-04-01T11:00:00Z",
    tags: ["design", "ui"],
  },
  {
    id: 4,
    title: "Migrate to feature-based structure",
    description: "Reorganise /src according to the new feature-based folder layout.",
    priority: "high",
    status: "done",
    dueDate: "2026-04-03",
    createdAt: "2026-03-30T08:00:00Z",
    tags: ["architecture", "refactor"],
  },
  {
    id: 5,
    title: "Performance audit",
    description: "Run Lighthouse and address Web Vitals issues.",
    priority: "medium",
    status: "todo",
    dueDate: "2026-04-15",
    createdAt: "2026-04-02T09:00:00Z",
    tags: ["performance"],
  },
  {
    id: 6,
    title: "Update onboarding docs",
    description: "Refresh README and CONTRIBUTING guide for new hires.",
    priority: "low",
    status: "in-progress",
    dueDate: "2026-04-12",
    createdAt: "2026-04-02T14:00:00Z",
    tags: ["docs"],
  },
  {
    id: 7,
    title: "API rate limiting",
    description: "Add rate-limit middleware to all public endpoints.",
    priority: "high",
    status: "todo",
    dueDate: "2026-04-08",
    createdAt: "2026-04-02T15:00:00Z",
    tags: ["backend", "security"],
  },
  {
    id: 8,
    title: "Accessibility review",
    description: "Run axe-core on all main pages and fix critical issues.",
    priority: "medium",
    status: "done",
    dueDate: "2026-04-02",
    createdAt: "2026-03-31T10:00:00Z",
    tags: ["a11y", "ui"],
  },
];

// ─── Public API ───────────────────────────────────────────────────────────────

export const taskService = {
  // Read — filter → sort → return copy (never mutate)
  getAll(filters: TaskFilters): Task[] {
    let result = [...db];

    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    if (filters.status !== "all") {
      result = result.filter((t) => t.status === filters.status);
    }

    if (filters.priority !== "all") {
      result = result.filter((t) => t.priority === filters.priority);
    }

    result.sort((a, b) => {
      if (filters.sortBy === "priority") {
        return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      }
      if (filters.sortBy === "createdAt") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    return result;
  },

  // Write — create, update, delete, toggle
  create(data: TaskFormData): Task {
    const task: Task = {
      id:          nextId++,
      title:       data.title.trim(),
      description: data.description.trim(),
      priority:    data.priority,
      status:      data.status,
      dueDate:     data.dueDate,
      createdAt:   new Date().toISOString(),
      tags:        data.tags.split(",").map((t) => t.trim()).filter(Boolean),
    };
    db = [...db, task];
    return task;
  },

  update(id: number, patch: Partial<Omit<Task, "id" | "createdAt">>): Task {
    db = db.map((t) => (t.id === id ? { ...t, ...patch } : t));
    return db.find((t) => t.id === id)!;
  },

  delete(id: number): void {
    db = db.filter((t) => t.id !== id);
  },

  toggle(id: number): Task {
    const task = db.find((t) => t.id === id)!;
    const next: Task["status"] = task.status === "done" ? "todo" : "done";
    return taskService.update(id, { status: next });
  },

  // Aggregates — computed from raw data
  getStats() {
    return {
      total:      db.length,
      todo:       db.filter((t) => t.status === "todo").length,
      inProgress: db.filter((t) => t.status === "in-progress").length,
      done:       db.filter((t) => t.status === "done").length,
    };
  },
};
