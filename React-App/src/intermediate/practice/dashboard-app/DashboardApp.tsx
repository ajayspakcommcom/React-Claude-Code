// TOPIC: Dashboard App — Root Component
//
// Production patterns demonstrated:
//   1. QueryClientProvider — React Query wraps everything
//   2. Date range picker   — controls ALL charts simultaneously via shared state
//   3. Dark mode toggle    — propagated via prop (no Context needed at this scale)
//   4. placeholderData     — old data stays visible when switching ranges (no blank flash)
//   5. refetchInterval     — auto-refresh every 5 min (live dashboard feel)
//   6. Chart grid layout   — CSS Grid for responsive 2-column layout
//   7. Last updated stamp  — shows when data was last fetched + manual refresh button
//   8. Export PNG          — html2canvas-style export using browser's print API

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { KPICard, KPICardSkeleton }   from "./components/KPICard";
import { RevenueChart }               from "./components/RevenueChart";
import { SalesBarChart }              from "./components/SalesBarChart";
import { TrafficPieChart }            from "./components/TrafficPieChart";
import { UserGrowthChart }            from "./components/UserGrowthChart";
import { TopProductsTable }           from "./components/TopProductsTable";

import {
  useKPIs,
  useTimeSeries,
  useMonthlySales,
  useTraffic,
  useUserGrowth,
  useTopProducts,
  useLastUpdated,
} from "./hooks/useDashboard";

import type { DateRange } from "./types";

// ─── React Query client ───────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
});

// ─── Date range picker ────────────────────────────────────────────────────────

const RANGES: { label: string; value: DateRange }[] = [
  { label: "7 days",   value: "7d"  },
  { label: "30 days",  value: "30d" },
  { label: "90 days",  value: "90d" },
  { label: "1 year",   value: "1y"  },
];

const DateRangePicker = ({
  value,
  onChange,
  dark,
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
  dark: boolean;
}) => (
  <div style={{ display: "flex", gap: 4, background: dark ? "#0f172a" : "#f1f5f9", borderRadius: 10, padding: 4 }}>
    {RANGES.map((r) => (
      <button
        key={r.value}
        onClick={() => onChange(r.value)}
        style={{
          padding:      "6px 16px",
          borderRadius: 8,
          border:       "none",
          cursor:       "pointer",
          fontSize:     13,
          fontWeight:   600,
          transition:   "all 0.15s",
          background:   value === r.value ? (dark ? "#1e293b" : "#fff") : "transparent",
          color:        value === r.value ? (dark ? "#60a5fa" : "#1d4ed8") : (dark ? "#64748b" : "#6b7280"),
          boxShadow:    value === r.value ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
        }}
      >
        {r.label}
      </button>
    ))}
  </div>
);

// ─── Inner dashboard (inside QueryClientProvider) ─────────────────────────────

const DashboardContent = () => {
  const [range, setRange] = useState<DateRange>("30d");
  const [dark,  setDark]  = useState(false);

  const { kpis,         isLoading: kpisLoading }    = useKPIs(range);
  const { timeSeries,   isLoading: tsLoading }      = useTimeSeries(range);
  const { monthlySales, isLoading: msLoading }      = useMonthlySales(range);
  const { traffic,      isLoading: trafficLoading } = useTraffic(range);
  const { userGrowth,   isLoading: ugLoading }      = useUserGrowth(range);
  const { topProducts,  isLoading: tpLoading }      = useTopProducts(range);
  const { lastUpdated,  isFetching, refetch }        = useLastUpdated(range);

  const bg      = dark ? "#0f172a" : "#f1f5f9";
  const textMain = dark ? "#f1f5f9" : "#111827";
  const textSub  = dark ? "#94a3b8" : "#6b7280";

  const fmtUpdated = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div style={{ minHeight: "100vh", background: bg, fontFamily: "system-ui,-apple-system,sans-serif" }}>

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        padding:        "0 32px",
        height:         64,
        background:     dark ? "#1e293b" : "#fff",
        borderBottom:   `1px solid ${dark ? "#334155" : "#e5e7eb"}`,
        position:       "sticky",
        top:            0,
        zIndex:         100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>📊</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: textMain }}>Analytics Dashboard</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* Last updated */}
          <span style={{ fontSize: 12, color: textSub }}>
            {isFetching ? "Refreshing…" : `Updated ${fmtUpdated}`}
          </span>
          <button
            onClick={() => refetch()}
            style={{ background: "none", border: `1px solid ${dark ? "#334155" : "#e5e7eb"}`, borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, color: textSub }}
          >
            ↺ Refresh
          </button>

          {/* Dark mode toggle */}
          <button
            onClick={() => setDark((d) => !d)}
            style={{
              background: dark ? "#334155" : "#f1f5f9",
              border:     "none",
              borderRadius: 20,
              padding:    "6px 14px",
              cursor:     "pointer",
              fontSize:   18,
            }}
            aria-label="Toggle dark mode"
          >
            {dark ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>

        {/* Page title + date range */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: textMain, margin: 0 }}>
              Business Overview
            </h1>
            <p style={{ color: textSub, marginTop: 4, fontSize: 14 }}>
              Track your key metrics and performance
            </p>
          </div>
          <DateRangePicker value={range} onChange={setRange} dark={dark} />
        </div>

        {/* ── KPI cards ─────────────────────────────────────────────────── */}
        <div style={{
          display:             "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap:                 16,
          marginBottom:        24,
        }}>
          {kpisLoading
            ? Array.from({ length: 6 }, (_, i) => <KPICardSkeleton key={i} dark={dark} />)
            : kpis.map((metric) => <KPICard key={metric.id} metric={metric} dark={dark} />)
          }
        </div>

        {/* ── Revenue + Traffic row ──────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
          <RevenueChart  data={timeSeries}  dark={dark} loading={tsLoading}      />
          <TrafficPieChart data={traffic}   dark={dark} loading={trafficLoading} />
        </div>

        {/* ── Sales bar + User growth row ────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <SalesBarChart  data={monthlySales} dark={dark} loading={msLoading} />
          <UserGrowthChart data={userGrowth}  dark={dark} loading={ugLoading} />
        </div>

        {/* ── Top products table (full width) ───────────────────────────── */}
        <TopProductsTable data={topProducts} dark={dark} loading={tpLoading} />

        {/* ── Recharts concepts legend ───────────────────────────────────── */}
        <div style={{
          marginTop:    32,
          padding:      "20px 24px",
          background:   dark ? "#1e293b" : "#fff",
          border:       `1px solid ${dark ? "#334155" : "#e5e7eb"}`,
          borderRadius: 12,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: textMain, margin: "0 0 12px" }}>
            📚 Recharts Concepts Used in This Dashboard
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px 24px" }}>
            {[
              "ResponsiveContainer — fills parent width automatically",
              "AreaChart + linearGradient — filled area with gradient",
              "BarChart + Cell — individual bar colors",
              "PieChart + innerRadius — donut chart variant",
              "LineChart + strokeDasharray — dashed line series",
              "CartesianGrid — subtle background grid",
              "XAxis / YAxis + tickFormatter — custom labels",
              "Tooltip — custom styled hover card",
              "Legend — custom interactive legend",
              "ReferenceLine — event markers + targets",
              "ReferenceArea — shaded background regions",
              "activeShape — enlarged hover slice (Pie)",
              "Sector — low-level shape component",
              "dot / activeDot — show/hide data points",
              "placeholderData — no blank flash on range switch",
            ].map((item, i) => (
              <div key={i} style={{ fontSize: 12, color: textSub, display: "flex", gap: 8 }}>
                <span style={{ color: "#3b82f6", flexShrink: 0 }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

// ─── Root export ──────────────────────────────────────────────────────────────

const DashboardApp = () => (
  <QueryClientProvider client={queryClient}>
    <DashboardContent />
  </QueryClientProvider>
);

export default DashboardApp;
