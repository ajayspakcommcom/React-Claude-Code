// TOPIC: Dashboard App — Type Definitions

// ─── Date range ───────────────────────────────────────────────────────────────

export type DateRange = "7d" | "30d" | "90d" | "1y";

// ─── KPI metrics ──────────────────────────────────────────────────────────────

export interface KPIMetric {
  id:          string;
  label:       string;
  value:       number;
  unit:        "currency" | "number" | "percent";
  change:      number;       // % change vs previous period (positive = up, negative = down)
  changeLabel: string;       // "vs last month"
  icon:        string;
  sparkline:   number[];     // last 7 data points for mini-chart
}

// ─── Time series ──────────────────────────────────────────────────────────────

export interface TimeSeriesPoint {
  date:     string;  // "Jan 1", "Feb 14", etc.
  revenue:  number;
  expenses: number;
  profit:   number;
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

export interface MonthlySales {
  month:     string;
  thisYear:  number;
  lastYear:  number;
}

// ─── Pie / donut chart ────────────────────────────────────────────────────────

export interface TrafficSource {
  name:       string;
  value:      number;
  percentage: number;
  color:      string;
}

// ─── Line chart (multi-series) ────────────────────────────────────────────────

export interface UserGrowthPoint {
  date:      string;
  newUsers:  number;
  returning: number;
  churned:   number;
}

// ─── Top products table ───────────────────────────────────────────────────────

export interface TopProduct {
  rank:     number;
  name:     string;
  category: string;
  revenue:  number;
  units:    number;
  growth:   number;  // % change
}

// ─── Full dashboard payload ───────────────────────────────────────────────────

export interface DashboardData {
  kpis:        KPIMetric[];
  timeSeries:  TimeSeriesPoint[];
  monthlySales: MonthlySales[];
  traffic:     TrafficSource[];
  userGrowth:  UserGrowthPoint[];
  topProducts: TopProduct[];
  lastUpdated: string;
}
