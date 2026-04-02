// TOPIC: KPI Card — Metric card with sparkline + trend indicator
//
// Production patterns:
//   - Sparkline (mini inline chart) using Recharts ResponsiveContainer + AreaChart
//   - Format values by unit type (currency, number, percent)
//   - Trend arrow + color: green = up, red = down (configurable — sometimes down is good)
//   - Skeleton loading state matching card shape

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
} from "recharts";
import type { KPIMetric } from "../types";

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatValue = (value: number, unit: KPIMetric["unit"]): string => {
  if (unit === "currency") {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000)     return `$${(value / 1_000).toFixed(1)}K`;
    return `$${value}`;
  }
  if (unit === "percent") return `${value.toFixed(2)}%`;
  if (value >= 1_000_000)  return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)      return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export const KPICardSkeleton = ({ dark }: { dark: boolean }) => (
  <div style={{ ...s.card, background: dark ? "#1e293b" : "#fff" }}>
    <div style={{ ...s.skeletonLine, width: "40%", background: dark ? "#334155" : "#e5e7eb" }} />
    <div style={{ ...s.skeletonLine, width: "60%", height: 32, marginTop: 12, background: dark ? "#334155" : "#e5e7eb" }} />
    <div style={{ ...s.skeletonLine, width: "50%", height: 12, marginTop: 8, background: dark ? "#334155" : "#e5e7eb" }} />
    <div style={{ height: 48, marginTop: 16, background: dark ? "#334155" : "#e5e7eb", borderRadius: 4 }} />
  </div>
);

// ─── Sparkline tooltip ────────────────────────────────────────────────────────

const SparkTooltip = ({ active, payload, unit }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e293b", color: "#fff", padding: "4px 8px", borderRadius: 6, fontSize: 12 }}>
      {formatValue(payload[0].value, unit)}
    </div>
  );
};

// ─── KPICard ──────────────────────────────────────────────────────────────────

interface Props {
  metric: KPIMetric;
  dark:   boolean;
}

export const KPICard = ({ metric, dark }: Props) => {
  const isPositive   = metric.change >= 0;
  const sparkData    = metric.sparkline.map((v, i) => ({ i, v }));
  const sparkColor   = isPositive ? "#22c55e" : "#ef4444";

  const cardBg    = dark ? "#1e293b" : "#fff";
  const textMain  = dark ? "#f1f5f9" : "#111827";
  const textSub   = dark ? "#94a3b8" : "#6b7280";
  const border    = dark ? "#334155" : "#e5e7eb";

  return (
    <div style={{ ...s.card, background: cardBg, border: `1px solid ${border}` }}>
      {/* Header row */}
      <div style={s.headerRow}>
        <span style={{ ...s.label, color: textSub }}>{metric.label}</span>
        <span style={s.icon}>{metric.icon}</span>
      </div>

      {/* Main value */}
      <div style={{ ...s.value, color: textMain }}>
        {formatValue(metric.value, metric.unit)}
      </div>

      {/* Trend badge */}
      <div style={s.trendRow}>
        <span style={{
          ...s.trendBadge,
          background: isPositive ? "#dcfce7" : "#fef2f2",
          color:      isPositive ? "#166534" : "#dc2626",
        }}>
          {isPositive ? "▲" : "▼"} {Math.abs(metric.change).toFixed(1)}%
        </span>
        <span style={{ ...s.changeLabel, color: textSub }}>{metric.changeLabel}</span>
      </div>

      {/* Sparkline */}
      <div style={s.sparkWrap}>
        <ResponsiveContainer width="100%" height={48}>
          <AreaChart data={sparkData} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`grad-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"   stopColor={sparkColor} stopOpacity={0.3} />
                <stop offset="95%"  stopColor={sparkColor} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <Tooltip content={<SparkTooltip unit={metric.unit} />} />
            <Area
              type="monotone"
              dataKey="v"
              stroke={sparkColor}
              strokeWidth={2}
              fill={`url(#grad-${metric.id})`}
              dot={false}
              activeDot={{ r: 3, fill: sparkColor }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  card:        { borderRadius: 12, padding: "20px 24px", transition: "box-shadow 0.2s" },
  headerRow:   { display: "flex", justifyContent: "space-between", alignItems: "center" },
  label:       { fontSize: 13, fontWeight: 500 },
  icon:        { fontSize: 22 },
  value:       { fontSize: 28, fontWeight: 700, marginTop: 8, letterSpacing: -0.5 },
  trendRow:    { display: "flex", alignItems: "center", gap: 8, marginTop: 6 },
  trendBadge:  { fontSize: 12, fontWeight: 700, padding: "2px 8px", borderRadius: 20 },
  changeLabel: { fontSize: 12 },
  sparkWrap:   { marginTop: 12 },
  skeletonLine:{ height: 14, borderRadius: 4, animation: "pulse 1.5s ease-in-out infinite" },
};
