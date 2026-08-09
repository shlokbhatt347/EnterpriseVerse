export type BusinessStructure = "sole_trader" | "partnership" | "trio" | "team";
export type BusinessStatus = "planning" | "active" | "paused" | "failed";
export type CustomerSegment = "budget" | "standard" | "premium";
export type CharacterMood = "happy" | "neutral" | "concerned" | "angry" | "excited" | "competitive" | "confident";
export type RiskTolerance = "low" | "medium" | "high";
export type ProductStatus = "active" | "discontinued";
export type PurchaseOrderStatus = "draft" | "ordered" | "in_transit" | "delivered" | "cancelled";
export type LedgerEntryType = "sale" | "purchase" | "expense" | "refund" | "investment" | "loan" | "other";
export type SupplyChainDisruption = "none" | "supplier_delay" | "supplier_shortage" | "quality_issue" | "logistics_delay";

export interface Founder { id: string; name: string; cash: number; reputation: number; role?: "founder" | "ceo" | "marketing" | "finance" | "operations"; }
export interface Customer { id: string; name: string; segment: CustomerSegment; trust: number; lifetimeValue: number; lastPurchaseDay?: number; }
export interface Supplier { id: string; name: string; reliability: number; unitCost: number; relationship: number; availableUnits: number; }
export interface Business { id: string; name: string; idea: string; industry: string; structure: BusinessStructure; founders: Founder[]; cash: number; revenue: number; expenses: number; reputation: number; day: number; status: BusinessStatus; inventory: number; customers: Customer[]; suppliers: Supplier[]; marketShare: number; }
export interface Product { id: string; name: string; category: string; sellingPrice: number; productionCost: number; inventory: number; quality: number; demandScore: number; status: ProductStatus; }
export interface PurchaseOrder { id: string; supplierId: string; productId: string; quantity: number; unitCost: number; orderDay: number; deliveryDay: number; status: PurchaseOrderStatus; }
export interface Sale { id: string; day: number; productId: string; quantity: number; unitPrice: number; total: number; }
export interface LedgerEntry { id: string; day: number; type: LedgerEntryType; description: string; debit: number; credit: number; }
export interface AccountingState { cashIn: number; cashOut: number; grossProfit: number; netProfit: number; inventoryValue: number; ledger: LedgerEntry[]; }
export interface ProductionBatch { id: string; productId: string; plannedUnits: number; producedUnits: number; unitCost: number; quality: number; startDay: number; completionDay: number; status: "queued" | "in_progress" | "completed" | "cancelled"; }
export interface SupplyChainState { rawMaterialInventory: number; reorderPoint: number; targetStock: number; productionCapacity: number; productionCostPerUnit: number; productionQuality: number; pendingProduction: ProductionBatch[]; disruption: SupplyChainDisruption; disruptionDaysRemaining: number; lastDisruptionDay?: number; stockoutDays: number; overstockUnits: number; }
export interface EconomyState { products: Product[]; purchaseOrders: PurchaseOrder[]; sales: Sale[]; accounting: AccountingState; supplyChain?: SupplyChainState; }
export interface OperationsState { price: number; quality: number; marketingBudget: number; productionCapacity: number; employees: number; supplierUnitCost: number; brandAwareness: number; customerSatisfaction: number; debt: number; }
export interface MarketState { demandIndex: number; marketPrice: number; competitorPrice: number; competitorQuality: number; competitorMarketShare: number; trend: "growing" | "stable" | "declining"; confidence: number; priceElasticity: number; customerAcquisition: number; competitivePressure: number; strategyScore: number; }
export interface SimulationEvent { id: string; day: number; title: string; message: string; choices: SimulationChoice[]; }
export interface SimulationChoice { id: string; label: string; effects: Record<string, number>; }
export interface CharacterMemory { day: number; summary: string; sentiment: number; }
export interface AICharacter { id: string; name: string; role: "customer" | "supplier" | "investor" | "competitor" | "employee"; mood: CharacterMood; riskTolerance: RiskTolerance; goals: string[]; trust: number; relationship: number; memories: CharacterMemory[]; }
export interface CustomerAgent extends AICharacter { role: "customer"; segment: CustomerSegment; budget: number; priceSensitivity: number; qualityPreference: number; loyalty: number; }
export interface SupplierAgent extends AICharacter { role: "supplier"; unitCost: number; reliability: number; capacity: number; minimumOrder: number; negotiationFlexibility: number; }
export interface CompetitorAgent extends AICharacter { role: "competitor"; strategy: "price" | "quality" | "growth" | "niche"; cash: number; marketShare: number; aggression: number; }
export interface InvestorAgent extends AICharacter { role: "investor"; investmentCapacity: number; growthPreference: number; riskAppetite: number; minimumEquity: number; }
export interface AgentDecision { agentId: string; action: string; rationale: string; effects: Record<string, number>; memory: CharacterMemory; }
export interface AgentWorldState { customers: CustomerAgent[]; suppliers: SupplierAgent[]; competitors: CompetitorAgent[]; investors: InvestorAgent[]; lastDecisions: AgentDecision[]; }
export interface SimulationState { business: Business; operations?: OperationsState; market?: MarketState; economy?: EconomyState; agents?: AgentWorldState; events: SimulationEvent[]; log: string[]; }
