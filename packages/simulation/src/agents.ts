import type {
  AgentDecision,
  AICharacter,
  Business,
  CompetitorAgent,
  CustomerAgent,
  InvestorAgent,
  SupplierAgent,
} from "@enterpriseverse/types";

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

function remember(agent: AICharacter, day: number, summary: string, sentiment: number): AgentDecision["memory"] {
  return { day, summary, sentiment: clamp(sentiment, -100, 100) };
}

export function createCustomerAgents(): CustomerAgent[] {
  return [
    {
      id: "agent-customer-1", name: "Aarav", role: "customer", mood: "neutral", riskTolerance: "medium",
      goals: ["get reliable value", "avoid poor service"], trust: 60, relationship: 50, memories: [],
      segment: "standard", budget: 2500, priceSensitivity: 55, qualityPreference: 65, loyalty: 45,
    },
    {
      id: "agent-customer-2", name: "Mira", role: "customer", mood: "happy", riskTolerance: "low",
      goals: ["premium quality", "excellent service"], trust: 72, relationship: 60, memories: [],
      segment: "premium", budget: 6000, priceSensitivity: 25, qualityPreference: 90, loyalty: 70,
    },
    {
      id: "agent-customer-3", name: "Kabir", role: "customer", mood: "concerned", riskTolerance: "medium",
      goals: ["lowest practical price", "fast delivery"], trust: 52, relationship: 35, memories: [],
      segment: "budget", budget: 1400, priceSensitivity: 85, qualityPreference: 45, loyalty: 30,
    },
  ];
}

export function createSupplierAgents(): SupplierAgent[] {
  return [
    {
      id: "agent-supplier-1", name: "Prime Supplies", role: "supplier", mood: "neutral", riskTolerance: "low",
      goals: ["protect margin", "retain dependable clients"], trust: 70, relationship: 60, memories: [],
      unitCost: 60, reliability: 86, capacity: 100, minimumOrder: 10, negotiationFlexibility: 55,
    },
    {
      id: "agent-supplier-2", name: "Value Wholesale", role: "supplier", mood: "neutral", riskTolerance: "high",
      goals: ["increase volume", "win new accounts"], trust: 50, relationship: 45, memories: [],
      unitCost: 48, reliability: 68, capacity: 80, minimumOrder: 20, negotiationFlexibility: 75,
    },
  ];
}

export function createCompetitorAgents(): CompetitorAgent[] {
  return [
    {
      id: "agent-competitor-1", name: "UrbanEdge", role: "competitor", mood: "competitive", riskTolerance: "high",
      goals: ["grow market share", "become category leader"], trust: 40, relationship: 0, memories: [],
      strategy: "price", cash: 30000, marketShare: 12, aggression: 72,
    },
    {
      id: "agent-competitor-2", name: "CraftHouse", role: "competitor", mood: "confident", riskTolerance: "medium",
      goals: ["own the premium niche", "protect brand reputation"], trust: 50, relationship: 0, memories: [],
      strategy: "quality", cash: 45000, marketShare: 9, aggression: 48,
    },
  ];
}

export function createInvestorAgents(): InvestorAgent[] {
  return [
    {
      id: "agent-investor-1", name: "Asha Ventures", role: "investor", mood: "neutral", riskTolerance: "medium",
      goals: ["find scalable businesses", "protect downside"], trust: 55, relationship: 20, memories: [],
      investmentCapacity: 100000, growthPreference: 75, riskAppetite: 60, minimumEquity: 8,
    },
  ];
}

export function decideCustomerPurchase(agent: CustomerAgent, business: Business, price: number): AgentDecision {
  const affordability = clamp(100 - ((price / Math.max(1, agent.budget)) * 100));
  const valueScore = (affordability * agent.priceSensitivity + business.reputation * agent.qualityPreference + agent.trust * 20) / 175;
  const buys = business.inventory > 0 && valueScore >= 45;
  const action = buys ? "purchase" : "decline";
  const sentiment = buys ? clamp(Math.round((business.reputation - 50) / 2 + 10)) : -clamp(Math.round((50 - valueScore) / 2));
  return {
    agentId: agent.id,
    action,
    rationale: buys
      ? `${agent.name} sees acceptable value at ₹${price} and is willing to buy.`
      : `${agent.name} does not see enough value for the current price and trust level.`,
    effects: buys ? { revenue: price, inventory: -1, customerTrust: 2 } : { reputation: -1 },
    memory: remember(agent, business.day, `${action} decision at ₹${price}.`, sentiment),
  };
}

export function negotiateSupplier(agent: SupplierAgent, requestedUnits: number, offeredUnitCost: number, day: number): AgentDecision {
  const volumeLeverage = clamp((requestedUnits / Math.max(agent.minimumOrder, 1)) * 20);
  const gap = agent.unitCost - offeredUnitCost;
  const acceptableGap = agent.unitCost * (agent.negotiationFlexibility / 100) * 0.25;
  const accepts = requestedUnits >= agent.minimumOrder && gap <= acceptableGap + volumeLeverage * 0.02;
  const agreedCost = accepts ? Math.max(offeredUnitCost, agent.unitCost * 0.9) : agent.unitCost;
  return {
    agentId: agent.id,
    action: accepts ? "accept_offer" : "counter_offer",
    rationale: accepts
      ? `${agent.name} accepts because the order size and margin are reasonable.`
      : `${agent.name} counters because the proposed price threatens its margin or order volume is too small.`,
    effects: { unitCost: agreedCost, relationship: accepts ? 4 : -2 },
    memory: remember(agent, day, `${accepts ? "Accepted" : "Countered"} a supplier negotiation at ₹${Math.round(agreedCost)} per unit.`, accepts ? 8 : -4),
  };
}

export function decideCompetitorMove(agent: CompetitorAgent, business: Business): AgentDecision {
  const threatened = business.marketShare > agent.marketShare * 0.65;
  let action = "observe";
  let reputation = 0;
  if (threatened && agent.strategy === "price" && agent.cash > 10000) {
    action = "discount_campaign";
    reputation = -1;
  } else if (threatened && agent.strategy === "quality") {
    action = "quality_campaign";
    reputation = 1;
  }
  return {
    agentId: agent.id,
    action,
    rationale: action === "observe" ? `${agent.name} sees no need for an expensive response yet.` : `${agent.name} sees your growth as a threat and responds according to its strategy.`,
    effects: action === "discount_campaign" ? { competitorPressure: 8, marketShare: -0.4, reputation } : action === "quality_campaign" ? { competitorPressure: 4, reputation } : {},
    memory: remember(agent, business.day, `Observed your ${business.name}; chose ${action}.`, action === "observe" ? 2 : -8),
  };
}

export function evaluateInvestment(agent: InvestorAgent, business: Business): AgentDecision {
  const profitability = business.revenue > business.expenses ? 25 : 0;
  const traction = clamp(business.marketShare * 4);
  const score = profitability + traction + business.reputation * 0.4 + agent.growthPreference * 0.2;
  const invests = score >= 55 && agent.investmentCapacity > 0;
  const amount = invests ? Math.min(agent.investmentCapacity, Math.max(10000, Math.round(business.revenue * 0.5))) : 0;
  return {
    agentId: agent.id,
    action: invests ? "offer_investment" : "pass",
    rationale: invests ? `${agent.name} sees enough traction and reputation to justify growth capital.` : `${agent.name} wants stronger evidence of sustainable growth before investing.`,
    effects: invests ? { cash: amount, investorInterest: 10 } : { investorInterest: -2 },
    memory: remember(agent, business.day, `${invests ? "Offered" : "Declined"} investment after evaluating traction, reputation and profitability.`, invests ? 12 : -3),
  };
}
