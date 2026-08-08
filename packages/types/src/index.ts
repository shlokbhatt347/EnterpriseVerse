export type BusinessStructure = "sole_trader" | "partnership" | "trio" | "team";
export type BusinessStatus = "planning" | "active" | "paused" | "failed";

export interface Founder {
  id: string;
  name: string;
  cash: number;
  reputation: number;
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
  day: number;
  status: BusinessStatus;
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
