"use client";

import { memo, useMemo, useState } from "react";
import type { FinancialSnapshot } from "@enterpriseverse/types";

export type AnalyticsPoint = FinancialSnapshot & { marketShare?: number; reputation?: number; customers?: number; inventory?: number; employees?: number };
type MetricKey = "revenue" | "netProfit" | "cash" | "marketShare" | "reputation" | "customers" | "inventory" | "employees";

const metrics: { key: MetricKey; label: string; format: (value: number) => string }[] = [
  { key: "revenue", label: "Revenue", format: (v) => `₹${Math.round(v).toLocaleString("en-IN")}` },
  { key: "netProfit", label: "Profit", format: (v) => `₹${Math.round(v).toLocaleString("en-IN")}` },
  { key: "cash", label: "Cash", format: (v) => `₹${Math.round(v).toLocaleString("en-IN")}` },
  { key: "marketShare", label: "Market share", format: (v) => `${v.toFixed(1)}%` },
  { key: "reputation", label: "Reputation", format: (v) => `${Math.round(v)}/100` },
  { key: "customers", label: "Customers", format: (v) => `${Math.round(v)}` },
  { key: "inventory", label: "Inventory", format: (v) => `${Math.round(v)}` },
  { key: "employees", label: "Employees", format: (v) => `${Math.round(v)}` },
];

function Analytics({ snapshots }: { snapshots: AnalyticsPoint[] }) {
  const [metric, setMetric] = useState<MetricKey>("revenue");
  const [range, setRange] = useState<"all" | "7" | "14">("all");
  const definition = metrics.find((item) => item.key === metric)!;
  const points = useMemo(() => range === "all" ? snapshots : snapshots.slice(-Number(range)), [snapshots, range]);
  const values = useMemo(() => points.map((point) => Number(point[metric] ?? 0)), [points, metric]);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const latest = values.at(-1) ?? 0;
  const previous = values.at(-2);
  const change = previous === undefined ? null : latest - previous;
  const width = 640;
  const height = 220;
  const path = useMemo(() => points.map((point, index) => {
    const x = points.length <= 1 ? width / 2 : (index / (points.length - 1)) * width;
    const y = height - ((Number(point[metric] ?? 0) - min) / Math.max(max - min, 1)) * height;
    return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" "), [points, metric, min, max]);

  return <section className="analytics card" aria-labelledby="analytics-title">
    <div className="section-head"><div><div className="eyebrow">Performance analytics</div><h2 id="analytics-title">See how the business is moving</h2><p className="muted small">Historical simulation snapshots only. No second history engine is created.</p></div><div className="analytics-controls"><label>Metric<select value={metric} onChange={(e) => setMetric(e.target.value as MetricKey)}>{metrics.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label><label>Range<select value={range} onChange={(e) => setRange(e.target.value as typeof range)}><option value="7">7 days</option><option value="14">14 days</option><option value="all">All history</option></select></label></div></div>
    {points.length < 2 ? <div className="analytics-empty" role="status"><strong>Not enough history yet</strong><span>Advance the business for another day to unlock a meaningful trend.</span></div> : <><div className="analytics-summary"><div><span>{definition.label}</span><strong>{definition.format(latest)}</strong></div><div><span>Latest day</span><strong>Day {points.at(-1)?.day}</strong></div><div><span>Period change</span><strong className={change !== null && change < 0 ? "negative" : "positive"}>{change === null ? "—" : `${change >= 0 ? "+" : ""}${definition.format(change)}`}</strong></div></div><div className="analytics-chart-wrap"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="analytics-chart-title analytics-chart-desc" preserveAspectRatio="none"><title id="analytics-chart-title">{definition.label} over time</title><desc id="analytics-chart-desc">{points.map((point) => `Day ${point.day}: ${definition.format(Number(point[metric] ?? 0))}`).join(". ")}</desc><path className="analytics-grid-line" d={`M0 ${height * .25}H${width}M0 ${height * .5}H${width}M0 ${height * .75}H${width}`} /><path className="analytics-line" d={path} fill="none" pathLength="1" /></svg></div><div className="analytics-axis"><span>Day {points[0]?.day}</span><span>Day {points.at(-1)?.day}</span></div></>}
  </section>;
}

function areAnalyticsEqual(previous: Readonly<{ snapshots: AnalyticsPoint[] }>, next: Readonly<{ snapshots: AnalyticsPoint[] }>) {
  const a = previous.snapshots;
  const b = next.snapshots;
  if (a === b) return true;
  if (a.length !== b.length) return false;
  if (a.length === 0) return true;
  return a[0]?.day === b[0]?.day && a.at(-1)?.day === b.at(-1)?.day;
}

export const InteractiveAnalytics = memo(Analytics, areAnalyticsEqual);
