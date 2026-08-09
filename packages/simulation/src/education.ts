import type { DecisionOutcome, EntrepreneurProfile, RunAssessment, SimulationState } from "@enterpriseverse/types";

export type LearningDomain = "marketing" | "finance" | "operations" | "people" | "stakeholders" | "risk" | "growth";
export type QuestionType = "mcq" | "scenario" | "short_answer";

export interface LearningObjective { id: string; domain: LearningDomain; title: string; explanation: string; }
export interface AssessmentQuestion { id: string; domain: LearningDomain; type: QuestionType; prompt: string; options?: string[]; answer: string; explanation: string; difficulty: 1 | 2 | 3; }
export interface AssessmentResult { questionId: string; correct: boolean; domain: LearningDomain; score: number; }
export interface MasteryState { scores: Partial<Record<LearningDomain, number>>; attempts: number; correct: number; }

export const learningObjectives: LearningObjective[] = [
  { id: "marketing-value", domain: "marketing", title: "Marketing creates demand and awareness", explanation: "Marketing can increase awareness and acquisition, but spending must be evaluated against financial and operational capacity." },
  { id: "finance-cash", domain: "finance", title: "Cash is a survival constraint", explanation: "A profitable business can still fail when cash is insufficient to meet obligations." },
  { id: "operations-capacity", domain: "operations", title: "Capacity constrains growth", explanation: "Demand cannot become fulfilled sales when production or service capacity is insufficient." },
  { id: "people-productivity", domain: "people", title: "People affect execution", explanation: "Morale, workload, skills and productivity influence operating performance." },
  { id: "stakeholder-trust", domain: "stakeholders", title: "Relationships have economic value", explanation: "Trust and reputation influence repeat business, negotiations and stakeholder responses." },
  { id: "risk-tradeoff", domain: "risk", title: "Risk requires trade-offs", explanation: "Higher potential returns can expose a business to greater downside and liquidity pressure." },
  { id: "growth-quality", domain: "growth", title: "Growth should be sustainable", explanation: "Growth is strongest when demand, cash, capacity and people can support it together." },
];

export const assessmentBank: AssessmentQuestion[] = [
  { id: "finance-1", domain: "finance", type: "mcq", prompt: "Which measure best describes how long current cash can fund the business at its current burn rate?", options: ["Market share", "Cash runway", "Reputation", "Product quality"], answer: "Cash runway", explanation: "Cash runway estimates how long available cash can cover ongoing net cash needs.", difficulty: 1 },
  { id: "marketing-1", domain: "marketing", type: "scenario", prompt: "Demand is weak but production capacity is already full. What should you investigate before increasing marketing spend?", answer: "capacity", explanation: "Increasing demand without capacity can create stockouts, delays or poor service.", difficulty: 2 },
  { id: "risk-1", domain: "risk", type: "short_answer", prompt: "Name one reason a business should avoid making a large irreversible commitment when uncertainty is high.", answer: "flexibility", explanation: "Preserving flexibility can reduce downside exposure while more information becomes available.", difficulty: 2 },
];

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function scoreAnswer(question: AssessmentQuestion, answer: string): AssessmentResult {
  const normalized = answer.trim().toLowerCase();
  const expected = question.answer.trim().toLowerCase();
  const correct = question.type === "short_answer" ? normalized.includes(expected) : normalized === expected;
  return { questionId: question.id, correct, domain: question.domain, score: correct ? question.difficulty * 10 : 0 };
}

export function updateMastery(current: MasteryState, result: AssessmentResult): MasteryState {
  const previous = current.scores[result.domain] ?? 0;
  const target = result.correct ? previous + result.score : previous - 5;
  return { scores: { ...current.scores, [result.domain]: clamp(target) }, attempts: current.attempts + 1, correct: current.correct + (result.correct ? 1 : 0) };
}

export function assessRun(state: SimulationState): RunAssessment {
  const outcomes: DecisionOutcome[] = state.outcomes ?? [];
  const score = clamp(outcomes.length ? outcomes.reduce((sum, outcome) => sum + outcome.score, 0) / outcomes.length : 50);
  const strengths = score >= 70 ? ["Consistent decision quality", "Ability to manage trade-offs"] : ["Willingness to make decisions"];
  const lessons = score < 70 ? ["Compare financial, operational and stakeholder consequences before committing."] : ["Continue balancing growth with sustainable cash and capacity."];
  const profile: EntrepreneurProfile = { primary: score >= 75 ? "Strategic operator" : "Developing entrepreneur", secondary: score >= 60 ? "Balanced decision-maker" : "Learning-focused decision-maker", strengths, blindSpots: score < 60 ? ["Long-term consequence planning"] : [] };
  return { score, profile, strengths, lessons, recommendations: ["Review the decisions with the largest positive and negative outcomes."] };
}
