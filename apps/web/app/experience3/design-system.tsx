'use client';

import type { ReactNode } from 'react';

export const evTokens = {
  radius: { sm: '8px', md: '12px', lg: '18px', xl: '24px', pill: '999px' },
  motion: { fast: '140ms', base: '220ms', slow: '360ms' },
  spacing: { xs: '4px', sm: '8px', md: '12px', lg: '20px', xl: '28px', xxl: '40px' },
} as const;

export function Eyebrow({ children }: { children: ReactNode }) { return <span className="ev-ds-eyebrow">{children}</span>; }
export function Surface({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`ev-ds-surface ${className}`}>{children}</section>; }
export function StatusPill({ status, children }: { status: 'positive' | 'warning' | 'critical' | 'neutral'; children: ReactNode }) { return <span className={`ev-ds-status ev-ds-status-${status}`}><i aria-hidden="true" />{children}</span>; }
export function Metric({ label, value, delta, status = 'neutral' }: { label: string; value: string; delta?: string; status?: 'positive' | 'warning' | 'critical' | 'neutral' }) { return <div className="ev-ds-metric"><Eyebrow>{label}</Eyebrow><strong>{value}</strong>{delta && <StatusPill status={status}>{delta}</StatusPill>}</div>; }
export function SectionHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) { return <header className="ev-ds-section-header"><div><Eyebrow>{eyebrow}</Eyebrow><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</header>; }
