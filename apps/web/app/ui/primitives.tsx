"use client";

import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function UiCard({ className = "", children, ...props }: HTMLAttributes<HTMLElement> & { className?: string }) {
  return <section className={`ui-card ${className}`.trim()} {...props}>{children}</section>;
}

export function UiSectionHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="ui-section-header"><div>{eyebrow ? <div className="ui-label">{eyebrow}</div> : null}<h2>{title}</h2>{description ? <p>{description}</p> : null}</div>{action ? <div className="ui-section-action">{action}</div> : null}</header>;
}

export function UiBadge({ tone = "info", children }: { tone?: "info" | "success" | "warning" | "danger" | "neutral"; children: ReactNode }) {
  return <span className={`ui-badge ui-badge-${tone}`}>{children}</span>;
}

export function UiButton({ variant = "secondary", className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; className?: string }) {
  return <button className={`ui-button ui-button-${variant} ${className}`.trim()} {...props}>{children}</button>;
}

export function UiMetric({ label, value, detail, trend }: { label: string; value: ReactNode; detail?: ReactNode; trend?: "up" | "down" | "neutral" }) {
  return <div className="ui-metric"><div className="ui-label">{label}</div><div className="ui-value">{value}</div>{detail ? <div className={`ui-detail ${trend ? `trend-${trend}` : ""}`}>{detail}</div> : null}</div>;
}

export function UiStatus({ tone, title, children }: { tone: "success" | "warning" | "danger" | "info"; title: string; children?: ReactNode }) {
  return <div className={`ui-status ui-status-${tone}`} role={tone === "danger" ? "alert" : "status"}><strong>{title}</strong>{children ? <span>{children}</span> : null}</div>;
}

export function UiSkeleton({ width = "100%", height = 18, className = "" }: { width?: string | number; height?: number; className?: string }) {
  return <span className={`ui-skeleton ${className}`.trim()} aria-hidden="true" style={{ width, height }} />;
}

export function UiEmpty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className="ui-empty"><strong>{title}</strong>{children ? <p>{children}</p> : null}{action}</div>;
}

export function UiField({ label, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return <label className="ui-field"><span>{label}</span><input {...props} />{hint ? <small>{hint}</small> : null}</label>;
}
