import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`ui-card ${className}`}>{children}</section>;
}

export function MetricCard({ label, value, detail, trend }: { label: string; value: ReactNode; detail?: ReactNode; trend?: "up" | "down" | "neutral" }) {
  return <Card className="ui-metric"><div className="ui-label">{label}</div><div className="ui-value">{value}</div>{detail && <div className={`ui-detail ${trend ? `trend-${trend}` : ""}`}>{detail}</div>}</Card>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  return <span className={`ui-badge ui-badge-${tone}`}>{children}</span>;
}

export function Button({ children, variant = "primary", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return <button {...props} className={`ui-button ui-button-${variant} ${props.className ?? ""}`}>{children}</button>;
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`ui-input ${props.className ?? ""}`} />;
}

export function Skeleton({ width = "100%", height = "1rem" }: { width?: string; height?: string }) {
  return <span className="ui-skeleton" style={{ width, height }} aria-hidden="true" />;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="ui-empty" role="status"><strong>{title}</strong>{description && <p>{description}</p>}{action}</div>;
}

export function ErrorState({ title = "Something went wrong.", retry }: { title?: string; retry?: () => void }) {
  return <div className="ui-error" role="alert"><strong>{title}</strong>{retry && <Button variant="secondary" onClick={retry}>Try again</Button>}</div>;
}
