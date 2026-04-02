// TOPIC: User Growth Chart — Recharts LineChart (multi-series + annotations)
//
// Recharts concepts demonstrated:
//   - LineChart with multiple Line series
//   - strokeDasharray: dashed line for "churned" (visually distinct from growth)
//   - dot + activeDot: show/hide data point dots
//   - Label on a data point: annotate a specific event ("Product Launch")
//   - ReferenceArea: shade a background region (e.g. "Holiday season")
//   - ReferenceLine with label: vertical event marker

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import { ChartSkeleton } from "./RevenueChart";
import type { UserGrowthPoint } from "../types";

// ─── Custom tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label, dark }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: dark ? "#1e293b" : "#fff",
      border: `1px solid ${dark ? "#334155" : "#e5e7eb"}`,
      borderRadius: 10, padding: "12px 16px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    }}>
      <p style={{ margin: "0 0 8px", fontWeight: 700, color: dark ? "#f1f5f9" : "#111827" }}>{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ margin: "4px 0", color: entry.color, fontSize: 13 }}>
          <span style={{ fontWeight: 600 }}>{entry.name}:</span> {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  data:     UserGrowthPoint[];
  dark:     boolean;
  loading?: boolean;
}

export const UserGrowthChart = ({ data, dark, loading }: Props) => {
  if (loading) return <ChartSkeleton dark={dark} />;

  const textColor = dark ? "#94a3b8" : "#6b7280";
  const gridColor = dark ? "#334155" : "#e5e7eb";
  const cardBg    = dark ? "#1e293b" : "#fff";
  const borderClr = dark ? "#334155" : "#e5e7eb";
  const fmtY      = (v: number) => v >= 1_000 ? `${(v / 1_000).toFixed(1)}K` : `${v}`;

  // Find midpoint of data for reference line (simulate "product launch")
  const midIdx    = Math.floor(data.length / 2);
  const midLabel  = data[midIdx]?.date ?? "";

  // Shade last 2 data points as "recent sprint"
  const lastLabel  = data[data.length - 1]?.date ?? "";
  const beforeLast = data[data.length - 2]?.date ?? "";

  return (
    <div style={{ ...s.card, background: cardBg, border: `1px solid ${borderClr}` }}>
      <div style={s.header}>
        <div>
          <h3 style={{ ...s.title, color: dark ? "#f1f5f9" : "#111827" }}>User Growth</h3>
          <p style={{ ...s.sub, color: textColor }}>New, returning, and churned users over time</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
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
            width={48}
          />

          <Tooltip content={<CustomTooltip dark={dark} />} />

          <Legend
            formatter={(value: string) => {
              const labels: Record<string, string> = { newUsers: "New Users", returning: "Returning", churned: "Churned" };
              return <span style={{ color: dark ? "#cbd5e1" : "#374151", fontSize: 13 }}>{labels[value] ?? value}</span>;
            }}
          />

          {/* Shade "recent period" background */}
          {data.length >= 2 && (
            <ReferenceArea
              x1={beforeLast}
              x2={lastLabel}
              fill={dark ? "#3b82f620" : "#3b82f610"}
              label={{ value: "Recent", position: "insideTop", fill: "#3b82f6", fontSize: 11 }}
            />
          )}

          {/* Product launch event marker */}
          {midLabel && (
            <ReferenceLine
              x={midLabel}
              stroke="#f59e0b"
              strokeDasharray="5 3"
              label={{ value: "Launch", position: "insideTopRight", fill: "#f59e0b", fontSize: 11 }}
            />
          )}

          {/* New users — solid blue */}
          <Line
            type="monotone"
            dataKey="newUsers"
            name="newUsers"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2 }}
          />

          {/* Returning — solid green */}
          <Line
            type="monotone"
            dataKey="returning"
            name="returning"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2 }}
          />

          {/* Churned — dashed red (visually different = negative metric) */}
          <Line
            type="monotone"
            dataKey="churned"
            name="churned"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  card:   { borderRadius: 12, padding: 24 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  title:  { fontSize: 16, fontWeight: 700, margin: 0 },
  sub:    { fontSize: 13, margin: "4px 0 0" },
};
