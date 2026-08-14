import type { Business, SimulationChoice, SimulationEvent } from "@enterpriseverse/types";

const choice = (id: string, label: string, effects: Record<string, number>): SimulationChoice => ({ id, label, effects });

/** Deterministic daily event generator used by the canonical simulation state. */
export function generateEvent(day: number, business: Business): SimulationEvent {
  const cycle = day % 5;
  if (cycle === 1) {
    return { id: `event-${day}`, day, title: "Supplier price increase", message: "Your main supplier says input costs will rise by 12%. Decide how to protect your margin.", choices: [
      choice("accept", "Accept the increase", { cash: -900, reputation: 1, inventory: 12 }),
      choice("negotiate", "Negotiate a smaller increase", { cash: -450, reputation: 2, supplierRelationship: 4, inventory: 10 }),
      choice("switch", "Find another supplier", { cash: -250, reputation: -1, supplierRelationship: -6, inventory: 5 }),
    ] };
  }
  if (cycle === 2) {
    return { id: `event-${day}`, day, title: "Customer demand spike", message: "A local trend is driving extra demand. You can invest in stock or protect your cash.", choices: [
      choice("stock", "Buy extra inventory", { cash: -1200, revenue: 2400, reputation: 1, inventory: 30, customers: 5 }),
      choice("normal", "Keep operations unchanged", { revenue: 800, customers: 2, inventory: -8 }),
      choice("premium", "Raise prices and test demand", { revenue: 1400, reputation: -1, customers: 1, inventory: -6 }),
    ] };
  }
  if (cycle === 3) {
    return { id: `event-${day}`, day, title: "Customer complaint", message: "A visible customer says their order was late. Your response will affect trust and reputation.", choices: [
      choice("refund", "Refund and apologize", { cash: -300, reputation: 3, customerTrust: 6 }),
      choice("replace", "Replace the order", { cash: -180, reputation: 2, customerTrust: 4 }),
      choice("defend", "Refuse compensation", { reputation: -4, customerTrust: -8 }),
    ] };
  }
  if (cycle === 4) {
    return { id: `event-${day}`, day, title: "Competitor move", message: "A nearby competitor has launched a discount campaign. You must decide whether to react.", choices: [
      choice("match", "Match their discount", { cash: -500, revenue: 1500, reputation: 1, customers: 3 }),
      choice("differentiate", "Differentiate on quality", { revenue: 1100, reputation: 3, customers: 2 }),
      choice("ignore", "Ignore the campaign", { revenue: 500, reputation: -1 }),
    ] };
  }
  return { id: `event-${day}`, day, title: "Investor introduction", message: `${business.name} has attracted attention. An investor wants a short meeting. Decide whether to pursue growth capital.`, choices: [
    choice("pitch", "Prepare a growth pitch", { cash: 10000, reputation: 3, marketShare: 2 }),
    choice("decline", "Focus on customers instead", { revenue: 600, reputation: 1 }),
  ] };
}
