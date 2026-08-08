export type BusinessStructure = "sole_trader" | "partnership" | "trio" | "company";

export type DecisionType =
  | "supplier"
  | "customer"
  | "marketing"
  | "investment"
  | "operations";

export interface Founder {
  id: string;
  name: string;
  role: string;
}

export interface Business {
  id: string;
  name: string;
  structure: BusinessStructure;
  founders: Founder[];
  cash: number;
  revenue: number;
  expenses: number;
  reputation: number;
  customers: number;
  day: number;
}

export interface Customer {
  id: string;
  name: string;
  budget: number;
  trust: number;
  loyalty: number;
  priceSensitivity: number;
}

export interface Supplier {
  id: string;
  name: string;
  unitCost: number;
  reliability: number;
  relationship: number;
}

export interface BusinessEvent {
  id: string;
  title: string;
  description: string;
  type: DecisionType;
  options: DecisionOption[];
}

export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  cashDelta: number;
  reputationDelta: number;
}

export interface SimulationState {
  business: Business;
  customers: Customer[];
  suppliers: Supplier[];
  currentEvent: BusinessEvent | null;
  history: string[];
}
