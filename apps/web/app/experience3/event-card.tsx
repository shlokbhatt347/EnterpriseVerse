'use client';

import type { ReactNode } from 'react';

type EventKind = 'attention' | 'decision' | 'consequence' | 'market' | 'milestone' | 'warning';
type EventCardProps = { kind: EventKind; day: number; title: string; description: string; meta?: string; severity?: 'low' | 'medium' | 'high' | 'critical'; action?: ReactNode; onOpen?: () => void };
const labels: Record<EventKind, string> = { attention: 'ATTENTION', decision: 'DECISION', consequence: 'CONSEQUENCE', market: 'MARKET', milestone: 'MILESTONE', warning: 'WARNING' };

export function EventCard({ kind, day, title, description, meta, severity = 'low', action, onOpen }: EventCardProps) {
  return <article className={`ev-event-card ev-event-${kind} ev-event-${severity}`}>
    <button className="ev-event-main" onClick={onOpen} aria-label={`Open ${title}`}>
      <div className="ev-event-rail" aria-hidden="true"><span>{day}</span><i /></div>
      <div className="ev-event-body"><div className="ev-event-top"><span className="ev-event-kind">{labels[kind]}</span><span className="ev-event-severity">{severity}</span></div><h3>{title}</h3><p>{description}</p>{meta && <small>{meta}</small>}</div>
      <span className="ev-event-arrow" aria-hidden="true">→</span>
    </button>
    {action && <div className="ev-event-action">{action}</div>}
  </article>;
}

export function EventStack({ children }: { children: ReactNode }) { return <div className="ev-event-stack" aria-live="polite">{children}</div>; }
