'use client';

import { useMemo, useState } from 'react';

type PeopleSignal = { id: string; priority: 'critical' | 'high' | 'normal'; title: string; message: string; action: string; day: number };

const seed: PeopleSignal[] = [
  { id: 'maya-capacity', priority: 'high', title: 'Maya needs capacity', message: 'Product workload is rising and Maya is concerned about the next release.', action: 'Listen', day: 47 },
  { id: 'maya-quality', priority: 'normal', title: 'Product confidence is rising', message: 'Maya is more confident after the recent quality investment.', action: 'Support', day: 45 },
];

export function PeopleAttention({ day }: { day: number }) {
  const [signals, setSignals] = useState(seed);
  const [selected, setSelected] = useState<PeopleSignal | null>(null);
  const visible = useMemo(() => signals.map((s) => ({ ...s, day: Math.max(s.day, day) })), [signals, day]);

  function resolve(signal: PeopleSignal) {
    setSelected(signal);
    setSignals((current) => current.filter((item) => item.id !== signal.id));
  }

  return (
    <section className="ev-people-attention">
      <div className="ev-people-attention-head"><div><span className="ev-eyebrow">PEOPLE ATTENTION</span><h2>Your people are talking</h2><p>Important relationship signals surface automatically instead of waiting for you to inspect an employee.</p></div><span className="ev-attention-count">{visible.length} OPEN</span></div>
      <div className="ev-people-signal-list">
        {visible.length === 0 ? <div className="ev-empty">No unresolved people signals. Keep leading.</div> : visible.map((signal) => (
          <button key={signal.id} className="ev-people-signal" onClick={() => resolve(signal)}>
            <span className={`ev-priority ${signal.priority}`}>{signal.priority}</span>
            <div><strong>{signal.title}</strong><p>{signal.message}</p><small>DAY {signal.day} · {signal.action.toUpperCase()} AVAILABLE</small></div>
            <span className="ev-signal-arrow">→</span>
          </button>
        ))}
      </div>
      {selected && <div className="ev-people-conversation"><span className="ev-eyebrow">CONVERSATION TRIGGERED</span><h3>{selected.title}</h3><p>{selected.message}</p><div className="ev-conversation-actions"><button onClick={() => setSelected(null)}>Listen</button><button onClick={() => setSelected(null)}>Support</button><button onClick={() => setSelected(null)}>Challenge</button></div></div>}
    </section>
  );
}
