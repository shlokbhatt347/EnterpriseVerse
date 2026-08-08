import type { OperationsState, SimulationState } from "@enterpriseverse/types";

export type BusinessAction =
  | { type: "set_price"; price: number }
  | { type: "marketing"; budget: number }
  | { type: "improve_quality"; investment: number }
  | { type: "restock"; units: number }
  | { type: "hire"; employees: number }
  | { type: "loan"; amount: number }
  | { type: "repay_loan"; amount: number };

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const money = (value: number) => Math.max(0, Math.round(value));

export function defaultOperations(): OperationsState {
  return {
    price: 120,
    quality: 50,
    marketingBudget: 0,
    productionCapacity: 20,
    employees: 1,
    supplierUnitCost: 60,
    brandAwareness: 10,
    customerSatisfaction: 60,
    debt: 0,
  };
}

export function applyBusinessAction(state: SimulationState, action: BusinessAction): SimulationState {
  const current = state.operations ?? defaultOperations();
  const business = state.business;
  let operations = { ...current };
  let nextBusiness = { ...business };
  let message = "";

  switch (action.type) {
    case "set_price": {
      const price = money(action.price);
      if (price < 20 || price > 2_000) throw new Error("Price must be between ₹20 and ₹2,000.");
      operations.price = price;
      message = `Set the selling price to ₹${price}.`;
      break;
    }
    case "marketing": {
      const budget = money(action.budget);
      if (budget > business.cash) throw new Error("Marketing budget exceeds available cash.");
      nextBusiness.cash -= budget;
      nextBusiness.expenses += budget;
      operations.marketingBudget = budget;
      operations.brandAwareness = clamp(operations.brandAwareness + budget / 100);
      message = `Invested ₹${budget.toLocaleString("en-IN")} in marketing.`;
      break;
    }
    case "improve_quality": {
      const investment = money(action.investment);
      if (investment > business.cash) throw new Error("Quality investment exceeds available cash.");
      nextBusiness.cash -= investment;
      nextBusiness.expenses += investment;
      operations.quality = clamp(operations.quality + investment / 250);
      operations.customerSatisfaction = clamp(operations.customerSatisfaction + investment / 400);
      message = `Invested ₹${investment.toLocaleString("en-IN")} into product/service quality.`;
      break;
    }
    case "restock": {
      const units = Math.floor(action.units);
      if (units < 1) throw new Error("Restock quantity must be positive.");
      const cost = units * operations.supplierUnitCost;
      if (cost > business.cash) throw new Error("Restock cost exceeds available cash.");
      nextBusiness.cash -= cost;
      nextBusiness.inventory += units;
      nextBusiness.expenses += cost;
      message = `Purchased ${units} units of inventory for ₹${cost.toLocaleString("en-IN")}.`;
      break;
    }
    case "hire": {
      const employees = Math.floor(action.employees);
      if (employees < 1 || employees > 20) throw new Error("Hire between 1 and 20 employees at a time.");
      const hiringCost = employees * 1_500;
      if (hiringCost > business.cash) throw new Error("Hiring cost exceeds available cash.");
      nextBusiness.cash -= hiringCost;
      nextBusiness.expenses += hiringCost;
      operations.employees += employees;
      operations.productionCapacity += employees * 8;
      message = `Hired ${employees} employee${employees === 1 ? "" : "s"}, increasing operating capacity.`;
      break;
    }
    case "loan": {
      const amount = money(action.amount);
      if (amount < 1_000 || amount > 100_000) throw new Error("Loan must be between ₹1,000 and ₹100,000.");
      nextBusiness.cash += amount;
      operations.debt += amount;
      message = `Borrowed ₹${amount.toLocaleString("en-IN")}. Debt now stands at ₹${operations.debt.toLocaleString("en-IN")}.`;
      break;
    }
    case "repay_loan": {
      const amount = Math.min(money(action.amount), operations.debt, business.cash);
      if (amount <= 0) throw new Error("There is no available loan balance to repay.");
      nextBusiness.cash -= amount;
      operations.debt -= amount;
      message = `Repaid ₹${amount.toLocaleString("en-IN")} of debt.`;
      break;
    }
  }

  return {
    ...state,
    business: nextBusiness,
    operations,
    log: [...state.log, `Day ${business.day}: ${message}`],
  };
}

export function calculateKpis(state: SimulationState) {
  const operations = state.operations ?? defaultOperations();
  const profit = state.business.revenue - state.business.expenses;
  const grossMargin = state.business.revenue === 0 ? 0 : (profit / state.business.revenue) * 100;
  const cashRunwayDays = operations.employees + 1 === 0 ? 0 : Math.floor(state.business.cash / Math.max(1, 450 + operations.employees * 150));

  return {
    profit: Math.round(profit),
    grossMargin: Math.round(grossMargin * 10) / 10,
    cashRunwayDays,
    debt: operations.debt,
    price: operations.price,
    quality: Math.round(operations.quality),
    brandAwareness: Math.round(operations.brandAwareness),
    customerSatisfaction: Math.round(operations.customerSatisfaction),
    productionCapacity: operations.productionCapacity,
    employees: operations.employees,
  };
}
