import type { ReactNode } from "react";

export function CommandSection({ eyebrow, title, description, action, children }: { eyebrow?: string; title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  const id = `section-${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
  return <section className="cc-section" aria-labelledby={id}><div className="cc-section-head"><div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h2 id={id}>{title}</h2>{description && <p className="muted">{description}</p>}</div>{action}</div>{children}</section>;
}

export function AttentionCard({ title, description, severity = "info", action }: { title: string; description: string; severity?: "info" | "success" | "warning" | "danger"; action?: ReactNode }) {
  return <article className={`cc-attention cc-${severity}`}><div className="cc-attention-icon" aria-hidden="true">{severity === "success" ? "✓" : severity === "info" ? "i" : "!"}</div><div className="cc-attention-copy"><strong>{title}</strong><p>{description}</p></div>{action}</article>;
}

export function Metric({ label, value, detail, status = "neutral" }: { label: string; value: ReactNode; detail?: ReactNode; status?: "neutral" | "positive" | "negative" | "warning" }) {
  return <article className={`cc-metric cc-metric-${status}`}><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</article>;
}
