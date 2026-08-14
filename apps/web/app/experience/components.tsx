"use client";

import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

export function EVCard({ className = "", interactive = false, children, ...props }: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return <div className={`ev-card ${interactive ? "ev-card-interactive" : ""} ${className}`.trim()} {...props}>{children}</div>;
}

export function EVStatus({ tone = "info", label, dot = true }: { tone?: "critical" | "warning" | "success" | "info"; label: ReactNode; dot?: boolean }) {
  return <span className={`ev-status ev-status-${tone}`}><>{dot ? <i className="ev-status-dot" aria-hidden="true" /> : null}{label}</></span>;
}

export function EVButton({ variant = "default", size = "md", className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "primary" | "ghost" | "danger"; size?: "sm" | "md" | "lg" }) {
  return <button className={`ev-button ev-button-${variant} ev-button-${size} ${className}`.trim()} {...props}>{children}</button>;
}

export const EVInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className = "", ...props }, ref) => <input ref={ref} className={`ev-input ${className}`.trim()} {...props} />);
EVInput.displayName = "EVInput";

export function EVMetric({ label, value, delta, tone = "neutral" }: { label: ReactNode; value: ReactNode; delta?: ReactNode; tone?: "neutral" | "positive" | "negative" | "warning" }) {
  const toneClass = tone === "positive" ? "ev-success" : tone === "negative" ? "ev-critical" : tone === "warning" ? "ev-warning" : "ev-muted";
  return <EVCard className="ev-p-5"><span className="ev-eyebrow">{label}</span><strong className="ev-title-md ev-mono" style={{ display: "block", marginTop: 8 }}>{value}</strong>{delta ? <span className={`ev-caption ${toneClass}`} style={{ display: "block", marginTop: 5 }}>{delta}</span> : null}</EVCard>;
}

export function EVSection({ eyebrow, title, description, action, children, className = "" }: { eyebrow?: ReactNode; title?: ReactNode; description?: ReactNode; action?: ReactNode; children?: ReactNode; className?: string }) {
  return <section className={className}><div className="ev-row" style={{ justifyContent: "space-between", alignItems: "flex-end", gap: 16, marginBottom: 16 }}>{<div>{eyebrow ? <span className="ev-eyebrow">{eyebrow}</span> : null}{title ? <h2 className="ev-title-lg" style={{ marginTop: 7 }}>{title}</h2> : null}{description ? <p className="ev-body" style={{ marginTop: 7, maxWidth: 700 }}>{description}</p> : null}</div>}{action}</div>{children}</section>;
}

export function EVProgress({ value, max = 100, label, tone = "brand" }: { value: number; max?: number; label?: ReactNode; tone?: "brand" | "success" | "warning" | "critical" }) {
  const safe = Math.max(0, Math.min(value, max));
  const color = tone === "success" ? "var(--ev-success)" : tone === "warning" ? "var(--ev-warning)" : tone === "critical" ? "var(--ev-critical)" : "var(--ev-brand)";
  return <div>{label ? <div className="ev-row" style={{ justifyContent: "space-between", marginBottom: 6 }}><span className="ev-caption">{label}</span><span className="ev-caption ev-mono">{Math.round(safe / max * 100)}%</span></div> : null}<div style={{ height: 6, borderRadius: 99, background: "var(--ev-surface-3)", overflow: "hidden" }}><div style={{ width: `${safe / max * 100}%`, height: "100%", borderRadius: 99, background: color, transition: "width var(--ev-duration-slow) var(--ev-ease-standard)" }} /></div></div>;
}

export function EVEmptyState({ icon = "◇", title, description, action }: { icon?: ReactNode; title: ReactNode; description?: ReactNode; action?: ReactNode }) {
  return <div className="ev-card" style={{ minHeight: 180, padding: 28, display: "grid", placeItems: "center", textAlign: "center" }}><div><div aria-hidden="true" style={{ width: 40, height: 40, display: "grid", placeItems: "center", margin: "0 auto 12px", borderRadius: 11, border: "1px solid var(--ev-border-2)", color: "var(--ev-brand)" }}>{icon}</div><h3 className="ev-title-sm">{title}</h3>{description ? <p className="ev-caption" style={{ maxWidth: 420, margin: "6px auto 0" }}>{description}</p> : null}{action ? <div style={{ marginTop: 14 }}>{action}</div> : null}</div></div>;
}
