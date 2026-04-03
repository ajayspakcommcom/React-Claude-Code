// SEPARATION OF CONCERNS — hooks/useTasks.ts
// LAYER 3 — Business Logic Layer
//
// Single responsibility: bridges the service layer and the UI layer.
// Knows about React (useReducer, useCallback) — but NOT about rendering.
// Knows about business rules — e.g. "toggle flips done↔todo".
//
// If a business rule changes (e.g. "only admins can delete"),
// ONLY this file changes. The service and components stay the same.

import { useReducer, useCallback } from "react";
import { taskService } from "../services/taskService";
import type { TaskFilters, TaskFormData } from "../types";

export const useTasks = (filters: TaskFilters) => {
  // forceUpdate re-renders after service mutates the in-memory db.
  // In a real app this would be replaced by React Query / SWR.
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const tasks = taskService.getAll(filters);
  const stats = taskService.getStats();

  const createTask = useCallback((data: TaskFormData) => {
    taskService.create(data);
    forceUpdate();
  }, []);

  const deleteTask = useCallback((id: number) => {
    taskService.delete(id);
    forceUpdate();
  }, []);

  const toggleTask = useCallback((id: number) => {
    taskService.toggle(id);
    forceUpdate();
  }, []);

  return { tasks, stats, createTask, deleteTask, toggleTask };
};
