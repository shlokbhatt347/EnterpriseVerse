import type { Business, Employee, EmployeeRole, OperationsState, WorkforceState } from "@enterpriseverse/types";

const roles: EmployeeRole[] = ["operations", "sales", "marketing", "finance", "product", "generalist"];
const clamp = (v: number) => Math.max(0, Math.min(100, v));

export function createWorkforce(day = 1): WorkforceState {
  return { employees: [], hiringBudget: 5_000, trainingBudget: 2_000, turnoverRisk: 0, productivityIndex: 0, moraleIndex: 0, payroll: 0 };
}

export function hireEmployee(state: WorkforceState, name: string, role: EmployeeRole, day: number, salary = 300): WorkforceState {
  if (!name.trim() || !roles.includes(role) || state.hiringBudget < salary) return state;
  const employee: Employee = { id: `employee-${state.employees.length + 1}-d${day}`, name: name.trim(), role, salary, skill: 50, morale: 70, productivity: 60, loyalty: 50, workload: 50, employedDay: day };
  return recalculate({ ...state, employees: [...state.employees, employee], hiringBudget: state.hiringBudget - salary });
}

export function trainEmployee(state: WorkforceState, employeeId: string, day: number, cost = 250): WorkforceState {
  if (state.trainingBudget < cost) return state;
  const employees = state.employees.map((e) => e.id === employeeId ? { ...e, skill: clamp(e.skill + 8), productivity: clamp(e.productivity + 6), morale: clamp(e.morale + 2) } : e);
  return recalculate({ ...state, employees, trainingBudget: state.trainingBudget - cost });
}

export function advanceWorkforce(state: WorkforceState, operations: OperationsState, business: Business): WorkforceState {
  const employees = state.employees.map((employee) => {
    const workload = clamp(operations.productionCapacity > 0 ? 45 + operations.employees * 3 : 70);
    const moraleDelta = workload > 75 ? -3 : workload < 35 ? -1 : 1;
    const productivity = clamp(employee.productivity + (employee.skill - 50) * 0.04 + (employee.morale - 50) * 0.03 - Math.max(0, workload - 70) * 0.05);
    return { ...employee, workload, morale: clamp(employee.morale + moraleDelta), productivity };
  });
  const payroll = employees.reduce((sum, employee) => sum + employee.salary, 0);
  const moraleIndex = employees.length ? employees.reduce((sum, e) => sum + e.morale, 0) / employees.length : 0;
  const productivityIndex = employees.length ? employees.reduce((sum, e) => sum + e.productivity, 0) / employees.length : 0;
  const turnoverRisk = employees.length ? clamp(employees.reduce((sum, e) => sum + Math.max(0, e.workload - 70) + Math.max(0, 55 - e.morale), 0) / employees.length) : 0;
  return { ...state, employees, payroll, moraleIndex, productivityIndex, turnoverRisk };
}

function recalculate(state: WorkforceState): WorkforceState {
  const payroll = state.employees.reduce((sum, e) => sum + e.salary, 0);
  const moraleIndex = state.employees.length ? state.employees.reduce((sum, e) => sum + e.morale, 0) / state.employees.length : 0;
  const productivityIndex = state.employees.length ? state.employees.reduce((sum, e) => sum + e.productivity, 0) / state.employees.length : 0;
  return { ...state, payroll, moraleIndex, productivityIndex };
}
