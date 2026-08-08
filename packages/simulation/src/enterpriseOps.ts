import type { Business, CustomerAgent, SupplierAgent } from "@enterpriseverse/types";

export interface Employee {
  id: string;
  name: string;
  role: "operations" | "sales" | "marketing" | "finance";
  salaryPerDay: number;
  productivity: number;
  morale: number;
}

export interface OperatingPlan {
  productionUnits: number;
  marketingSpend: number;
  procurementUnits: number;
  staffingCost: number;
}

export interface FinancialSnapshot {
  day: number;
  revenue: number;
  grossProfit: number;
  operatingProfit: number;
  cash: number;
  inventory: number;
  customerCount: number;
}

export interface OperationsResult {
  business: Business;
  employees: Employee[];
  financials: FinancialSnapshot;
  log: string[];
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

/** Resolves procurement, staffing, marketing and daily operating economics as one connected system. */
export function resolveOperationsDay(
  business: Business,
  employees: Employee[],
  customers: CustomerAgent[],
  suppliers: SupplierAgent[],
  plan: OperatingPlan,
): OperationsResult {
  const safeMarketing = Math.max(0, plan.marketingSpend);
  const staffingCost = employees.reduce((sum, employee) => sum + Math.max(0, employee.salaryPerDay), 0);
  const supplier = [...suppliers].sort((a, b) => b.reliability - a.reliability)[0];
  const procurementUnits = supplier ? Math.min(Math.max(0, Math.floor(plan.procurementUnits)), supplier.capacity) : 0;
  const procurementCost = supplier ? procurementUnits * supplier.unitCost : 0;
  const operationsProductivity = employees.length
    ? employees.reduce((sum, employee) => sum + employee.productivity * (employee.morale / 100), 0) / employees.length
    : 55;
  const productionUnits = Math.max(0, Math.floor(Math.min(plan.productionUnits, procurementUnits + business.inventory) * (operationsProductivity / 100)));
  const marketingLift = 1 + Math.min(0.5, safeMarketing / 10_000);
  const demand = Math.max(0, Math.round((customers.length * 0.65 + business.reputation * 0.2) * marketingLift));
  const unitsSold = Math.min(business.inventory + productionUnits, demand);
  const price = 120;
  const revenue = unitsSold * price;
  const costOfGoods = unitsSold * (supplier?.unitCost ?? 60);
  const operatingExpenses = staffingCost + safeMarketing + procurementCost;
  const grossProfit = revenue - costOfGoods;
  const operatingProfit = grossProfit - operatingExpenses;
  const nextInventory = Math.max(0, business.inventory + productionUnits - unitsSold);
  const nextCash = Math.max(0, business.cash + revenue - operatingExpenses - costOfGoods);
  const nextBusiness: Business = {
    ...business,
    cash: nextCash,
    revenue: business.revenue + revenue,
    expenses: business.expenses + operatingExpenses + costOfGoods,
    inventory: nextInventory,
    reputation: clamp(business.reputation + (unitsSold === demand ? 1 : -1)),
    marketShare: clamp(business.marketShare + (unitsSold === demand ? 0.25 : -0.15)),
  };
  const nextEmployees = employees.map((employee) => ({
    ...employee,
    morale: clamp(employee.morale + (unitsSold === demand ? 1 : -2)),
  }));

  return {
    business: nextBusiness,
    employees: nextEmployees,
    financials: {
      day: business.day,
      revenue,
      grossProfit,
      operatingProfit,
      cash: nextCash,
      inventory: nextInventory,
      customerCount: business.customers.length,
    },
    log: [
      `Day ${business.day}: sold ${unitsSold}/${demand} demanded units for ₹${revenue.toLocaleString("en-IN")}.`,
      `Operations: produced ${productionUnits}, procured ${procurementUnits}, marketing ₹${safeMarketing.toLocaleString("en-IN")}.`,
      `Financial result: gross profit ₹${grossProfit.toLocaleString("en-IN")}; operating profit ₹${operatingProfit.toLocaleString("en-IN")}.`,
    ],
  };
}
