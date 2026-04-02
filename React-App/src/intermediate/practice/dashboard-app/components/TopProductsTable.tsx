// TOPIC: Top Products Table — Sortable data table with useMemo
//
// Production patterns:
//   - useMemo for sort computation — re-sorts only when data or sort config changes
//   - Sort state: { key, direction } — click column header to toggle asc/desc
//   - Rank badge, growth indicator, formatted currency
//   - Sticky header: table header stays visible while body scrolls
//   - Zebra striping: alternating row colors for readability

import React, { useState, useMemo } from "react";
import type { TopProduct } from "../types";

type SortKey = keyof Pick<TopProduct, "revenue" | "units" | "growth" | "rank">;
type Direction = "asc" | "desc";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

const GrowthBadge = ({ value }: { value: number }) => {
  const up = value >= 0;
  return (
    <span style={{
      display:      "inline-flex",
      alignItems:   "center",
      gap:          3,
      padding:      "2px 8px",
      borderRadius: 20,
      fontSize:     12,
      fontWeight:   700,
      background:   up ? "#dcfce7" : "#fef2f2",
      color:        up ? "#166534" : "#dc2626",
    }}>
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(1)}%
    </span>
  );
};

const SortIcon = ({ active, direction }: { active: boolean; direction: Direction }) => (
  <span style={{ opacity: active ? 1 : 0.3, marginLeft: 4, fontSize: 11 }}>
    {active ? (direction === "asc" ? "↑" : "↓") : "↕"}
  </span>
);

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  data:     TopProduct[];
  dark:     boolean;
  loading?: boolean;
}

export const TopProductsTable = ({ data, dark, loading }: Props) => {
  const [sortKey, setSortKey]     = useState<SortKey>("revenue");
  const [direction, setDirection] = useState<Direction>("desc");

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDirection((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setDirection("desc");
    }
  };

  // Sort computed only when data or sort config changes — useMemo prevents re-sort on every render
  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const diff = a[sortKey] - b[sortKey];
      return direction === "asc" ? diff : -diff;
    });
  }, [data, sortKey, direction]);

  const cardBg    = dark ? "#1e293b" : "#fff";
  const borderClr = dark ? "#334155" : "#e5e7eb";
  const textMain  = dark ? "#f1f5f9" : "#111827";
  const textSub   = dark ? "#94a3b8" : "#6b7280";
  const thBg      = dark ? "#0f172a" : "#f8fafc";
  const rowAlt    = dark ? "#ffffff05" : "#f9fafb";

  const columns: { key: SortKey; label: string }[] = [
    { key: "rank",    label: "#"       },
    { key: "revenue", label: "Revenue" },
    { key: "units",   label: "Units"   },
    { key: "growth",  label: "Growth"  },
  ];

  if (loading) {
    return (
      <div style={{ ...s.card, background: cardBg, border: `1px solid ${borderClr}` }}>
        <div style={{ ...s.title, color: textMain }}>Top Products</div>
        {[1,2,3,4,5].map((i) => (
          <div key={i} style={{ height: 20, background: dark ? "#334155" : "#e5e7eb", borderRadius: 4, marginTop: 12 }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ ...s.card, background: cardBg, border: `1px solid ${borderClr}` }}>
      <div style={s.header}>
        <div>
          <h3 style={{ ...s.title, color: textMain }}>Top Products</h3>
          <p style={{ ...s.sub, color: textSub }}>Click column headers to sort</p>
        </div>
      </div>

      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr style={{ background: thBg }}>
              <th style={{ ...s.th, color: textSub, textAlign: "left" }}>Product</th>
              <th style={{ ...s.th, color: textSub }}>Category</th>
              {columns.map(({ key, label }) => (
                <th
                  key={key}
                  style={{ ...s.th, ...s.sortableTh, color: sortKey === key ? "#3b82f6" : textSub }}
                  onClick={() => handleSort(key)}
                >
                  {label}
                  <SortIcon active={sortKey === key} direction={direction} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((product, i) => (
              <tr
                key={product.rank}
                style={{ background: i % 2 === 1 ? rowAlt : "transparent" }}
              >
                {/* Rank */}
                <td style={{ ...s.td, textAlign: "left" }}>
                  <div style={s.nameCell}>
                    <span style={{
                      ...s.rankBadge,
                      background: product.rank === 1 ? "#fef3c7" : dark ? "#1e293b" : "#f1f5f9",
                      color:      product.rank === 1 ? "#92400e" : textSub,
                    }}>
                      #{product.rank}
                    </span>
                    <span style={{ color: textMain, fontWeight: 600, fontSize: 14 }}>{product.name}</span>
                  </div>
                </td>
                <td style={{ ...s.td, color: textSub, fontSize: 13 }}>{product.category}</td>
                <td style={{ ...s.td, color: textMain, fontWeight: 600 }}>{fmtCurrency(product.revenue)}</td>
                <td style={{ ...s.td, color: textSub }}>{product.units.toLocaleString()}</td>
                <td style={s.td}><GrowthBadge value={product.growth} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  card:       { borderRadius: 12, padding: 24 },
  header:     { marginBottom: 16 },
  title:      { fontSize: 16, fontWeight: 700, margin: 0 },
  sub:        { fontSize: 13, margin: "4px 0 0" },
  tableWrap:  { overflowX: "auto" },
  table:      { width: "100%", borderCollapse: "collapse", minWidth: 500 },
  th:         { padding: "10px 16px", fontSize: 12, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 0.5, textAlign: "right" as const },
  sortableTh: { cursor: "pointer", userSelect: "none" as const },
  td:         { padding: "12px 16px", fontSize: 14, textAlign: "right" as const, borderBottom: "1px solid transparent" },
  nameCell:   { display: "flex", alignItems: "center", gap: 10 },
  rankBadge:  { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 },
};
