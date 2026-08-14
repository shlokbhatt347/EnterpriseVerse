'use client';

import { useEffect, useMemo, useState } from 'react';
import type { SimulationChoice, SimulationState } from '@enterpriseverse/types';

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

type Props = {
  state: SimulationState;
  selectedChoice?: SimulationChoice | null;
  expectedState?: SimulationState | null;
};

const MEMORY_KEY = 'enterpriseverse:decision-memory:v1';

const money = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;
const delta = (before: number, after: number) => `${after - before >= 0 ? '+' : ''}${(after - before).toFixed(1)}`;

function recordFromChoice(choice: SimulationChoice, state: SimulationState, expectedState?: SimulationState | null): DecisionRecord {
  const baseline = expectedState ?? state;
  const cashDelta = state.business.cash - baseline.business.cash;
  const reputationDelta = state.business.reputation - baseline.business.reputation;
  const shareDelta = state.business.marketShare - baseline.business.marketShare;
  const expectedCash = choice.effects.cash ?? 0;
  const outcome: DecisionRecord['outcome'] = cashDelta >= expectedCash ? 'success' : cashDelta >= expectedCash - 500 ? 'mixed' : 'warning';
  return {
    id: `${choice.id}-day-${state.business.day}-${Date.now()}`,
    day: state.business.day,
    title: choice.label,
    action: choice.id,
    reason: 'Committed from the live Decision Theater.',
    expected: [
      { label: 'Cash', value: expectedCash >= 0 ? `+${money(expectedCash)}` : `-${money(Math.abs(expectedCash))}` },
      { label: 'Reputation', value: `${(choice.effects.reputation ?? 0) >= 0 ? '+' : ''}${choice.effects.reputation ?? 0}` },
      { label: 'Market share', value: `${(choice.effects.marketShare ?? 0) >= 0 ? '+' : ''}${choice.effects.marketShare ?? 0}` },
    ],
    actual: [
      { label: 'Cash', value: delta(baseline.business.cash, state.business.cash) },
      { label: 'Reputation', value: delta(baseline.business.reputation, state.business.reputation) },
      { label: 'Market share', value: delta(baseline.business.marketShare, state.business.marketShare) },
    ],
    outcome,
  };
}

export function ConsequenceMemory({ state, selectedChoice, expectedState }: Props) {
  const [records, setRecords] = useState<DecisionRecord[]>([]);
  const [selected, setSelected] = useState<DecisionRecord | null>(null);
  const [tab, setTab] = useState<'timeline' | 'compare'>('timeline');

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(MEMORY_KEY);
      if (raw) setRecords(JSON.parse(raw) as DecisionRecord[]);
    } catch {
      window.localStorage.removeItem(MEMORY_KEY);
    }
  }, []);

  useEffect(() => {
    if (!selectedChoice) return;
    const next = recordFromChoice(selectedChoice, state, expectedState);
    setRecords((current) => {
      const withoutDuplicate = current.filter((record) => record.id.split('-day-')[0] !== selectedChoice.id || record.day !== state.business.day);
      const merged = [next, ...withoutDuplicate].slice(0, 50);
      window.localStorage.setItem(MEMORY_KEY, JSON.stringify(merged));
      return merged;
    });
    setSelected(next);
  }, [selectedChoice, state, expectedState]);

  const timeline = useMemo(() => [...records].sort((a, b) => b.day - a.day), [records]);

  return (
    <section className="ev-memory">
      <div className="ev-memory-head">
        <div>
          <span className="ev-eyebrow">DECISION MEMORY</span>
          <h2>Consequence Theater</h2>
          <p>Every committed decision is compared against the live company state and remembered across sessions.</p>
        </div>
        <span className="ev-memory-count">{records.length} decisions remembered</span>
      </div>

      <div className="ev-memory-tabs">
        <button className={tab === 'timeline' ? 'active' : ''} onClick={() => setTab('timeline')}>Decision timeline</button>
        <button className={tab === 'compare' ? 'active' : ''} onClick={() => setTab('compare')}>Expected vs actual</button>
      </div>

      {timeline.length === 0 ? (
        <div className="ev-empty"><strong>Your decision history starts here.</strong><span>Commit a strategic decision and its consequences will be captured automatically.</span></div>
      ) : tab === 'timeline' ? (
        <div className="ev-timeline">
          {timeline.map((record) => (
            <button key={record.id} className="ev-memory-card" onClick={() => setSelected(record)}>
              <span className="ev-day">DAY {record.day}</span><span className="ev-memory-dot" />
              <div><strong>{record.title}</strong><small>{record.reason}</small></div>
              <span className={`ev-outcome ${record.outcome}`}>{record.outcome}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="ev-compare-grid">
          {timeline.slice(0, 8).map((record) => (
            <article className="ev-compare" key={record.id}>
              <div className="ev-compare-title"><strong>{record.title}</strong><span>Day {record.day}</span></div>
              <div className="ev-compare-columns">
                <div><small>EXPECTED</small>{record.expected.map((item) => <p key={item.label}><span>{item.label}</span><b>{item.value}</b></p>)}</div>
                <div><small>ACTUAL</small>{record.actual.map((item) => <p key={item.label}><span>{item.label}</span><b>{item.value}</b></p>)}</div>
              </div>
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
