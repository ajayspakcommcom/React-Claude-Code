// TOPIC: Sales Bar Chart — Recharts BarChart (grouped comparison)
//
// Recharts concepts demonstrated:
//   - BarChart with grouped bars (this year vs last year side-by-side)
//   - barSize: fixed pixel width so bars don't stretch on wide screens
//   - barCategoryGap / barGap: control spacing between groups and within groups
//   - Cell: color individual bars differently (e.g. current month highlighted)
//   - ReferenceLine: horizontal baseline or target line
//   - Brush: scrollable date range selector at bottom of chart

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from "recharts";
import { ChartSkeleton } from "./RevenueChart";
import type { MonthlySales } from "../types";

// ─── Custom tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, dark }: any) => {
  if (!active || !payload?.length) return null;
  const fmt = (v: number) => `$${(v / 1_000).toFixed(0)}K`;
  const thisY  = payload.find((p: any) => p.dataKey === "thisYear");
  const lastY  = payload.find((p: any) => p.dataKey === "lastYear");
  const change = thisY && lastY
    ? (((thisY.value - lastY.value) / lastY.value) * 100).toFixed(1)
    : null;

  return (
    <div style={{
      background: dark ? "#1e293b" : "#fff",
      border: `1px solid ${dark ? "#334155" : "#e5e7eb"}`,
      borderRadius: 10, padding: "12px 16px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    }}>
      <p style={{ margin: "0 0 8px", fontWeight: 700, color: dark ? "#f1f5f9" : "#111827" }}>{label}</p>
      {thisY && <p style={{ margin: "4px 0", color: "#3b82f6", fontSize: 13 }}>This year: {fmt(thisY.value)}</p>}
      {lastY && <p style={{ margin: "4px 0", color: "#94a3b8", fontSize: 13 }}>Last year: {fmt(lastY.value)}</p>}
      {change && (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: Number(change) >= 0 ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
          {Number(change) >= 0 ? "▲" : "▼"} {Math.abs(Number(change))}% YoY
        </p>
      )}
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  data:     MonthlySales[];
  dark:     boolean;
  loading?: boolean;
}

// Current month index (to highlight it)
const CURRENT_MONTH = new Date().getMonth();

export const SalesBarChart = ({ data, dark, loading }: Props) => {
  if (loading) return <ChartSkeleton dark={dark} />;

  const textColor = dark ? "#94a3b8" : "#6b7280";
  const gridColor = dark ? "#334155" : "#e5e7eb";
  const cardBg    = dark ? "#1e293b" : "#fff";
  const borderClr = dark ? "#334155" : "#e5e7eb";
  const fmtY      = (v: number) => `$${(v / 1_000).toFixed(0)}K`;

  // Average this year for reference line
  const avg = data.length
    ? data.reduce((s, d) => s + d.thisYear, 0) / data.length
    : 0;

  return (
    <div style={{ ...s.card, background: cardBg, border: `1px solid ${borderClr}` }}>
      <div style={s.header}>
        <div>
          <h3 style={{ ...s.title, color: dark ? "#f1f5f9" : "#111827" }}>Monthly Sales</h3>
          <p style={{ ...s.sub, color: textColor }}>This year vs last year comparison</p>
        </div>
        <div style={{ ...s.avgBadge, background: dark ? "#0f172a" : "#eff6ff", color: "#3b82f6" }}>
          Avg: ${(avg / 1_000).toFixed(0)}K/mo
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          barCategoryGap="25%"   // gap between month groups
          barGap={3}             // gap between bars within a group
          margin={{ top: 10, right: 10, bottom: 0, left: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />

          <XAxis
            dataKey="month"
            tick={{ fill: textColor, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmtY}
            tick={{ fill: textColor, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={55}
          />

          <Tooltip content={<CustomTooltip dark={dark} />} cursor={{ fill: dark ? "#ffffff08" : "#00000008" }} />

          <Legend
            formatter={(value) => (
              <span style={{ color: dark ? "#cbd5e1" : "#374151", fontSize: 13 }}>
                {value === "thisYear" ? "This Year" : "Last Year"}
              </span>
            )}
          />

          {/* Average reference line */}
          <ReferenceLine
            y={avg}
            stroke="#f59e0b"
            strokeDasharray="6 3"
            label={{ value: "Avg", position: "insideTopRight", fill: "#f59e0b", fontSize: 11 }}
          />

          {/* This year — highlight current month with brighter color */}
          <Bar dataKey="thisYear" name="thisYear" radius={[4, 4, 0, 0]}>
            {data.map((_entry, index) => (
              <Cell
                key={index}
                fill={index === CURRENT_MONTH ? "#2563eb" : "#3b82f6"}
                opacity={index === CURRENT_MONTH ? 1 : 0.8}
              />
            ))}
          </Bar>

          {/* Last year — muted */}
          <Bar dataKey="lastYear" name="lastYear" fill="#94a3b8" radius={[4, 4, 0, 0]} opacity={0.5} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  card:     { borderRadius: 12, padding: 24 },
  header:   { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title:    { fontSize: 16, fontWeight: 700, margin: 0 },
  sub:      { fontSize: 13, margin: "4px 0 0" },
  avgBadge: { padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600 },
};
