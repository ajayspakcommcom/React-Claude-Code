// SEPARATION OF CONCERNS — types.ts
// LAYER 1 — Type Layer
//
// Single responsibility: defines the data shapes.
// Has ZERO logic, ZERO React, ZERO side effects.
// Changes only when the data model changes.

export type Priority = "low" | "medium" | "high";
export type Status   = "todo" | "in-progress" | "done";

export interface Task {
  id:          number;
  title:       string;
  description: string;
  priority:    Priority;
  status:      Status;
  dueDate:     string;  // YYYY-MM-DD
  createdAt:   string;  // ISO 8601
  tags:        string[];
}

// What the form collects (tags as raw comma-separated string)
export interface TaskFormData {
  title:       string;
  description: string;
  priority:    Priority;
  status:      Status;
  dueDate:     string;
  tags:        string;
}

export interface TaskFilters {
  search:   string;
  status:   Status | "all";
  priority: Priority | "all";
  sortBy:   "dueDate" | "priority" | "createdAt";
}

export const DEFAULT_FILTERS: TaskFilters = {
  search:   "",
  status:   "all",
  priority: "all",
  sortBy:   "dueDate",
};

export const EMPTY_FORM: TaskFormData = {
  title:       "",
  description: "",
  priority:    "medium",
  status:      "todo",
  dueDate:     "",
  tags:        "",
};
