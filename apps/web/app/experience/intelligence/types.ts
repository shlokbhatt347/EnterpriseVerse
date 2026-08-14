export type Priority = "critical" | "important" | "signal" | "background";
export type DecisionRisk = "low" | "medium" | "high";
export type Confidence = "low" | "medium" | "high";

export type SimulationEntityRef = { id: string; type: string; label: string };

export type AttentionSignal = {
  id: string;
  priority: Priority;
  title: string;
  reason: string;
  entity?: SimulationEntityRef;
  href?: string;
  expiresAtTurn?: number;
  unread?: boolean;
};

export type ContextFact = {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative" | "warning";
};

export type ContextPanel = {
  entity: SimulationEntityRef;
  eyebrow?: string;
  summary: string;
  facts: ContextFact[];
  connectedEntities?: SimulationEntityRef[];
};

export type CausalNode = {
  id: string;
  label: string;
  value?: string;
  direction?: "up" | "down" | "flat";
};

export type CausalEdge = { from: string; to: string; explanation: string };
export type CausalChain = { id: string; headline: string; confidence: Confidence; nodes: CausalNode[]; edges: CausalEdge[] };

export type DecisionOption = {
  id: string;
  label: string;
  summary: string;
  cost?: string;
  risk: DecisionRisk;
  time?: string;
  effects: { label: string; value: string; direction: "positive" | "negative" | "neutral" }[];
  confidence: Confidence;
};

export type Decision = {
  id: string;
  title: string;
  situation: string;
  options: DecisionOption[];
  deadlineTurn?: number;
  reversible?: boolean;
};

export type MemoryEvent = {
  id: string;
  turn: number;
  title: string;
  description: string;
  entityIds?: string[];
  outcome?: "positive" | "negative" | "neutral";
};

export type ExperienceIntelligenceState = {
  attention: AttentionSignal[];
  context?: ContextPanel;
  causality?: CausalChain;
  decision?: Decision;
  memory: MemoryEvent[];
};
