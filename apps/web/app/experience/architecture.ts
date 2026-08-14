/**
 * EnterpriseVerse Experience Architecture
 *
 * Step 1 of Experience 3.0: one product information architecture for every
 * future screen. This file is intentionally UI-framework agnostic so routes,
 * navigation, command surfaces, analytics and accessibility tooling can all
 * consume the same vocabulary.
 */

export type ExperienceArea =
  | "world"
  | "enterprise"
  | "decide"
  | "intelligence"
  | "learn"
  | "compete"
  | "legacy";

export type ExperienceSurface =
  | "markets"
  | "economy"
  | "competitors"
  | "suppliers"
  | "events"
  | "company"
  | "finance"
  | "operations"
  | "people"
  | "strategy"
  | "decisions"
  | "what-if"
  | "consequences"
  | "causality"
  | "observe"
  | "explain"
  | "forecast"
  | "experiment"
  | "concepts"
  | "skills"
  | "contextual-learning"
  | "multiplayer"
  | "rivals"
  | "challenges"
  | "timeline"
  | "replay"
  | "company-dna"
  | "founder-dna";

export type ExperienceIntent =
  | "orient"
  | "monitor"
  | "investigate"
  | "understand"
  | "decide"
  | "act"
  | "reflect"
  | "learn"
  | "compete"
  | "review";

export type ExperienceMode = "explore" | "decide" | "reflect";

export interface ExperienceNode {
  id: ExperienceSurface;
  area: ExperienceArea;
  label: string;
  description: string;
  intent: ExperienceIntent[];
  route: string;
  parent?: ExperienceSurface;
  keywords: string[];
  mobilePriority: "primary" | "secondary" | "contextual";
}

export interface ExperienceAreaDefinition {
  id: ExperienceArea;
  label: string;
  description: string;
  principle: string;
  primaryAction: string;
  nodes: ExperienceSurface[];
}

/** The canonical seven-part information architecture. */
export const EXPERIENCE_AREAS: readonly ExperienceAreaDefinition[] = [
  {
    id: "world",
    label: "World",
    description: "Everything outside the enterprise that can affect its future.",
    principle: "Understand the environment before acting inside it.",
    primaryAction: "Explore",
    nodes: ["markets", "economy", "competitors", "suppliers", "events"],
  },
  {
    id: "enterprise",
    label: "Enterprise",
    description: "The company, its resources, people, operations and strategic position.",
    principle: "Run the enterprise as a connected system.",
    primaryAction: "Operate",
    nodes: ["company", "finance", "operations", "people", "strategy"],
  },
  {
    id: "decide",
    label: "Decide",
    description: "High-consequence choices, possible futures and their outcomes.",
    principle: "Make trade-offs visible before committing.",
    primaryAction: "Decide",
    nodes: ["decisions", "what-if", "consequences", "causality"],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    description: "Evidence, explanation, forecasts and controlled experiments.",
    principle: "Turn information into better judgment, not more noise.",
    primaryAction: "Investigate",
    nodes: ["observe", "explain", "forecast", "experiment"],
  },
  {
    id: "learn",
    label: "Learn",
    description: "Concepts and skills discovered through the simulation context.",
    principle: "Learning should emerge from decisions and consequences.",
    primaryAction: "Learn",
    nodes: ["concepts", "skills", "contextual-learning"],
  },
  {
    id: "compete",
    label: "Compete",
    description: "Multiplayer competition, rivals and challenges.",
    principle: "Compete on judgment, adaptation and execution.",
    primaryAction: "Compete",
    nodes: ["multiplayer", "rivals", "challenges"],
  },
  {
    id: "legacy",
    label: "Legacy",
    description: "The history, identity and long-term story created by the player.",
    principle: "Make the company's journey visible and worth revisiting.",
    primaryAction: "Review",
    nodes: ["timeline", "replay", "company-dna", "founder-dna"],
  },
] as const;

/** Canonical nodes. Routes are the current compatibility targets; they do not dictate future UI composition. */
export const EXPERIENCE_NODES: readonly ExperienceNode[] = [
  { id: "markets", area: "world", label: "Markets", description: "Demand, segments, pricing and market movement.", intent: ["monitor", "investigate", "understand"], route: "/world", keywords: ["market", "demand", "pricing", "segments"], mobilePriority: "primary" },
  { id: "economy", area: "world", label: "Economy", description: "Macro conditions, cycles and economic pressure.", intent: ["monitor", "understand"], route: "/world", keywords: ["economy", "macro", "rates", "growth", "inflation"], mobilePriority: "contextual" },
  { id: "competitors", area: "world", label: "Competitors", description: "Competitive moves, positioning and threats.", intent: ["monitor", "investigate", "understand"], route: "/world", keywords: ["competitor", "rival", "market share", "threat"], mobilePriority: "primary" },
  { id: "suppliers", area: "world", label: "Suppliers", description: "Supply relationships, costs and resilience.", intent: ["monitor", "investigate", "act"], route: "/company", keywords: ["supplier", "procurement", "supply chain", "cost"], mobilePriority: "secondary" },
  { id: "events", area: "world", label: "Events", description: "World events that alter the simulation environment.", intent: ["monitor", "understand", "act"], route: "/world", keywords: ["event", "shock", "crisis", "opportunity"], mobilePriority: "primary" },

  { id: "company", area: "enterprise", label: "Company", description: "The executive view of the enterprise and its current position.", intent: ["orient", "monitor", "review"], route: "/company", keywords: ["company", "overview", "cockpit", "dashboard"], mobilePriority: "primary" },
  { id: "finance", area: "enterprise", label: "Finance", description: "Cash, profitability, debt, runway and financial health.", intent: ["monitor", "investigate", "act"], route: "/company", keywords: ["finance", "cash", "profit", "debt", "runway"], mobilePriority: "primary" },
  { id: "operations", area: "enterprise", label: "Operations", description: "Capacity, inventory, quality and execution.", intent: ["monitor", "investigate", "act"], route: "/company", keywords: ["operations", "inventory", "capacity", "quality", "production"], mobilePriority: "primary" },
  { id: "people", area: "enterprise", label: "People", description: "Workforce, leadership, relationships and organizational health.", intent: ["monitor", "investigate", "act"], route: "/company", keywords: ["people", "employees", "team", "workforce", "leadership"], mobilePriority: "secondary" },
  { id: "strategy", area: "enterprise", label: "Strategy", description: "Positioning, goals, trade-offs and competitive advantage.", intent: ["understand", "decide", "act"], route: "/strategy", keywords: ["strategy", "advantage", "positioning", "goals"], mobilePriority: "primary" },

  { id: "decisions", area: "decide", label: "Decisions", description: "Current and historical consequential choices.", intent: ["decide", "act", "reflect"], route: "/play", keywords: ["decision", "choice", "action", "trade-off"], mobilePriority: "primary" },
  { id: "what-if", area: "decide", label: "What-if", description: "Compare plausible futures before committing.", intent: ["investigate", "understand", "decide"], route: "/play", keywords: ["what if", "scenario", "simulation", "counterfactual"], mobilePriority: "primary" },
  { id: "consequences", area: "decide", label: "Consequences", description: "Trace what changed because of a decision.", intent: ["reflect", "understand", "learn"], route: "/play", keywords: ["consequence", "outcome", "impact", "result"], mobilePriority: "secondary" },
  { id: "causality", area: "decide", label: "Causality", description: "Trace drivers through the simulation's connected systems.", intent: ["investigate", "understand", "learn"], route: "/intelligence", keywords: ["why", "cause", "driver", "causal", "explain"], mobilePriority: "contextual" },

  { id: "observe", area: "intelligence", label: "Observe", description: "See the signals that matter now.", intent: ["monitor", "investigate"], route: "/intelligence", keywords: ["observe", "signals", "monitor", "pulse"], mobilePriority: "primary" },
  { id: "explain", area: "intelligence", label: "Explain", description: "Understand why a metric, event or outcome changed.", intent: ["investigate", "understand", "learn"], route: "/intelligence", keywords: ["explain", "why", "analysis", "cause"], mobilePriority: "primary" },
  { id: "forecast", area: "intelligence", label: "Forecast", description: "Explore evidence-based possible futures with uncertainty visible.", intent: ["investigate", "understand", "decide"], route: "/intelligence", keywords: ["forecast", "prediction", "future", "confidence"], mobilePriority: "secondary" },
  { id: "experiment", area: "intelligence", label: "Experiment", description: "Test assumptions and compare scenarios safely.", intent: ["investigate", "decide", "learn"], route: "/intelligence", keywords: ["experiment", "scenario", "test", "sandbox"], mobilePriority: "secondary" },

  { id: "concepts", area: "learn", label: "Concepts", description: "Business concepts discovered in context.", intent: ["learn", "understand"], route: "/learning", keywords: ["concept", "business theory", "lesson", "knowledge"], mobilePriority: "secondary" },
  { id: "skills", area: "learn", label: "Skills", description: "Capabilities developed through repeated decisions.", intent: ["learn", "review"], route: "/career", keywords: ["skill", "capability", "competency", "career"], mobilePriority: "secondary" },
  { id: "contextual-learning", area: "learn", label: "Learn from this", description: "Short explanations attached to the player's current situation.", intent: ["learn", "understand"], route: "/learning", keywords: ["learn from this", "context", "microlearning"], mobilePriority: "primary" },

  { id: "multiplayer", area: "compete", label: "Multiplayer", description: "Live or asynchronous competitive enterprise simulations.", intent: ["compete", "monitor", "act"], route: "/competition", keywords: ["multiplayer", "competition", "match", "round"], mobilePriority: "primary" },
  { id: "rivals", area: "compete", label: "Rivals", description: "Competitive intelligence about opponents.", intent: ["monitor", "investigate", "compete"], route: "/competition", keywords: ["rivals", "opponents", "competitive intelligence"], mobilePriority: "primary" },
  { id: "challenges", area: "compete", label: "Challenges", description: "Scenarios and challenges designed around competition.", intent: ["compete", "learn", "act"], route: "/competition", keywords: ["challenge", "scenario", "challenge mode"], mobilePriority: "secondary" },

  { id: "timeline", area: "legacy", label: "Timeline", description: "The company's journey through time.", intent: ["review", "reflect", "learn"], route: "/endgame", keywords: ["timeline", "history", "journey", "milestones"], mobilePriority: "secondary" },
  { id: "replay", area: "legacy", label: "Replay", description: "Revisit decisions, turning points and alternate outcomes.", intent: ["review", "reflect", "learn"], route: "/endgame", keywords: ["replay", "history", "turning point", "alternate"], mobilePriority: "secondary" },
  { id: "company-dna", area: "legacy", label: "Company DNA", description: "The strategic identity created by the player's behavior.", intent: ["review", "reflect", "learn"], route: "/endgame", keywords: ["company dna", "identity", "culture", "strategy"], mobilePriority: "contextual" },
  { id: "founder-dna", area: "legacy", label: "Founder DNA", description: "The leadership pattern revealed by the player's decisions.", intent: ["review", "reflect", "learn"], route: "/career", keywords: ["founder", "leadership", "profile", "dna"], mobilePriority: "contextual" },
] as const;

export const EXPERIENCE_AREA_BY_ID: Readonly<Record<ExperienceArea, ExperienceAreaDefinition>> = Object.fromEntries(
  EXPERIENCE_AREAS.map((area) => [area.id, area]),
) as Record<ExperienceArea, ExperienceAreaDefinition>;

export const EXPERIENCE_NODE_BY_ID: Readonly<Record<ExperienceSurface, ExperienceNode>> = Object.fromEntries(
  EXPERIENCE_NODES.map((node) => [node.id, node]),
) as Record<ExperienceSurface, ExperienceNode>;

/** Primary navigation intentionally contains only the seven mental models. */
export const PRIMARY_EXPERIENCE_NAV: readonly ExperienceArea[] = [
  "world",
  "enterprise",
  "decide",
  "intelligence",
  "learn",
  "compete",
  "legacy",
] as const;

/** The default landing surface for each mental model. */
export const AREA_LANDING_NODE: Readonly<Record<ExperienceArea, ExperienceSurface>> = {
  world: "markets",
  enterprise: "company",
  decide: "decisions",
  intelligence: "observe",
  learn: "contextual-learning",
  compete: "multiplayer",
  legacy: "timeline",
};

export function getAreaNodes(area: ExperienceArea): readonly ExperienceNode[] {
  return EXPERIENCE_AREAS.find((item) => item.id === area)?.nodes.map((id) => EXPERIENCE_NODE_BY_ID[id]) ?? [];
}

export function getNode(id: ExperienceSurface): ExperienceNode {
  return EXPERIENCE_NODE_BY_ID[id];
}

export function getAreaForNode(id: ExperienceSurface): ExperienceAreaDefinition {
  return EXPERIENCE_AREA_BY_ID[EXPERIENCE_NODE_BY_ID[id].area];
}

export function getNodesForRoute(route: string): readonly ExperienceNode[] {
  return EXPERIENCE_NODES.filter((node) => node.route === route);
}

export function searchExperience(query: string): readonly ExperienceNode[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return EXPERIENCE_NODES
    .map((node) => {
      const label = node.label.toLowerCase();
      const description = node.description.toLowerCase();
      const keywords = node.keywords.join(" ").toLowerCase();
      const score = label === normalized ? 100 : label.startsWith(normalized) ? 80 : keywords.includes(normalized) ? 60 : description.includes(normalized) ? 40 : 0;
      return { node, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ node }) => node);
}
