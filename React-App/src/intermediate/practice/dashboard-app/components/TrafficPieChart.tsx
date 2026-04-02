// TOPIC: Traffic Pie Chart — Recharts PieChart (donut variant)
//
// Recharts concepts demonstrated:
//   - PieChart with innerRadius (donut) vs 0 (solid pie)
//   - activeIndex + onMouseEnter: highlight a slice on hover
//   - Custom activeShape: enlarge + shadow the hovered slice
//   - Custom label: percent value rendered at slice midpoint
//   - Sector component: low-level shape used in activeShape
//   - Custom legend table (not Recharts Legend) — shows name + value + bar

import React, { useState, useCallback } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
  Tooltip,
} from "recharts";
import { ChartSkeleton } from "./RevenueChart";
import type { TrafficSource } from "../types";

// ─── Active slice shape (enlarged on hover) ───────────────────────────────────

const ActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius,
    startAngle, endAngle, fill,
    payload, percent,
  } = props;

  return (
    <g>
      {/* Center label */}
      <text x={cx} y={cy - 12} textAnchor="middle" fill={fill} style={{ fontSize: 18, fontWeight: 700 }}>
        {payload.name.split(" ")[0]}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#6b7280" style={{ fontSize: 13 }}>
        {(percent * 100).toFixed(0)}%
      </text>

      {/* Enlarged active sector */}
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      {/* Outer ring accent */}
      <Sector
        cx={cx} cy={cy}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 16}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.4}
      />
    </g>
  );
};

// ─── Custom tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, dark }: any) => {
  if (!active || !payload?.length) return null;
  const d: TrafficSource = payload[0].payload;
  return (
    <div style={{
      background: dark ? "#1e293b" : "#fff",
      border: `1px solid ${dark ? "#334155" : "#e5e7eb"}`,
      borderRadius: 10, padding: "10px 14px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    }}>
      <p style={{ margin: "0 0 4px", fontWeight: 700, color: dark ? "#f1f5f9" : "#111827" }}>{d.name}</p>
      <p style={{ margin: 0, fontSize: 13, color: d.color }}>
        {d.value.toLocaleString()} visits · {d.percentage}%
      </p>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  data:     TrafficSource[];
  dark:     boolean;
  loading?: boolean;
}

export const TrafficPieChart = ({ data, dark, loading }: Props) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const onEnter = useCallback((_: any, idx: number) => setActiveIdx(idx), []);

  if (loading) return <ChartSkeleton dark={dark} height={240} />;

  const cardBg    = dark ? "#1e293b" : "#fff";
  const borderClr = dark ? "#334155" : "#e5e7eb";
  const textMain  = dark ? "#f1f5f9" : "#111827";
  const textSub   = dark ? "#94a3b8" : "#6b7280";
  const total     = data.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ ...s.card, background: cardBg, border: `1px solid ${borderClr}` }}>
      <h3 style={{ ...s.title, color: textMain }}>Traffic Sources</h3>
      <p style={{ ...s.sub, color: textSub }}>Where your visitors come from</p>

      <div style={s.body}>
        {/* Donut chart */}
        <div style={{ width: 220, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                dataKey="value"
                activeShape={(props: any) =>
                  props.index === activeIdx ? <ActiveShape {...props} /> : (
                    <Sector
                      cx={props.cx} cy={props.cy}
                      innerRadius={props.innerRadius}
                      outerRadius={props.outerRadius}
                      startAngle={props.startAngle}
                      endAngle={props.endAngle}
                      fill={props.fill}
                    />
                  )
                }
                onMouseEnter={onEnter}
                paddingAngle={2}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip dark={dark} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend table */}
        <div style={s.legend}>
          {data.map((item, i) => (
            <div
              key={i}
              style={{ ...s.legendRow, opacity: i === activeIdx ? 1 : 0.65 }}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <span style={{ ...s.dot, background: item.color }} />
              <span style={{ ...s.legendName, color: textMain }}>{item.name}</span>
              <div style={s.barWrap}>
                <div style={{ ...s.bar, width: `${item.percentage}%`, background: item.color }} />
              </div>
              <span style={{ ...s.pct, color: textSub }}>{item.percentage}%</span>
              <span style={{ ...s.val, color: textSub }}>{(item.value / total * 100).toFixed(0)}K</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  card:       { borderRadius: 12, padding: 24 },
  title:      { fontSize: 16, fontWeight: 700, margin: 0 },
  sub:        { fontSize: 13, margin: "4px 0 16px" },
  body:       { display: "flex", gap: 24, alignItems: "center" },
  legend:     { flex: 1, display: "flex", flexDirection: "column", gap: 10 },
  legendRow:  { display: "flex", alignItems: "center", gap: 10, cursor: "default", transition: "opacity 0.15s" },
  dot:        { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  legendName: { fontSize: 13, width: 110, flexShrink: 0, fontWeight: 500 },
  barWrap:    { flex: 1, height: 6, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" },
  bar:        { height: "100%", borderRadius: 3, transition: "width 0.4s ease" },
  pct:        { fontSize: 12, width: 32, textAlign: "right", flexShrink: 0 },
  val:        { fontSize: 12, width: 32, textAlign: "right", flexShrink: 0 },
};
