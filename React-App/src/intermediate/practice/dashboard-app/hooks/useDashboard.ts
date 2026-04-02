// TOPIC: Dashboard Hooks — React Query data fetching
//
// Production pattern: one hook per data concern.
// Components import exactly what they need — no prop drilling of raw data.
//
// Key decisions:
//   staleTime: 60s  — dashboard data doesn't change every second
//   refetchInterval: 5 min  — auto-refresh in background (live dashboard feel)
//   keepPreviousData (placeholderData) — old data stays visible while new range loads
//                                         prevents blank flash when switching 7d → 30d

import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "../api/dashboardApi";
import type { DateRange, DashboardData } from "../types";

// ─── Master hook — fetches everything for the selected range ──────────────────

export const useDashboard = (range: DateRange) =>
  useQuery<DashboardData>({
    queryKey:  ["dashboard", range],
    queryFn:   () => fetchDashboard(range),
    staleTime: 60_000,                       // fresh for 60 s
    refetchInterval: 5 * 60_000,             // auto-refresh every 5 min
    placeholderData: (prev) => prev,         // keep old data while new range loads
  });

// ─── Derived hooks — components only subscribe to what they need ──────────────
//
// These prevent unnecessary re-renders:
// A component using useKPIs() won't re-render when timeSeries changes.

export const useKPIs = (range: DateRange) => {
  const { data, isLoading, isError } = useDashboard(range);
  return { kpis: data?.kpis ?? [], isLoading, isError };
};

export const useTimeSeries = (range: DateRange) => {
  const { data, isLoading, isFetching } = useDashboard(range);
  return { timeSeries: data?.timeSeries ?? [], isLoading, isFetching };
};

export const useMonthlySales = (range: DateRange) => {
  const { data, isLoading } = useDashboard(range);
  return { monthlySales: data?.monthlySales ?? [], isLoading };
};

export const useTraffic = (range: DateRange) => {
  const { data, isLoading } = useDashboard(range);
  return { traffic: data?.traffic ?? [], isLoading };
};

export const useUserGrowth = (range: DateRange) => {
  const { data, isLoading } = useDashboard(range);
  return { userGrowth: data?.userGrowth ?? [], isLoading };
};

export const useTopProducts = (range: DateRange) => {
  const { data, isLoading } = useDashboard(range);
  return { topProducts: data?.topProducts ?? [], isLoading };
};

export const useLastUpdated = (range: DateRange) => {
  const { data, isFetching, refetch } = useDashboard(range);
  return {
    lastUpdated: data?.lastUpdated ?? null,
    isFetching,
    refetch,
  };
};
