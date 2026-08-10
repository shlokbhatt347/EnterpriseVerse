import type { Phase16Run } from "./phase16";
import type { LivingWorldState20 } from "./phase20";

export type Skill23 = "finance" | "strategy" | "operations" | "marketing" | "leadership" | "risk" | "customer" | "innovation";
export type ScenarioCategory23 = "finance" | "market" | "operations" | "people" | "strategy" | "resilience" | "ethics";
export type ScenarioDifficulty23 = "foundation" | "developing" | "advanced" | "expert" | "founder";
export type ChoiceQuality23 = "excellent" | "strong" | "mixed" | "weak" | "dangerous";

export interface ScenarioChoice23 {
  id: string;
  label: string;
  description: string;
  skills: Partial<Record<Skill23, number>>;
  risk: number;
  cashEffect: number;
  reputationEffect: number;
  customerEffect: number;
  strategicEffect: number;
  delayedEffect: number;
}

export interface Scenario23 {
  id: string;
  category: ScenarioCategory23;
  difficulty: ScenarioDifficulty23;
  title: string;
  situation: string;
  whyItMatters: string;
  skills: Skill23[];
  choices: ScenarioChoice23[];
  lesson: string;
  tags: string[];
}

export interface SkillProfile23 {
  skills: Record<Skill23, number>;
  strongest: Skill23[];
  weakest: Skill23[];
  totalDecisions: number;
  confidence: number;
}

export interface DecisionEvaluation23 {
  scenarioId: string;
  choiceId: string;
  quality: ChoiceQuality23;
  score: number;
  immediateImpact: number;
  delayedImpact: number;
  tradeoffBalance: number;
  skillAlignment: number;
  riskDiscipline: number;
  explanation: string;
  lesson: string;
}

export interface LearningRecord23 {
  scenarioId: string;
  day: number;
  category: ScenarioCategory23;
  skills: Skill23[];
  score: number;
  quality: ChoiceQuality23;
  lesson: string;
}

export interface Phase23Challenge23 {
  scenario: Scenario23;
  reason: "weak_skill" | "recent_failure" | "progression" | "variety" | "replay";
  targetSkills: Skill23[];
  seed: number;
}

export interface Phase23Debrief23 {
  score: number;
  founderStyle: string;
  strengths: string[];
  blindSpots: string[];
  lessons: string[];
  nextChallenge: string;
  decisionCount: number;
}

const SKILLS: Skill23[] = ["finance", "strategy", "operations", "marketing", "leadership", "risk", "customer", "innovation"];
const CATEGORIES: ScenarioCategory23[] = ["finance", "market", "operations", "people", "strategy", "resilience", "ethics"];

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value: number) => Math.round(value * 100) / 100;

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) h = Math.imul(h ^ input.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rand(seed: number, salt: number): number {
  let x = (seed ^ Math.imul(salt + 1, 0x9e3779b9)) >>> 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  return ((x >>> 0) % 1_000_003) / 1_000_003;
}

function emptySkills(): Record<Skill23, number> {
  return { finance: 50, strategy: 50, operations: 50, marketing: 50, leadership: 50, risk: 50, customer: 50, innovation: 50 };
}

function scenarioDifficulty(profile: SkillProfile23): ScenarioDifficulty23 {
  const average = Object.values(profile.skills).reduce((sum, value) => sum + value, 0) / SKILLS.length;
  if (average >= 82) return "founder";
  if (average >= 68) return "expert";
  if (average >= 55) return "advanced";
  if (average >= 42) return "developing";
  return "foundation";
}

const SCENARIOS: Scenario23[] = [
  {
    id: "cash-runway-23", category: "finance", difficulty: "developing", title: "The runway decision", situation: "Cash is tightening while a growth opportunity appears. Taking it could accelerate revenue, but it reduces your safety buffer.", whyItMatters: "Growth without liquidity can destroy an otherwise healthy business.", skills: ["finance", "risk", "strategy"], lesson: "Good founders protect survival while investing selectively. The best answer is rarely the biggest possible bet.", tags: ["cash", "growth", "runway"], choices: [
      { id: "bet-big", label: "Bet aggressively", description: "Commit most of the available cash to capture the opportunity.", skills: { strategy: 70, risk: 25, finance: 20 }, risk: 90, cashEffect: -45, reputationEffect: 2, customerEffect: 8, strategicEffect: 12, delayedEffect: 15 },
      { id: "stage-investment", label: "Stage the investment", description: "Fund a smaller test, measure traction, then scale if the evidence is strong.", skills: { finance: 80, risk: 85, strategy: 82 }, risk: 35, cashEffect: -15, reputationEffect: 2, customerEffect: 5, strategicEffect: 10, delayedEffect: 12 },
      { id: "protect-cash", label: "Protect cash", description: "Reject the opportunity and preserve runway for existing operations.", skills: { finance: 65, risk: 78 }, risk: 20, cashEffect: 2, reputationEffect: 0, customerEffect: -3, strategicEffect: -4, delayedEffect: -5 },
    ],
  },
  {
    id: "price-war-23", category: "market", difficulty: "advanced", title: "A competitor starts a price war", situation: "Your strongest competitor cuts price by 18%. Customers are noticing, but matching the cut would compress your margin sharply.", whyItMatters: "Price is only one part of competitive positioning. A reactive price war can damage both businesses.", skills: ["strategy", "customer", "finance", "marketing"], lesson: "Compete on the dimension that creates durable value instead of automatically copying a competitor.", tags: ["competition", "pricing", "positioning"], choices: [
      { id: "match-price", label: "Match immediately", description: "Cut your price by the same amount.", skills: { finance: 30, strategy: 45, customer: 65 }, risk: 70, cashEffect: -8, reputationEffect: 0, customerEffect: 10, strategicEffect: 3, delayedEffect: -12 },
      { id: "differentiate", label: "Differentiate the offer", description: "Keep price discipline and strengthen the feature or service customers value most.", skills: { strategy: 88, marketing: 82, customer: 90 }, risk: 35, cashEffect: -6, reputationEffect: 8, customerEffect: 7, strategicEffect: 15, delayedEffect: 14 },
      { id: "premium-proof", label: "Raise price and prove value", description: "Move upmarket and communicate a clearly superior proposition.", skills: { marketing: 78, strategy: 80, risk: 55 }, risk: 58, cashEffect: 4, reputationEffect: 6, customerEffect: -4, strategicEffect: 12, delayedEffect: 10 },
    ],
  },
  {
    id: "supplier-shock-23", category: "operations", difficulty: "advanced", title: "Your supplier becomes unreliable", situation: "Your primary supplier has missed deliveries twice. Switching is more expensive, but staying creates a serious stockout risk.", whyItMatters: "Operational resilience often looks expensive until the moment a disruption arrives.", skills: ["operations", "risk", "finance"], lesson: "Resilience is an investment. Diversification and contingency capacity reduce the cost of future shocks.", tags: ["supply", "resilience", "inventory"], choices: [
      { id: "stay", label: "Stay with the supplier", description: "Accept the risk because the current supplier is cheaper.", skills: { finance: 55, risk: 25, operations: 45 }, risk: 82, cashEffect: 5, reputationEffect: -5, customerEffect: -8, strategicEffect: -4, delayedEffect: -15 },
      { id: "dual-source", label: "Build a second source", description: "Keep the existing relationship while qualifying a backup supplier.", skills: { operations: 90, risk: 92, finance: 75 }, risk: 25, cashEffect: -8, reputationEffect: 4, customerEffect: 3, strategicEffect: 12, delayedEffect: 18 },
      { id: "switch", label: "Switch completely", description: "Move immediately to a more reliable but expensive supplier.", skills: { operations: 78, risk: 70 }, risk: 45, cashEffect: -15, reputationEffect: 3, customerEffect: 5, strategicEffect: 8, delayedEffect: 9 },
    ],
  },
  {
    id: "team-conflict-23", category: "people", difficulty: "developing", title: "A high performer is damaging the team", situation: "A talented employee delivers excellent results but is creating conflict and lowering collaboration.", whyItMatters: "Leadership decisions affect performance through people, not only through numbers.", skills: ["leadership", "customer", "risk", "strategy"], lesson: "High individual performance does not compensate indefinitely for a broken team system. Address behaviour and incentives early.", tags: ["people", "culture", "leadership"], choices: [
      { id: "ignore", label: "Ignore it", description: "Keep the employee because their individual output is high.", skills: { leadership: 20 }, risk: 80, cashEffect: 2, reputationEffect: -8, customerEffect: -5, strategicEffect: -4, delayedEffect: -14 },
      { id: "coach", label: "Coach and reset expectations", description: "Set clear behavioural standards while giving the employee a path to improve.", skills: { leadership: 92, risk: 72, strategy: 70 }, risk: 28, cashEffect: -2, reputationEffect: 8, customerEffect: 5, strategicEffect: 10, delayedEffect: 16 },
      { id: "replace", label: "Replace the employee", description: "Accept short-term disruption to protect team culture.", skills: { leadership: 70, risk: 65 }, risk: 48, cashEffect: -12, reputationEffect: 3, customerEffect: 2, strategicEffect: 7, delayedEffect: 8 },
    ],
  },
  {
    id: "ethical-growth-23", category: "ethics", difficulty: "expert", title: "Fast growth with a hidden cost", situation: "A marketing channel can increase customer acquisition quickly, but it relies on practices that reduce transparency.", whyItMatters: "Short-term growth can create long-term trust, regulatory and reputation costs.", skills: ["ethics", "marketing", "risk", "leadership"], lesson: "Sustainable growth includes the cost of trust. A strategy that wins customers while weakening credibility is not free growth.", tags: ["ethics", "trust", "growth"], choices: [
      { id: "use-channel", label: "Use the channel", description: "Prioritize rapid acquisition and accept the transparency trade-off.", skills: { marketing: 75, risk: 20 }, risk: 88, cashEffect: 14, reputationEffect: -18, customerEffect: 12, strategicEffect: 8, delayedEffect: -24 },
      { id: "redesign", label: "Redesign the campaign", description: "Keep the growth objective but remove the misleading elements.", skills: { ethics: 95, marketing: 82, risk: 90 }, risk: 25, cashEffect: 5, reputationEffect: 12, customerEffect: 8, strategicEffect: 13, delayedEffect: 20 },
      { id: "reject", label: "Reject it", description: "Walk away from the channel entirely.", skills: { ethics: 92, risk: 88 }, risk: 15, cashEffect: -4, reputationEffect: 10, customerEffect: -2, strategicEffect: 3, delayedEffect: 9 },
    ],
  },
  {
    id: "innovation-moat-23", category: "strategy", difficulty: "expert", title: "Build the moat or harvest the cash", situation: "Your product is performing well. You can harvest the current success or reinvest in a capability competitors cannot easily copy.", whyItMatters: "Strong businesses balance current performance with future defensibility.", skills: ["innovation", "strategy", "finance", "risk"], lesson: "A moat is built before you urgently need one. Reinvestment should be tied to a credible strategic advantage.", tags: ["innovation", "moat", "strategy"], choices: [
      { id: "harvest", label: "Harvest the cash", description: "Keep investment low and maximize current profit.", skills: { finance: 75 }, risk: 35, cashEffect: 15, reputationEffect: 0, customerEffect: 2, strategicEffect: -4, delayedEffect: -12 },
      { id: "build-moat", label: "Build a defensible capability", description: "Invest in product and capability that improves long-term differentiation.", skills: { innovation: 94, strategy: 90, finance: 72 }, risk: 42, cashEffect: -18, reputationEffect: 8, customerEffect: 10, strategicEffect: 20, delayedEffect: 24 },
      { id: "split", label: "Split the capital", description: "Maintain the current engine while funding a focused innovation programme.", skills: { finance: 82, innovation: 82, strategy: 85 }, risk: 28, cashEffect: -8, reputationEffect: 5, customerEffect: 7, strategicEffect: 15, delayedEffect: 18 },
    ],
  },
];

export function getPhase23Scenarios(): Scenario23[] {
  return SCENARIOS.map((scenario) => ({ ...scenario, choices: scenario.choices.map((choice) => ({ ...choice, skills: { ...choice.skills } })) }));
}

export function createSkillProfile23(records: LearningRecord23[] = []): SkillProfile23 {
  const skills = emptySkills();
  const counts = emptySkills();
  for (const record of records) {
    const gain = (record.score - 50) / 12;
    for (const skill of record.skills) {
      skills[skill] = clamp(skills[skill] + gain * 0.35);
      counts[skill] += 1;
    }
  }
  const strongest = [...SKILLS].sort((a, b) => skills[b] - skills[a]).slice(0, 3);
  const weakest = [...SKILLS].sort((a, b) => skills[a] - skills[b]).slice(0, 3);
  const confidence = clamp(45 + Math.min(40, records.length * 2));
  return { skills: Object.fromEntries(SKILLS.map((skill) => [skill, round(skills[skill])])) as Record<Skill23, number>, strongest, weakest, totalDecisions: records.length, confidence };
}

export function evaluatePhase23Decision(scenario: Scenario23, choiceId: string, profile: SkillProfile23, context?: { cash?: number; reputation?: number; marketPressure?: number }): DecisionEvaluation23 {
  const choice = scenario.choices.find((item) => item.id === choiceId);
  if (!choice) throw new Error(`Unknown Phase 23 choice: ${choiceId}`);
  const alignmentValues = Object.entries(choice.skills).map(([skill, weight]) => (profile.skills[skill as Skill23] / 100) * (weight ?? 0));
  const skillAlignment = clamp(alignmentValues.reduce((sum, value) => sum + value, 0) / Math.max(1, Object.keys(choice.skills).length));
  const cash = context?.cash ?? 50_000;
  const reputation = context?.reputation ?? 60;
  const marketPressure = context?.marketPressure ?? 50;
  const liquidityPenalty = cash < 10_000 && choice.cashEffect < -20 ? 22 : 0;
  const reputationPenalty = reputation < 35 && choice.reputationEffect < 0 ? 15 : 0;
  const pressureAdjustment = marketPressure > 70 && choice.risk > 70 ? -10 : marketPressure < 35 && choice.risk < 40 ? 5 : 0;
  const immediateImpact = clamp(50 + choice.cashEffect * 0.8 + choice.reputationEffect * 1.2 + choice.customerEffect * 0.8);
  const delayedImpact = clamp(50 + choice.delayedEffect * 2 + choice.strategicEffect * 0.8);
  const tradeoffBalance = clamp(75 - Math.abs(choice.cashEffect) * 0.5 - Math.abs(choice.risk - 45) * 0.25 + choice.strategicEffect * 0.35);
  const riskDiscipline = clamp(100 - Math.max(0, choice.risk - profile.skills.risk) * 0.8 - liquidityPenalty - reputationPenalty + pressureAdjustment);
  const score = round(clamp(immediateImpact * 0.22 + delayedImpact * 0.30 + tradeoffBalance * 0.18 + skillAlignment * 0.18 + riskDiscipline * 0.12));
  const quality: ChoiceQuality23 = score >= 85 ? "excellent" : score >= 72 ? "strong" : score >= 55 ? "mixed" : score >= 38 ? "weak" : "dangerous";
  const explanation = quality === "excellent" ? "This choice balances immediate survival with long-term value and uses the situation's strongest strategic signals." : quality === "strong" ? "This choice has a sound strategic logic, although one meaningful trade-off remains." : quality === "mixed" ? "This choice can work, but it leaves a material weakness or delayed consequence exposed." : quality === "weak" ? "The immediate benefit comes with a larger strategic or risk cost than the situation justifies." : "This choice creates an unusually high downside relative to the available evidence and business resilience.";
  return { scenarioId: scenario.id, choiceId, quality, score, immediateImpact: round(immediateImpact), delayedImpact: round(delayedImpact), tradeoffBalance: round(tradeoffBalance), skillAlignment: round(skillAlignment), riskDiscipline: round(riskDiscipline), explanation, lesson: scenario.lesson };
}

export function generatePhase23Challenge(seedInput: number | string, profile: SkillProfile23, history: LearningRecord23[] = [], world?: LivingWorldState20): Phase23Challenge23 {
  const seed = typeof seedInput === "number" ? Math.abs(Math.floor(seedInput)) >>> 0 : hash(seedInput);
  const difficulty = scenarioDifficulty(profile);
  const recent = history.slice(-3);
  const recentAverage = recent.length ? recent.reduce((sum, item) => sum + item.score, 0) / recent.length : 100;
  const reason: Phase23Challenge23["reason"] = profile.totalDecisions < 3 ? "progression" : recentAverage < 58 ? "recent_failure" : profile.weakest.length ? "weak_skill" : history.length % 3 === 0 ? "replay" : "variety";
  const target = reason === "weak_skill" || reason === "recent_failure" ? profile.weakest.slice(0, 2) : [SKILLS[Math.floor(rand(seed, history.length + 7) * SKILLS.length)]];
  const candidates = SCENARIOS.filter((scenario) => scenario.difficulty === difficulty || reason === "recent_failure" || reason === "weak_skill");
  const marketHint = world?.market.consumerConfidence ?? 70;
  const ranked = candidates.map((scenario) => {
    const overlap = scenario.skills.filter((skill) => target.includes(skill)).length;
    const categoryVariety = history.length && history.at(-1)?.category === scenario.category ? -12 : 0;
    const marketBonus = scenario.category === "market" && marketHint < 55 ? 8 : 0;
    return { scenario, score: overlap * 30 + categoryVariety + marketBonus + rand(seed, scenario.id.length) * 10 };
  }).sort((a, b) => b.score - a.score);
  return { scenario: ranked[0]?.scenario ?? SCENARIOS[0], reason, targetSkills: target, seed };
}

export function recordPhase23Learning(history: LearningRecord23[], evaluation: DecisionEvaluation23, day: number, category: ScenarioCategory23, skills: Skill23[]): LearningRecord23[] {
  const record: LearningRecord23 = { scenarioId: evaluation.scenarioId, day, category, skills: [...skills], score: evaluation.score, quality: evaluation.quality, lesson: evaluation.lesson };
  return [...history, record].slice(-200);
}

export function createPhase23Debrief(history: LearningRecord23[], profile = createSkillProfile23(history)): Phase23Debrief23 {
  const score = round(history.length ? history.reduce((sum, record) => sum + record.score, 0) / history.length : 0);
  const strengths = profile.strongest.map((skill) => `${skill} — demonstrated consistently across your decisions.`);
  const blindSpots = profile.weakest.map((skill) => `${skill} — a useful focus area for your next decisions.`);
  const lessons = [...new Set(history.slice(-8).map((record) => record.lesson))].slice(-3);
  const nextChallenge = profile.weakest[0] ? `Practice ${profile.weakest[0]} in a scenario where the trade-off is deliberately difficult.` : "Try a new scenario category to test whether your decision quality transfers to a different context.";
  const founderStyle = profile.strongest.includes("strategy") && profile.strongest.includes("risk") ? "Strategic Risk Manager" : profile.strongest.includes("innovation") ? "Innovative Builder" : profile.strongest.includes("customer") ? "Customer-Led Founder" : profile.strongest.includes("finance") ? "Capital Disciplined Founder" : "Adaptive Generalist";
  return { score, founderStyle, strengths, blindSpots, lessons, nextChallenge, decisionCount: history.length };
}

export function phase23Signature(challenge: Phase23Challenge23, history: LearningRecord23[]): string {
  return `${hash(JSON.stringify({ seed: challenge.seed, scenario: challenge.scenario.id, reason: challenge.reason, history: history.slice(-20).map((item) => [item.scenarioId, item.score, item.quality]) }))}`;
}

export function recommendPhase23Scenarios(profile: SkillProfile23, count = 3): Scenario23[] {
  const safeCount = Math.max(1, Math.min(5, Math.floor(count)));
  return [...SCENARIOS].sort((a, b) => {
    const aNeed = a.skills.reduce((sum, skill) => sum + (100 - profile.skills[skill]), 0);
    const bNeed = b.skills.reduce((sum, skill) => sum + (100 - profile.skills[skill]), 0);
    return bNeed - aNeed;
  }).slice(0, safeCount);
}
