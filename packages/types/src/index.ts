export type BusinessStructure = "sole_trader" | "partnership" | "trio" | "team";
export type BusinessStatus = "planning" | "active" | "paused" | "failed";
export type CustomerSegment = "budget" | "standard" | "premium";
export type CharacterMood = "happy" | "neutral" | "concerned" | "angry" | "excited" | "competitive" | "confident";
export type RiskTolerance = "low" | "medium" | "high";

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
  segment: CustomerSegment;
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

export interface OperationsState {
  price: number;
  quality: number;
  marketingBudget: number;
  productionCapacity: number;
  employees: number;
  supplierUnitCost: number;
  brandAwareness: number;
  customerSatisfaction: number;
  debt: number;
}

export interface MarketState {
  demandIndex: number;
  marketPrice: number;
  competitorPrice: number;
  competitorQuality: number;
  competitorMarketShare: number;
  trend: "growing" | "stable" | "declining";
  confidence: number;
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
  operations?: OperationsState;
  market?: MarketState;
  events: SimulationEvent[];
  log: string[];
}

export interface CharacterMemory {
  day: number;
  summary: string;
  sentiment: number;
}

export interface AICharacter {
  id: string;
  name: string;
  role: "customer" | "supplier" | "investor" | "competitor" | "employee";
  mood: CharacterMood;
  riskTolerance: RiskTolerance;
  goals: string[];
  trust: number;
  relationship: number;
  memories: CharacterMemory[];
}

export interface CustomerAgent extends AICharacter {
  role: "customer";
  segment: CustomerSegment;
  budget: number;
  priceSensitivity: number;
  qualityPreference: number;
  loyalty: number;
}

export interface SupplierAgent extends AICharacter {
  role: "supplier";
  unitCost: number;
  reliability: number;
  capacity: number;
  minimumOrder: number;
  negotiationFlexibility: number;
}

export interface CompetitorAgent extends AICharacter {
  role: "competitor";
  strategy: "price" | "quality" | "growth" | "niche";
  cash: number;
  marketShare: number;
  aggression: number;
}

export interface InvestorAgent extends AICharacter {
  role: "investor";
  investmentCapacity: number;
  growthPreference: number;
  riskAppetite: number;
  minimumEquity: number;
}

export interface AgentDecision {
  agentId: string;
  action: string;
  rationale: string;
  effects: Record<string, number>;
  memory: CharacterMemory;
}
