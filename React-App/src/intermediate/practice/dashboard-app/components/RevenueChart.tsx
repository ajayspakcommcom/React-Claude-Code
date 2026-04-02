// TOPIC: Revenue Chart — Recharts AreaChart (time series)
//
// Recharts concepts demonstrated:
//   - ResponsiveContainer: makes chart fill its parent width automatically
//   - AreaChart: line chart with filled gradient under the line
//   - linearGradient in <defs>: gradient fill (fades to transparent at bottom)
//   - CartesianGrid: subtle background grid lines
//   - XAxis / YAxis: labels + tick formatting
//   - Tooltip: custom styled tooltip with formatted values
//   - Legend: series labels with colored indicators
//   - Multiple Area series: revenue, expenses, profit on one chart
//   - dot={false}: cleaner look for dense time series data
//   - Series toggle: click legend to show/hide a series

import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { TimeSeriesPoint } from "../types";

// ─── Custom tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, dark }: any) => {
  if (!active || !payload?.length) return null;
  const fmt = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

  return (
    <div style={{
      background:   dark ? "#1e293b" : "#fff",
      border:       `1px solid ${dark ? "#334155" : "#e5e7eb"}`,
      borderRadius: 10,
      padding:      "12px 16px",
      boxShadow:    "0 4px 16px rgba(0,0,0,0.12)",
    }}>
      <p style={{ margin: "0 0 8px", fontWeight: 700, color: dark ? "#f1f5f9" : "#111827" }}>{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ margin: "4px 0", color: entry.color, fontSize: 13 }}>
          <span style={{ fontWeight: 600 }}>{entry.name}:</span> {fmt(entry.value)}
        </p>
      ))}
    </div>
  );
};

// ─── Series config ────────────────────────────────────────────────────────────

const SERIES = [
  { key: "revenue",  name: "Revenue",  color: "#3b82f6" },
  { key: "expenses", name: "Expenses", color: "#ef4444" },
  { key: "profit",   name: "Profit",   color: "#22c55e" },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  data:     TimeSeriesPoint[];
  dark:     boolean;
  loading?: boolean;
}

export const RevenueChart = ({ data, dark, loading }: Props) => {
  // Series visibility toggle — click legend to show/hide
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const toggleSeries = (key: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const textColor  = dark ? "#94a3b8" : "#6b7280";
  const gridColor  = dark ? "#334155" : "#e5e7eb";
  const cardBg     = dark ? "#1e293b" : "#fff";
  const borderClr  = dark ? "#334155" : "#e5e7eb";

  const fmtY = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1_000).toFixed(0)}K`;

  if (loading) return <ChartSkeleton dark={dark} height={320} />;

  return (
    <div style={{ ...s.card, background: cardBg, border: `1px solid ${borderClr}` }}>
      <div style={s.header}>
        <div>
          <h3 style={{ ...s.title, color: dark ? "#f1f5f9" : "#111827" }}>Revenue Overview</h3>
          <p style={{ ...s.sub, color: textColor }}>Revenue, expenses, and profit over time</p>
        </div>
        {/* Custom legend with toggle */}
        <div style={s.legendRow}>
          {SERIES.map(({ key, name, color }) => (
            <button
              key={key}
              onClick={() => toggleSeries(key)}
              style={{
                ...s.legendBtn,
                opacity: hidden.has(key) ? 0.35 : 1,
                background: dark ? "#0f172a" : "#f8fafc",
              }}
            >
              <span style={{ ...s.legendDot, background: color }} />
              <span style={{ color: dark ? "#cbd5e1" : "#374151" }}>{name}</span>
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
          <defs>
            {SERIES.map(({ key, color }) => (
              <linearGradient key={key} id={`grad-rev-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0}    />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />

          <XAxis
            dataKey="date"
            tick={{ fill: textColor, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={fmtY}
            tick={{ fill: textColor, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={60}
          />

          <Tooltip content={<CustomTooltip dark={dark} />} />

          {/* Hide default Legend — we built a custom one above */}
          <Legend content={() => null} />

          {SERIES.map(({ key, name, color }) =>
            hidden.has(key) ? null : (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                name={name}
                stroke={color}
                strokeWidth={2}
                fill={`url(#grad-rev-${key})`}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2 }}
              />
            )
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ─── Shared skeleton ──────────────────────────────────────────────────────────

export const ChartSkeleton = ({ dark, height = 280 }: { dark: boolean; height?: number }) => (
  <div style={{
    borderRadius: 12,
    padding:      24,
    background:   dark ? "#1e293b" : "#fff",
    border:       `1px solid ${dark ? "#334155" : "#e5e7eb"}`,
    height:       height + 80,
    display:      "flex",
    alignItems:   "center",
    justifyContent: "center",
  }}>
    <div style={{ color: dark ? "#475569" : "#d1d5db", fontSize: 14 }}>Loading chart…</div>
  </div>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  card:      { borderRadius: 12, padding: 24 },
  header:    { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title:     { fontSize: 16, fontWeight: 700, margin: 0 },
  sub:       { fontSize: 13, margin: "4px 0 0" },
  legendRow: { display: "flex", gap: 8 },
  legendBtn: { display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "opacity 0.2s" },
  legendDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
};
