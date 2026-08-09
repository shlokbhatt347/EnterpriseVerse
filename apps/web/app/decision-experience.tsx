"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type DecisionOption = {
  id: string;
  title: string;
  description: string;
  risk?: "low" | "medium" | "high";
  impacts?: { label: string; value: string; tone?: "positive" | "negative" | "neutral" }[];
};

export function DecisionExperience({
  situation,
  context,
  options,
  onConfirm,
  consequence,
}: {
  situation: string;
  context?: ReactNode;
  options: DecisionOption[];
  onConfirm: (option: DecisionOption) => void;
  consequence?: ReactNode;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const optionKey = options.map((option) => option.id).join("|");
  const chosen = useMemo(() => options.find((option) => option.id === selected), [options, selected]);

  useEffect(() => {
    setSelected(null);
  }, [optionKey]);

  return (
    <section className="decision-experience" aria-labelledby="decision-title">
      <div className="decision-step"><span>DECISION</span><span aria-hidden="true">•</span><span>ASSESS → CHOOSE → ACT</span></div>
      <h2 id="decision-title">{situation}</h2>
      {context && <div className="decision-context">{context}</div>}
      <div className="decision-options" role="radiogroup" aria-label="Decision options">
        {options.map((option) => {
          const active = option.id === selected;
          return (
            <button
              key={option.id}
              type="button"
              className={`decision-option ${active ? "selected" : ""}`}
              role="radio"
              aria-checked={active}
              onClick={() => setSelected(option.id)}
            >
              <span className="decision-option-head"><strong>{option.title}</strong>{option.risk && <span className={`decision-risk ${option.risk}`}>{option.risk} risk</span>}</span>
              <span className="decision-description">{option.description}</span>
              {option.impacts?.length ? <span className="decision-impact-grid">{option.impacts.map((impact) => <span key={impact.label} className={`decision-impact ${impact.tone ?? "neutral"}`}><small>{impact.label}</small><b>{impact.value}</b></span>)}</span> : null}
            </button>
          );
        })}
      </div>
      {chosen && <div className="decision-preview" aria-live="polite"><strong>Selected: {chosen.title}</strong><span>Review the trade-offs above before committing this decision.</span></div>}
      <div className="decision-actions"><button type="button" className="primary decision-confirm" disabled={!chosen} onClick={() => chosen && onConfirm(chosen)}>Confirm decision</button></div>
      {consequence && <div className="decision-consequence" aria-live="polite"><strong>Outcome</strong>{consequence}</div>}
    </section>
  );
}
