export type BusinessStructure =
  | "sole_trader"
  | "partnership"
  | "trio"
  | "team";

export type EventType =
  | "supplier_price_increase"
  | "demand_spike"
  | "customer_complaint"
  | "investor_opportunity"
  | "market_news";

export type DecisionType =
  | "accept_supplier_increase"
  | "negotiate_supplier"
  | "switch_supplier"
  | "increase_inventory"
  | "respond_to_complaint"
  | "pursue_investment"
  | "ignore_event";

export interface Founder {
  id: string;
  name: string;
  role: "founder" | "ceo" | "marketing" | "finance" | "operations";
}

export interface Business {
  id: string;
  name: string;
  structure: BusinessStructure;
  founders: Founder[];
  day: number;
  cash: number;
  revenue: number;
  expenses: number;
  reputation: number;
  inventory: number;
  customers: number;
  marketShare: number;
}

export interface SimulationEvent {
  id: string;
  day: number;
  type: EventType;
  title: string;
  description: string;
  choices: DecisionType[];
  impactPreview?: string;
}

export interface DecisionResult {
  decision: DecisionType;
  message: string;
  cashDelta: number;
  reputationDelta: number;
  inventoryDelta: number;
  revenueDelta: number;
  expenseDelta: number;
}

export interface SimulationState {
  business: Business;
  activeEvents: SimulationEvent[];
  history: DecisionResult[];
}
