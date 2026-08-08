export type BusinessStructure = "sole_trader" | "partnership" | "trio" | "team";
export type BusinessStatus = "planning" | "active" | "paused" | "failed";

export interface Founder {
  id: string;
  name: string;
  cash: number;
  reputation: number;
  role?: "founder" | "ceo" | "marketing" | "finance" | "operations";
}

export interface Customer {
  id: string;
  name: string;
  segment: "budget" | "standard" | "premium";
  trust: number;
  lifetimeValue: number;
  lastPurchaseDay?: number;
}

export interface Supplier {
  id: string;
  name: string;
  reliability: number;
  unitCost: number;
  relationship: number;
  availableUnits: number;
}

export interface Business {
  id: string;
  name: string;
  idea: string;
  industry: string;
  structure: BusinessStructure;
  founders: Founder[];
  cash: number;
  revenue: number;
  expenses: number;
  reputation: number;
  day: number;
  status: BusinessStatus;
  inventory: number;
  customers: Customer[];
  suppliers: Supplier[];
  marketShare: number;
}

export interface SimulationEvent {
  id: string;
  day: number;
  title: string;
  message: string;
  choices: SimulationChoice[];
}

export interface SimulationChoice {
  id: string;
  label: string;
  effects: Record<string, number>;
}

export interface SimulationState {
  business: Business;
  events: SimulationEvent[];
  log: string[];
}
