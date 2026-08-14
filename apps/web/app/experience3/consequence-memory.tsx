'use client';

import { useMemo, useState } from 'react';

type DecisionRecord = {
  id: string;
  day: number;
  title: string;
  action: string;
  reason: string;
  expected: { label: string; value: string }[];
  actual: { label: string; value: string }[];
  outcome: 'success' | 'mixed' | 'warning';
};

const demoRecords: DecisionRecord[] = [
  {
    id: 'quality', day: 42, title: 'Invested in quality', action: 'QUALITY_INVEST', reason: 'Protect customer trust while improving product value.',
    expected: [{ label: 'Quality', value: '+10%' }, { label: 'Demand', value: '+5%' }, { label: 'Cash', value: '-2%' }],
    actual: [{ label: 'Quality', value: '+14%' }, { label: 'Demand', value: '+7%' }, { label: 'Cash', value: '-5%' }], outcome: 'success',
  },
  {
    id: 'price', day: 35, title: 'Raised price', action: 'PRICE_CHANGE', reason: 'Improve margin without losing too much demand.',
    expected: [{ label: 'Revenue', value: '+8%' }, { label: 'Margin', value: '+4%' }, { label: 'Demand', value: '-5%' }],
    actual: [{ label: 'Revenue', value: '+3%' }, { label: 'Margin', value: '+6%' }, { label: 'Demand', value: '-9%' }], outcome: 'mixed',
  },
];

export function ConsequenceMemory({ day }: { day: number }) {
  const [records, setRecords] = useState<DecisionRecord[]>(demoRecords);
  const [selected, setSelected] = useState<DecisionRecord | null>(null);
  const [tab, setTab] = useState<'timeline' | 'compare'>('timeline');

  const timeline = useMemo(() => [...records].sort((a, b) => b.day - a.day), [records]);

  function recordDecision() {
    const next: DecisionRecord = {
      id: `decision-${Date.now()}`,
      day,
      title: 'Decision committed',
      action: 'STRATEGIC_DECISION',
      reason: 'Recorded from the Decision Theater.',
      expected: [{ label: 'Confidence', value: 'Medium' }, { label: 'Risk', value: 'Tracked' }],
      actual: [{ label: 'Status', value: 'Awaiting effects' }, { label: 'Memory', value: 'Created' }],
      outcome: 'mixed',
    };
    setRecords((current) => [next, ...current]);
    setSelected(next);
  }

  return (
    <section className="ev-memory">
      <div className="ev-memory-head">
        <div>
          <span className="ev-eyebrow">DECISION MEMORY</span>
          <h2>Consequence Theater</h2>
          <p>Turn every major decision into a learning loop: expected → actual → consequence → memory.</p>
        </div>
        <button className="ev-primary" onClick={recordDecision}>Record current decision</button>
      </div>

      <div className="ev-memory-tabs">
        <button className={tab === 'timeline' ? 'active' : ''} onClick={() => setTab('timeline')}>Decision timeline</button>
        <button className={tab === 'compare' ? 'active' : ''} onClick={() => setTab('compare')}>Expected vs actual</button>
      </div>

      {tab === 'timeline' ? (
        <div className="ev-timeline">
          {timeline.map((record) => (
            <button key={record.id} className="ev-memory-card" onClick={() => setSelected(record)}>
              <span className="ev-day">DAY {record.day}</span>
              <span className="ev-memory-dot" />
              <div><strong>{record.title}</strong><small>{record.reason}</small></div>
              <span className={`ev-outcome ${record.outcome}`}>{record.outcome}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="ev-compare-grid">
          {timeline.slice(0, 4).map((record) => (
            <article className="ev-compare" key={record.id}>
              <div className="ev-compare-title"><strong>{record.title}</strong><span>Day {record.day}</span></div>
              <div className="ev-compare-columns"><div><small>EXPECTED</small>{record.expected.map((item) => <p key={item.label}><span>{item.label}</span><b>{item.value}</b></p>)}</div><div><small>ACTUAL</small>{record.actual.map((item) => <p key={item.label}><span>{item.label}</span><b>{item.value}</b></p>)}</div></div>
            </article>
          ))}
        </div>
      )}

      {selected && (
        <div className="ev-consequence">
          <div><span className="ev-eyebrow">CONSEQUENCE TRACE · DAY {selected.day}</span><h3>{selected.title}</h3><p>{selected.reason}</p></div>
          <div className="ev-chain"><span>DECISION</span><i>→</i><span>EARLY SIGNAL</span><i>→</i><span>MARKET RESPONSE</span><i>→</i><span>BUSINESS IMPACT</span></div>
          <div className="ev-memory-actions"><button onClick={() => setTab('compare')}>Compare expectation</button><button onClick={() => setSelected(null)}>Close inspector</button></div>
        </div>
      )}
    </section>
  );
}
