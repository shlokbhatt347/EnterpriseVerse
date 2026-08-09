import type { Business, Customer, Supplier } from "@enterpriseverse/types";

export type MarketActor = {
  id: string;
  name: string;
  kind: "customer" | "supplier" | "competitor";
  mood: number;
  relationship: number;
  lastAction?: string;
};

export type ActorDecision = {
  actorId: string;
  action: string;
  impact: Record<string, number>;
  rationale: string;
};

const clamp = (value: number) => Math.max(0, Math.min(100, value));

export function createMarketActors(business: Business): MarketActor[] {
  const customers = business.customers.map((customer: Customer) => ({
    id: customer.id,
    name: customer.name,
    kind: "customer" as const,
    mood: clamp(customer.trust),
    relationship: clamp(customer.trust),
  }));

  const suppliers = business.suppliers.map((supplier: Supplier) => ({
    id: supplier.id,
    name: supplier.name,
    kind: "supplier" as const,
    mood: clamp(supplier.reliability),
    relationship: clamp(supplier.relationship),
  }));

  return [
    ...customers,
    ...suppliers,
    {
      id: "competitor-1",
      name: "Market Rival",
      kind: "competitor" as const,
      mood: 60,
      relationship: 50,
    },
  ];
}

export function decideCustomerActions(actors: MarketActor[], business: Business): ActorDecision[] {
  return actors.filter((actor) => actor.kind === "customer").map((actor): ActorDecision => {
    const loyalty = actor.relationship + business.reputation;
    if (loyalty >= 125) {
      return { actorId: actor.id, action: "repeat_purchase", impact: { demand: 2, reputation: 1 }, rationale: "Strong trust and reputation encourage a repeat purchase." };
    }
    if (loyalty < 80) {
      return { actorId: actor.id, action: "compare_alternatives", impact: { demand: -2, reputation: -1 }, rationale: "Low trust makes the customer more likely to compare alternatives." };
    }
    return { actorId: actor.id, action: "wait_and_watch", impact: { demand: 0 }, rationale: "The customer is satisfied but not strongly loyal." };
  });
}

export function decideSupplierActions(actors: MarketActor[], business: Business): ActorDecision[] {
  return actors.filter((actor) => actor.kind === "supplier").map((actor): ActorDecision => {
    if (actor.relationship >= 70) {
      return { actorId: actor.id, action: "offer_priority", impact: { supplierReliability: 2, inventory: 4 }, rationale: "A strong supplier relationship earns better treatment." };
    }
    if (actor.relationship < 40) {
      return { actorId: actor.id, action: "tighten_terms", impact: { supplierReliability: -2, inventory: -3 }, rationale: "A weak relationship leads to less favourable operating terms." };
    }
    return { actorId: actor.id, action: "maintain_terms", impact: { supplierReliability: 0 }, rationale: "The supplier relationship remains stable." };
  });
}

export function decideCompetitorAction(actor: MarketActor, business: Business): ActorDecision {
  if (business.marketShare >= 8 || business.reputation >= 75) {
    return { actorId: actor.id, action: "launch_campaign", impact: { demand: -3, reputation: -1 }, rationale: "The rival responds to a growing market threat." };
  }
  if (business.marketShare <= 2) {
    return { actorId: actor.id, action: "raise_price", impact: { demand: 1 }, rationale: "The rival sees little pressure and protects its margin." };
  }
  return { actorId: actor.id, action: "monitor", impact: { demand: 0 }, rationale: "The rival monitors the market before committing resources." };
}

export function runActorRound(actors: MarketActor[], business: Business): ActorDecision[] {
  const customerDecisions = decideCustomerActions(actors, business);
  const supplierDecisions = decideSupplierActions(actors, business);
  const competitor = actors.find((actor) => actor.kind === "competitor");
  return competitor
    ? [...customerDecisions, ...supplierDecisions, decideCompetitorAction(competitor, business)]
    : [...customerDecisions, ...supplierDecisions];
}
