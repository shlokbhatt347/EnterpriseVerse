"use client";

import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

export type DecisionOption = {
  id: string;
  title: string;
  description: string;
  risk?: "low" | "medium" | "high";
  impacts?: { label: string; value: string; tone?: "positive" | "negative" | "neutral" }[];
};

const riskLabel: Record<NonNullable<DecisionOption["risk"]>, string> = { low: "Low risk", medium: "Medium risk", high: "High risk" };

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

  useEffect(() => setSelected(null), [optionKey]);

  const moveSelection = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!options.length || !["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = (index + delta + options.length) % options.length;
    setSelected(options[nextIndex].id);
    document.getElementById(`decision-option-${options[nextIndex].id}`)?.focus();
  };

  return (
    <section className="decision-experience" aria-labelledby="decision-title">
      <div className="decision-step" aria-label="Decision flow">
        <span>DECISION</span><span aria-hidden="true">•</span><span>ASSESS</span><span aria-hidden="true">→</span><span>CHOOSE</span><span aria-hidden="true">→</span><span>ACT</span>
      </div>
      <h2 id="decision-title">{situation}</h2>
      {context ? <div className="decision-context">{context}</div> : null}

      <div className="decision-options" role="radiogroup" aria-label="Decision options">
        {options.map((option, index) => {
          const active = option.id === selected;
          return (
            <button
              key={option.id}
              id={`decision-option-${option.id}`}
              type="button"
              className={`decision-option ${active ? "selected" : ""}`}
              role="radio"
              aria-checked={active}
              tabIndex={active || (!selected && index === 0) ? 0 : -1}
              onClick={() => setSelected(option.id)}
              onKeyDown={(event) => moveSelection(event, index)}
            >
              <span className="decision-option-head">
                <strong>{option.title}</strong>
                {option.risk ? <span className={`decision-risk ${option.risk}`}>{riskLabel[option.risk]}</span> : null}
              </span>
              <span className="decision-description">{option.description}</span>
              {option.impacts?.length ? (
                <span className="decision-impact-grid" aria-label="Expected impacts">
                  {option.impacts.map((impact) => <span key={impact.label} className={`decision-impact ${impact.tone ?? "neutral"}`}><small>{impact.label}</small><b>{impact.value}</b></span>)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {chosen ? <div className="decision-preview" aria-live="polite"><strong>Selected: {chosen.title}</strong><span>Review the trade-offs before committing. Use arrow keys to compare options.</span></div> : null}
      <div className="decision-actions"><button type="button" className="primary decision-confirm" disabled={!chosen} onClick={() => chosen && onConfirm(chosen)}>Confirm decision</button></div>
      {consequence ? <div className="decision-consequence" aria-live="polite"><strong>Outcome</strong>{consequence}</div> : null}
    </section>
  );
}
