'use client';

import type { ReactNode } from 'react';

type Point = { label: string; value: number };

export function TrendSparkline({ data, label, unit = '' }: { data: Point[]; label: string; unit?: string }) {
  const max = Math.max(...data.map((p) => p.value), 1);
  const min = Math.min(...data.map((p) => p.value), 0);
  const range = Math.max(max - min, 1);
  return <div className="ev-viz-card"><div className="ev-viz-head"><span>{label}</span><b>{data.at(-1)?.value}{unit}</b></div><div className="ev-spark" role="img" aria-label={`${label} trend`}>{data.map((point, index) => <span className="ev-spark-point" key={`${point.label}-${index}`} title={`${point.label}: ${point.value}${unit}`} style={{ left: `${data.length === 1 ? 50 : (index / (data.length - 1)) * 100}%`, bottom: `${((point.value - min) / range) * 100}%` }} />)}</div></div>;
}

export function ComparisonBars({ items, label }: { items: { label: string; actual: number; target: number }[]; label: string }) {
  return <div className="ev-viz-card"><div className="ev-viz-head"><span>{label}</span><span>ACTUAL / TARGET</span></div><div className="ev-bars">{items.map((item) => <div className="ev-bar-row" key={item.label}><div className="ev-bar-label"><span>{item.label}</span><b>{item.actual} / {item.target}</b></div><div className="ev-bar-track"><i style={{ width: `${Math.min(Math.max((item.actual / Math.max(item.target, 1)) * 100, 0), 100)}%` }} /></div></div>)}</div></div>;
}

export function DeltaMetric({ label, value, delta, context }: { label: string; value: ReactNode; delta: number; context?: string }) {
  const status = delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral';
  return <article className="ev-delta-metric"><span>{label}</span><strong>{value}</strong><b className={`ev-delta ${status}`}>{delta > 0 ? '+' : ''}{delta}%</b>{context && <small>{context}</small>}</article>;
}
