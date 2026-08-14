import { describe, expect, it } from "vitest";
import { explainCausality, rankAttention, recommendDecision, remember } from "./engine";
import type { AttentionSignal, Decision } from "./types";

describe("experience intelligence", () => {
  it("ranks critical attention before lower priority signals", () => {
    const signals = [
      { id: "a", priority: "signal", title: "Signal", reason: "x" },
      { id: "b", priority: "critical", title: "Critical", reason: "x", unread: true },
    ] satisfies AttentionSignal[];
    expect(rankAttention(signals).map((x) => x.id)).toEqual(["b", "a"]);
  });

  it("turns causal nodes into an explainable path", () => {
    expect(explainCausality({ id: "c", headline: "Revenue fell", confidence: "high", nodes: [{ id: "1", label: "Demand ↓" }, { id: "2", label: "Conversion ↓" }], edges: [] })).toBe("Demand ↓ → Conversion ↓");
  });

  it("prefers lower risk and higher confidence decisions", () => {
    const decision = { id: "d", title: "Choose", situation: "x", options: [
      { id: "high", label: "High", summary: "x", risk: "high", confidence: "high", effects: [] },
      { id: "low", label: "Low", summary: "x", risk: "low", confidence: "high", effects: [] },
    ] } satisfies Decision;
    expect(recommendDecision(decision)[0].id).toBe("low");
  });

  it("keeps memory newest-first and replaces duplicate ids", () => {
    const next = remember([{ id: "a", turn: 2, title: "Old", description: "x" }], { id: "a", turn: 4, title: "Updated", description: "y" });
    expect(next).toHaveLength(1);
    expect(next[0].turn).toBe(4);
  });
});
