'use client';

import { useMemo } from 'react';
import type { ConsequenceState, SimulationState } from '@enterpriseverse/types';

function ConsequenceLane({ title, tone, items, day }: { title: string; tone: 'pending' | 'resolved'; items: ConsequenceState['pending']; day: number }) {
  return (
    <div className={`ev-delay-lane ${tone}`}>
      <div className="ev-delay-lane-head"><div><span className="ev-eyebrow">{tone === 'pending' ? 'UPCOMING' : 'RESOLVED'}</span><h3>{title}</h3></div><span>{items.length}</span></div>
      {items.length === 0 ? <div className="ev-delay-empty">{tone === 'pending' ? 'No delayed effects are currently scheduled.' : 'Nothing has resolved yet.'}</div> : <div className="ev-delay-list">
        {items.slice(0, 8).map((item) => {
          const targetDay = item.day + item.delayDays;
          const daysAway = Math.max(0, targetDay - day);
          return <article className="ev-delay-item" key={item.id}>
            <div className="ev-delay-date"><strong>DAY {targetDay}</strong><span>{tone === 'pending' ? (daysAway === 0 ? 'DUE NOW' : `IN ${daysAway} DAY${daysAway === 1 ? '' : 'S'}`) : 'RESOLVED'}</span></div>
            <div className="ev-delay-body"><strong>{item.source.replaceAll('_', ' ')}</strong><p>{item.explanation}</p><div className="ev-delay-effects">{Object.entries(item.effects).slice(0, 5).map(([key, value]) => <span key={key} className={value >= 0 ? 'positive' : 'negative'}>{key}: {value >= 0 ? '+' : ''}{value}</span>)}</div></div>
          </article>;
        })}
      </div>}
    </div>
  );
}

export function DelayedConsequences({ state }: { state: SimulationState }) {
  const consequences = state.consequences ?? { pending: [], resolved: [] };
  const pending = useMemo(() => [...consequences.pending].sort((a, b) => (a.day + a.delayDays) - (b.day + b.delayDays)), [consequences.pending]);
  const resolved = useMemo(() => [...consequences.resolved].sort((a, b) => b.day - a.day), [consequences.resolved]);
  const next = pending[0];
  return <section className="ev-delayed">
    <div className="ev-delayed-head"><div><span className="ev-eyebrow">CONSEQUENCE HORIZON</span><h2>Your decisions are still moving through the world.</h2><p>Some effects arrive immediately. Others emerge after the market, customers and operations have had time to react.</p></div>{next ? <div className="ev-next-effect"><span>NEXT EFFECT</span><strong>DAY {next.day + next.delayDays}</strong><small>{Math.max(0, next.day + next.delayDays - state.business.day)} days away</small></div> : <div className="ev-next-effect empty"><span>HORIZON</span><strong>CLEAR</strong><small>No pending effects</small></div>}</div>
    <div className="ev-delay-grid"><ConsequenceLane title="Upcoming effects" tone="pending" items={pending} day={state.business.day} /><ConsequenceLane title="What already happened" tone="resolved" items={resolved} day={state.business.day} /></div>
  </section>;
}
