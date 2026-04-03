// SEPARATION OF CONCERNS — hooks/useTaskFilters.ts
// LAYER 3 — Business Logic Layer
//
// Single responsibility: manages filter state and derives related values.
// No rendering, no data fetching — just filter state.

import { useState, useCallback } from "react";
import { DEFAULT_FILTERS } from "../types";
import type { TaskFilters } from "../types";

export const useTaskFilters = () => {
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);

  const setSearch = useCallback(
    (search: string) => setFilters((f) => ({ ...f, search })), []);

  const setStatus = useCallback(
    (status: TaskFilters["status"]) => setFilters((f) => ({ ...f, status })), []);

  const setPriority = useCallback(
    (priority: TaskFilters["priority"]) => setFilters((f) => ({ ...f, priority })), []);

  const setSortBy = useCallback(
    (sortBy: TaskFilters["sortBy"]) => setFilters((f) => ({ ...f, sortBy })), []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  // Derived value — how many filters are active (for badge display)
  const activeCount =
    (filters.search ? 1 : 0) +
    (filters.status !== "all" ? 1 : 0) +
    (filters.priority !== "all" ? 1 : 0);

  return { filters, setSearch, setStatus, setPriority, setSortBy, resetFilters, activeCount };
};
