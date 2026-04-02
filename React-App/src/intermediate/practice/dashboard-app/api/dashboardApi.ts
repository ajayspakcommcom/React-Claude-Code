// TOPIC: Dashboard API — Mock Data Generator
//
// Production pattern: generate realistic-looking data based on the selected
// date range. In a real app this would be a GET /dashboard?range=30d endpoint.
// The shape is identical — only the data source changes.

import type {
  DateRange,
  DashboardData,
  TimeSeriesPoint,
  MonthlySales,
  UserGrowthPoint,
} from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fakeDelay = (ms = 700) => new Promise((r) => setTimeout(r, ms));

// Seed-based random — same range always produces same data (stable across renders)
const seededRand = (seed: number, min: number, max: number) => {
  const x = Math.sin(seed) * 10_000;
  return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

// ─── Data generators ──────────────────────────────────────────────────────────

const pointCount: Record<DateRange, number> = {
  "7d": 7, "30d": 30, "90d": 12, "1y": 12,
};

const labelFor = (range: DateRange, i: number): string => {
  const now = new Date();
  if (range === "7d") {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }
  if (range === "30d") {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  // 90d and 1y — monthly labels
  const d = new Date(now);
  d.setMonth(d.getMonth() - (pointCount[range] - 1 - i));
  return d.toLocaleDateString("en-US", { month: "short" });
};

const generateTimeSeries = (range: DateRange): TimeSeriesPoint[] => {
  const count = pointCount[range];
  return Array.from({ length: count }, (_, i) => {
    const seed  = i * 7 + range.length;
    const rev   = seededRand(seed,     40_000, 120_000);
    const exp   = seededRand(seed + 1, 25_000,  60_000);
    return {
      date:     labelFor(range, i),
      revenue:  rev,
      expenses: exp,
      profit:   rev - exp,
    };
  });
};

const generateMonthlySales = (): MonthlySales[] => {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return months.map((month, i) => ({
    month,
    thisYear: seededRand(i * 3 + 1, 60_000, 180_000),
    lastYear: seededRand(i * 3 + 2, 50_000, 150_000),
  }));
};

const generateUserGrowth = (range: DateRange): UserGrowthPoint[] => {
  const count = pointCount[range];
  return Array.from({ length: count }, (_, i) => ({
    date:      labelFor(range, i),
    newUsers:  seededRand(i * 5 + 10, 200, 1_200),
    returning: seededRand(i * 5 + 11, 500, 3_000),
    churned:   seededRand(i * 5 + 12,  50,   300),
  }));
};

// ─── Main fetch function ──────────────────────────────────────────────────────

export const fetchDashboard = async (range: DateRange): Promise<DashboardData> => {
  await fakeDelay(range === "1y" ? 900 : 600);

  const timeSeries = generateTimeSeries(range);
  const totalRevenue = timeSeries.reduce((s, p) => s + p.revenue, 0);
  const totalProfit  = timeSeries.reduce((s, p) => s + p.profit, 0);

  return {
    kpis: [
      {
        id:          "revenue",
        label:       "Total Revenue",
        value:       totalRevenue,
        unit:        "currency",
        change:      12.4,
        changeLabel: `vs prev ${range}`,
        icon:        "💰",
        sparkline:   timeSeries.slice(-7).map((p) => p.revenue),
      },
      {
        id:          "orders",
        label:       "Orders",
        value:       seededRand(range.length, 1_200, 4_800),
        unit:        "number",
        change:      8.1,
        changeLabel: `vs prev ${range}`,
        icon:        "📦",
        sparkline:   Array.from({ length: 7 }, (_, i) => seededRand(i + 20, 100, 500)),
      },
      {
        id:          "customers",
        label:       "Active Customers",
        value:       seededRand(range.length + 1, 8_000, 24_000),
        unit:        "number",
        change:      -2.3,
        changeLabel: `vs prev ${range}`,
        icon:        "👥",
        sparkline:   Array.from({ length: 7 }, (_, i) => seededRand(i + 30, 600, 2_000)),
      },
      {
        id:          "conversion",
        label:       "Conversion Rate",
        value:       3.68,
        unit:        "percent",
        change:      0.4,
        changeLabel: `vs prev ${range}`,
        icon:        "📈",
        sparkline:   Array.from({ length: 7 }, (_, i) => seededRand(i + 40, 2, 6)),
      },
      {
        id:          "profit",
        label:       "Net Profit",
        value:       totalProfit,
        unit:        "currency",
        change:      18.7,
        changeLabel: `vs prev ${range}`,
        icon:        "✨",
        sparkline:   timeSeries.slice(-7).map((p) => p.profit),
      },
      {
        id:          "avgOrder",
        label:       "Avg. Order Value",
        value:       seededRand(range.length + 3, 85, 240),
        unit:        "currency",
        change:      5.2,
        changeLabel: `vs prev ${range}`,
        icon:        "🛒",
        sparkline:   Array.from({ length: 7 }, (_, i) => seededRand(i + 50, 70, 280)),
      },
    ],

    timeSeries,

    monthlySales: generateMonthlySales(),

    traffic: [
      { name: "Organic Search", value: 4_820, percentage: 38, color: "#3b82f6" },
      { name: "Direct",         value: 3_210, percentage: 25, color: "#8b5cf6" },
      { name: "Referral",       value: 2_560, percentage: 20, color: "#10b981" },
      { name: "Social Media",   value: 1_540, percentage: 12, color: "#f59e0b" },
      { name: "Email",          value:   640, percentage:  5, color: "#ef4444" },
    ],

    userGrowth: generateUserGrowth(range),

    topProducts: [
      { rank: 1, name: "Pro Plan",       category: "Subscription", revenue: 148_000, units: 740, growth: 22.4 },
      { rank: 2, name: "Enterprise Plan",category: "Subscription", revenue: 112_500, units: 150, growth: 31.1 },
      { rank: 3, name: "Starter Kit",    category: "One-time",     revenue:  64_200, units: 2_140, growth: 8.7 },
      { rank: 4, name: "Add-on Pack A",  category: "Add-on",       revenue:  38_400, units: 960, growth: -4.2 },
      { rank: 5, name: "Consulting",     category: "Service",      revenue:  29_700, units: 99,  growth: 15.8 },
    ],

    lastUpdated: new Date().toISOString(),
  };
};
