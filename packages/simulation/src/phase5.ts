import type {
  FinancialSnapshot,
  Phase5Board,
  Phase5Contract,
  Phase5ESG,
  Phase5FinancingRecord,
  Phase5FundingRound,
  Phase5Investor,
  Phase5InvestorType,
  Phase5Partnership,
  Phase5Regulation,
  Phase5RiskLevel,
  Phase5RiskRegister,
  Phase5State,
  SimulationState,
} from "@enterpriseverse/types";

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};
const money = (value: number) => Math.max(0, Math.round(value));

const ROUND_ORDER: Phase5FundingRound[] = ["bootstrapped", "pre_seed", "seed", "series_a", "series_b", "growth"];
const ROUND_MIN_LEVEL: Record<Phase5FundingRound, number> = {
  bootstrapped: 1,
  pre_seed: 1,
  seed: 2,
  series_a: 4,
  series_b: 6,
  growth: 8,
};
const ROUND_NAME: Record<Phase5FundingRound, string> = {
  bootstrapped: "Bootstrapped",
  pre_seed: "Pre-seed",
  seed: "Seed",
  series_a: "Series A",
  series_b: "Series B",
  growth: "Growth",
};
const INVESTOR_PROFILE: Record<Phase5InvestorType, { targetReturn: number; equity: number; board: boolean }> = {
  angel: { targetReturn: 2.5, equity: 8, board: false },
  venture_capital: { targetReturn: 3.5, equity: 12, board: true },
  private_equity: { targetReturn: 2.2, equity: 18, board: true },
  strategic: { targetReturn: 2.8, equity: 10, board: false },
};

export interface Phase5FinancingInput {
  type: "equity" | "debt";
  amount: number;
  investorType?: Phase5InvestorType;
  investorName?: string;
  interestRate?: number;
  termDays?: number;
}

export interface Phase5FinancingPreview {
  allowed: boolean;
  reason: string;
  round: Phase5FundingRound;
  amount: number;
  preMoneyValuation: number;
  postMoneyValuation: number;
  dilutionPercent: number;
  ownershipFounderAfter: number;
  debtAfter: number;
  annualInterestCost: number;
  projectedRisk: Phase5RiskRegister;
}

export interface Phase5AcquisitionInput {
  targetName: string;
  purchasePrice: number;
  targetRevenue: number;
  targetMarketShare: number;
  synergyScore: number;
  dueDiligenceScore: number;
  financingType: "cash" | "debt";
}

export interface Phase5AcquisitionPreview {
  allowed: boolean;
  reason: string;
  purchasePrice: number;
  financingNeed: number;
  projectedRevenueGain: number;
  projectedMarketShareGain: number;
  projectedRisk: Phase5RiskRegister;
}

export interface Phase5StrategySnapshot {
  round: Phase5FundingRound;
  roundLabel: string;
  valuation: number;
  founderOwnership: number;
  investorOwnership: number;
  debt: number;
  cash: number;
  runwayDays: number;
  annualInterestCost: number;
  risk: Phase5RiskRegister;
  esg: Phase5ESG;
  regulation: Phase5Regulation;
  board: Phase5Board;
  activeContracts: number;
  partnerships: number;
  financingCount: number;
  acquisitions: number;
}

function businessLevel(state: SimulationState): number {
  const financials = state.financials;
  const revenue = Math.max(0, financials?.revenue ?? state.business.revenue);
  const valuation = Math.max(0, financials?.valuation ?? 0);
  const days = state.business.day;
  const score = revenue / 15_000 + valuation / 150_000 + days / 40 + state.business.marketShare * 1.4;
  return Math.max(1, Math.min(10, Math.floor(score / 2) + 1));
}

export function calculatePhase5Valuation(state: SimulationState): number {
  const financials = state.financials;
  const revenue = Math.max(0, financials?.revenue ?? state.business.revenue);
  const profit = financials?.netProfit ?? (state.business.revenue - state.business.expenses);
  const growth = state.market?.trend === "growing" ? 1.2 : state.market?.trend === "declining" ? 0.8 : 1;
  const reputation = 0.7 + clamp(state.business.reputation) / 200;
  const market = 0.85 + clamp(state.business.marketShare) / 100;
  const profitMultiple = profit > 0 ? 6 : 2.5;
  const revenueBase = Math.max(50_000, revenue * 2.2);
  const profitBase = Math.max(25_000, Math.max(0, profit) * profitMultiple);
  const debtPenalty = Math.max(0, state.phase5?.debt ?? state.operations?.debt ?? 0) * 0.35;
  return money((revenueBase * 0.6 + profitBase * 0.4) * growth * reputation * market - debtPenalty);
}

function calculateRisk(state: SimulationState, overrides?: Partial<Phase5State>): Phase5RiskRegister {
  const strategy = state.phase5;
  const debt = Math.max(0, overrides?.debt ?? strategy?.debt ?? state.operations?.debt ?? 0);
  const valuation = Math.max(1, overrides?.valuation ?? strategy?.valuation ?? calculatePhase5Valuation(state));
  const liquidityRisk = clamp(Math.max(0, 30 - (state.financials?.runwayDays ?? 0)) * 2.5);
  const leverageRisk = clamp((debt / valuation) * 220);
  const concentrationRisk = state.business.suppliers.length <= 1 ? 35 : state.business.suppliers.length === 2 ? 18 : 8;
  const operationalRisk = clamp(35 - (state.workforce?.productivityIndex ?? 65) * 0.2 + (state.economy?.supplyChain?.stockoutDays ?? 0) * 8);
  const complianceScore = overrides?.regulation?.complianceScore ?? strategy?.regulation.complianceScore ?? 90;
  const regulatoryRisk = clamp(100 - complianceScore + (overrides?.regulation?.unresolvedIssues ?? strategy?.regulation.unresolvedIssues ?? 0) * 7);
  const reputationRisk = clamp(100 - clamp(state.business.reputation));
  const overall = round(liquidityRisk * 0.25 + leverageRisk * 0.2 + concentrationRisk * 0.1 + operationalRisk * 0.15 + regulatoryRisk * 0.15 + reputationRisk * 0.15);
  const level: Phase5RiskLevel = overall >= 70 ? "critical" : overall >= 50 ? "high" : overall >= 30 ? "moderate" : "low";
  return { liquidity: round(liquidityRisk), leverage: round(leverageRisk), concentration: round(concentrationRisk), operational: round(operationalRisk), regulatory: round(regulatoryRisk), reputation: round(reputationRisk), overall, level };
}

export function createDefaultPhase5State(state: SimulationState): Phase5State {
  const valuation = calculatePhase5Valuation(state);
  const founderName = state.business.founders[0]?.name ?? "Founder";
  const board: Phase5Board = { seats: 3, occupiedSeats: 1, approvalThresholdPercent: 66.7, members: [{ name: founderName, role: "founder", votingPower: 100 }] };
  const regulation: Phase5Regulation = { complianceScore: 92, licenceCount: 1, unresolvedIssues: 0, jurisdiction: "India" };
  const esg: Phase5ESG = { environmental: 62, social: 68, governance: 72, sustainabilityScore: 67 };
  const base: Phase5State = {
    fundingRound: "bootstrapped",
    valuation,
    ownershipFounderPercent: 100,
    debt: Math.max(0, state.operations?.debt ?? 0),
    financingHistory: [],
    investors: [],
    board,
    contracts: [],
    partnerships: [],
    acquisitions: [],
    risks: { liquidity: 0, leverage: 0, concentration: 0, operational: 0, regulatory: 8, reputation: 100 - clamp(state.business.reputation), overall: 22, level: "low" },
    esg,
    regulation,
  };
  return { ...base, risks: calculateRisk(state, base) };
}

export function ensurePhase5State(state: SimulationState): Phase5State {
  return state.phase5 ?? createDefaultPhase5State(state);
}

export function getPhase5RoundForLevel(level: number): Phase5FundingRound {
  return [...ROUND_ORDER].reverse().find((round) => level >= ROUND_MIN_LEVEL[round]) ?? "bootstrapped";
}

function roundAtLeast(current: Phase5FundingRound, eligible: Phase5FundingRound): Phase5FundingRound {
  return ROUND_ORDER[Math.max(ROUND_ORDER.indexOf(current), ROUND_ORDER.indexOf(eligible))];
}

export function previewPhase5Financing(state: SimulationState, input: Phase5FinancingInput): Phase5FinancingPreview {
  const phase5 = ensurePhase5State(state);
  const amount = money(input.amount);
  const level = businessLevel(state);
  const eligibleRound = getPhase5RoundForLevel(level);
  const effectiveRound = roundAtLeast(phase5.fundingRound, eligibleRound);
  const preMoney = Math.max(50_000, phase5.valuation);
  const investorProfile = input.investorType ? INVESTOR_PROFILE[input.investorType] : INVESTOR_PROFILE.angel;
  const dilution = input.type === "equity" ? clamp(Math.max(2, investorProfile.equity * Math.min(1.4, amount / Math.max(1, preMoney / 4))), 2, 30) : 0;
  const postMoney = preMoney + amount;
  const ownershipFounderAfter = round(phase5.ownershipFounderPercent * (1 - dilution / 100));
  const debtAfter = phase5.debt + (input.type === "debt" ? amount : 0);
  const interestRate = input.type === "debt" ? clamp(input.interestRate ?? 10, 3, 28) : 0;
  const annualInterestCost = round(debtAfter * (interestRate / 100));
  const projectedRisk = calculateRisk(state, { ...phase5, debt: debtAfter, valuation: postMoney });
  const allowedAmount = amount > 0 && amount <= Math.max(100_000, state.business.cash * 8 + preMoney * 0.45);
  const ownershipAllowed = input.type !== "equity" || ownershipFounderAfter >= 55;
  const allowed = allowedAmount && ownershipAllowed;
  const reason = !allowed
    ? ownershipFounderAfter < 55
      ? "This financing would reduce founder ownership below the 55% control floor."
      : "The financing request is outside a safe capital range for the current enterprise size."
    : projectedRisk.level === "critical"
      ? "Funding is technically possible, but the projected risk is critical."
      : "Financing is structurally feasible.";
  return { allowed, reason, round: effectiveRound, amount, preMoneyValuation: preMoney, postMoneyValuation: postMoney, dilutionPercent: dilution, ownershipFounderAfter, debtAfter, annualInterestCost, projectedRisk };
}

export function applyPhase5Financing(state: SimulationState, input: Phase5FinancingInput): SimulationState {
  const phase5 = ensurePhase5State(state);
  const preview = previewPhase5Financing(state, input);
  if (!preview.allowed) throw new Error(preview.reason);
  const day = state.business.day;
  const investorType = input.investorType ?? "angel";
  const investorProfile = INVESTOR_PROFILE[investorType];
  const investorId = input.type === "equity" ? `investor-${day}-${phase5.investors.length + 1}` : undefined;
  const newInvestor: Phase5Investor | null = investorId
    ? { id: investorId, name: input.investorName?.trim() || `${investorType.replaceAll("_", " ")} Capital`, type: investorType, committedCapital: preview.amount, ownershipPercent: preview.dilutionPercent, targetReturn: investorProfile.targetReturn, boardSeat: investorProfile.board }
    : null;
  const record: Phase5FinancingRecord = {
    id: `fin-${day}-${phase5.financingHistory.length + 1}`,
    day,
    type: input.type,
    amount: preview.amount,
    preMoneyValuation: preview.preMoneyValuation,
    postMoneyValuation: preview.postMoneyValuation,
    dilutionPercent: preview.dilutionPercent,
    investorId,
    interestRate: input.type === "debt" ? clamp(input.interestRate ?? 10, 3, 28) : undefined,
    termDays: input.type === "debt" ? Math.round(clamp(input.termDays ?? 365, 90, 1825)) : undefined,
  };
  const boardMembers = newInvestor?.boardSeat
    ? [...phase5.board.members, { name: newInvestor.name, role: "investor" as const, votingPower: 10 }]
    : phase5.board.members;
  const nextPhase5: Phase5State = {
    ...phase5,
    fundingRound: preview.round,
    valuation: preview.postMoneyValuation,
    ownershipFounderPercent: preview.ownershipFounderAfter,
    debt: preview.debtAfter,
    financingHistory: [...phase5.financingHistory, record],
    investors: newInvestor ? [...phase5.investors, newInvestor] : phase5.investors,
    board: { ...phase5.board, occupiedSeats: Math.min(phase5.board.seats, boardMembers.length), members: boardMembers },
    lastTransaction: `${input.type}_financing`,
  };
  const cash = state.business.cash + preview.amount;
  const nextBusiness = { ...state.business, cash };
  const nextOperations = input.type === "debt" && state.operations ? { ...state.operations, debt: preview.debtAfter } : state.operations;
  const nextFinancials: FinancialSnapshot | undefined = state.financials ? { ...state.financials, cash, debt: preview.debtAfter, valuation: preview.postMoneyValuation } : undefined;
  const intermediate: SimulationState = { ...state, business: nextBusiness, operations: nextOperations, financials: nextFinancials, phase5: nextPhase5 };
  return { ...intermediate, phase5: { ...nextPhase5, risks: calculateRisk(intermediate, nextPhase5) }, log: [...state.log, `Day ${day}: ${input.type === "equity" ? "raised" : "borrowed"} ₹${preview.amount.toLocaleString("en-IN")}; valuation ₹${preview.postMoneyValuation.toLocaleString("en-IN")}; founder ownership ${preview.ownershipFounderAfter.toFixed(1)}%.`] };
}

export function previewPhase5Acquisition(state: SimulationState, input: Phase5AcquisitionInput): Phase5AcquisitionPreview {
  const phase5 = ensurePhase5State(state);
  const level = businessLevel(state);
  const price = money(input.purchasePrice);
  const financingNeed = input.financingType === "cash" ? Math.max(0, price - state.business.cash) : 0;
  const projectedRevenueGain = money(input.targetRevenue * (0.55 + clamp(input.synergyScore) / 500));
  const projectedMarketShareGain = round(input.targetMarketShare * (0.5 + clamp(input.synergyScore) / 200));
  const projectedValuation = phase5.valuation + price * 0.35;
  const projectedRisk = calculateRisk(state, { ...phase5, debt: phase5.debt + (input.financingType === "debt" ? financingNeed : 0), valuation: projectedValuation });
  const allowed = level >= 6 && price > 0 && input.targetRevenue >= 0 && input.targetMarketShare >= 0 && input.dueDiligenceScore >= 70 && (input.financingType === "debt" || state.business.cash >= price);
  const reason = !allowed
    ? level < 6
      ? "Acquisitions unlock at mature company scale (level 6+)."
      : input.dueDiligenceScore < 70
        ? "Due diligence must be at least 70/100 before an acquisition can close."
        : input.financingType === "cash"
          ? "The company does not have enough cash to close this acquisition."
          : "The acquisition terms are invalid."
    : projectedRisk.level === "critical"
      ? "The acquisition is possible but would create critical risk."
      : "The acquisition passes the current governance and diligence checks.";
  return { allowed, reason, purchasePrice: price, financingNeed, projectedRevenueGain, projectedMarketShareGain, projectedRisk };
}

export function applyPhase5Acquisition(state: SimulationState, input: Phase5AcquisitionInput): SimulationState {
  const preview = previewPhase5Acquisition(state, input);
  if (!preview.allowed) throw new Error(preview.reason);
  const phase5 = ensurePhase5State(state);
  const day = state.business.day;
  const newDebt = input.financingType === "debt" ? phase5.debt + preview.purchasePrice : phase5.debt;
  const cash = input.financingType === "cash" ? state.business.cash - preview.purchasePrice : state.business.cash;
  const nextBusiness = { ...state.business, cash, revenue: state.business.revenue + preview.projectedRevenueGain, marketShare: clamp(state.business.marketShare + preview.projectedMarketShareGain) };
  const acquisition = { id: `acq-${day}-${phase5.acquisitions.length + 1}`, targetName: input.targetName.trim(), day, purchasePrice: preview.purchasePrice, financingType: input.financingType, dueDiligenceScore: input.dueDiligenceScore, synergyScore: input.synergyScore, targetRevenue: input.targetRevenue, targetMarketShare: input.targetMarketShare };
  const nextPhase5 = { ...phase5, debt: newDebt, acquisitions: [...phase5.acquisitions, acquisition], valuation: calculatePhase5Valuation({ ...state, business: nextBusiness }), lastTransaction: "acquisition_completed" };
  const nextOperations = input.financingType === "debt" && state.operations ? { ...state.operations, debt: newDebt } : state.operations;
  const nextFinancials = state.financials ? { ...state.financials, cash, debt: newDebt, valuation: nextPhase5.valuation } : undefined;
  const intermediate: SimulationState = { ...state, business: nextBusiness, operations: nextOperations, financials: nextFinancials, phase5: nextPhase5 };
  return { ...intermediate, phase5: { ...nextPhase5, risks: calculateRisk(intermediate, nextPhase5) }, log: [...state.log, `Day ${day}: acquired ${input.targetName.trim()} for ₹${preview.purchasePrice.toLocaleString("en-IN")}. Revenue contribution ₹${preview.projectedRevenueGain.toLocaleString("en-IN")}; market share +${preview.projectedMarketShareGain.toFixed(2)}.`] };
}

export function addPhase5Contract(state: SimulationState, contract: Omit<Phase5Contract, "id" | "startDay" | "status">): SimulationState {
  if (contract.value < 0 || contract.termDays <= 0 || contract.penaltyPercent < 0 || contract.penaltyPercent > 100) throw new Error("Contract terms are invalid.");
  const phase5 = ensurePhase5State(state);
  const next: Phase5Contract = { ...contract, id: `contract-${state.business.day}-${phase5.contracts.length + 1}`, startDay: state.business.day, status: "active" };
  const nextPhase5 = { ...phase5, contracts: [...phase5.contracts, next], lastTransaction: "contract_created" };
  return { ...state, phase5: { ...nextPhase5, risks: calculateRisk(state, nextPhase5) }, log: [...state.log, `Day ${state.business.day}: contract activated with ${contract.counterparty}.`] };
}

export function addPhase5Partnership(state: SimulationState, partnership: Omit<Phase5Partnership, "id" | "startDay">): SimulationState {
  if (partnership.annualValue < 0 || partnership.termDays <= 0 || partnership.strategicValue < 0 || partnership.strategicValue > 100) throw new Error("Partnership terms are invalid.");
  if (partnership.exclusivity && ensurePhase5State(state).partnerships.some((item) => item.exclusivity)) throw new Error("An exclusive strategic partnership is already active.");
  const phase5 = ensurePhase5State(state);
  const next: Phase5Partnership = { ...partnership, id: `partner-${state.business.day}-${phase5.partnerships.length + 1}`, startDay: state.business.day };
  const nextPhase5 = { ...phase5, partnerships: [...phase5.partnerships, next], lastTransaction: "partnership_created" };
  const nextMarket = state.market ? { ...state.market, strategyScore: clamp(state.market.strategyScore + partnership.strategicValue * 0.05) } : state.market;
  return { ...state, market: nextMarket, phase5: { ...nextPhase5, risks: calculateRisk(state, nextPhase5) }, log: [...state.log, `Day ${state.business.day}: strategic partnership formed with ${partnership.partner}.`] };
}

export function setPhase5ESG(state: SimulationState, esg: Phase5ESG): SimulationState {
  const normalized: Phase5ESG = { environmental: clamp(esg.environmental), social: clamp(esg.social), governance: clamp(esg.governance), sustainabilityScore: round((clamp(esg.environmental) + clamp(esg.social) + clamp(esg.governance)) / 3) };
  const phase5 = ensurePhase5State(state);
  const nextPhase5 = { ...phase5, esg: normalized, lastTransaction: "esg_updated" };
  return { ...state, phase5: { ...nextPhase5, risks: calculateRisk(state, nextPhase5) }, log: [...state.log, `Day ${state.business.day}: ESG profile updated.`] };
}

export function setPhase5Regulation(state: SimulationState, regulation: Phase5Regulation): SimulationState {
  const normalized: Phase5Regulation = { complianceScore: clamp(regulation.complianceScore), licenceCount: Math.max(0, Math.round(regulation.licenceCount)), unresolvedIssues: Math.max(0, Math.round(regulation.unresolvedIssues)), jurisdiction: regulation.jurisdiction.trim() || "India" };
  const phase5 = ensurePhase5State(state);
  const nextPhase5 = { ...phase5, regulation: normalized, lastTransaction: "regulation_updated" };
  return { ...state, phase5: { ...nextPhase5, risks: calculateRisk(state, nextPhase5) }, log: [...state.log, `Day ${state.business.day}: regulatory profile updated.`] };
}

export function calculatePhase5Snapshot(state: SimulationState): Phase5StrategySnapshot {
  const phase5 = ensurePhase5State(state);
  const annualInterestCost = phase5.financingHistory.filter((record) => record.type === "debt").reduce((sum, record) => sum + (record.amount * (record.interestRate ?? 0)) / 100, 0);
  return { round: phase5.fundingRound, roundLabel: ROUND_NAME[phase5.fundingRound], valuation: phase5.valuation, founderOwnership: phase5.ownershipFounderPercent, investorOwnership: round(100 - phase5.ownershipFounderPercent), debt: phase5.debt, cash: state.business.cash, runwayDays: state.financials?.runwayDays ?? 0, annualInterestCost: round(annualInterestCost), risk: phase5.risks, esg: phase5.esg, regulation: phase5.regulation, board: phase5.board, activeContracts: phase5.contracts.filter((contract) => contract.status === "active").length, partnerships: phase5.partnerships.length, financingCount: phase5.financingHistory.length, acquisitions: phase5.acquisitions.length };
}

export function advancePhase5Day(state: SimulationState): SimulationState {
  const phase5 = ensurePhase5State(state);
  const day = state.business.day;
  const regulationPenalty = phase5.regulation.unresolvedIssues * 1.5;
  const interest = phase5.financingHistory.filter((record) => record.type === "debt" && typeof record.interestRate === "number").reduce((sum, record) => sum + (record.amount * (record.interestRate ?? 0)) / 36500, 0);
  const contracts = phase5.contracts.map((contract) => contract.status === "active" && day - contract.startDay >= contract.termDays - 14 ? { ...contract, status: "expiring" as const } : contract);
  const cash = Math.max(0, state.business.cash - interest - regulationPenalty);
  const nextBusiness = { ...state.business, cash, reputation: clamp(state.business.reputation - regulationPenalty * 0.05) };
  const nextPhase5: Phase5State = { ...phase5, contracts, valuation: calculatePhase5Valuation({ ...state, business: nextBusiness }), lastTransaction: interest > 0 ? "daily_finance_accrual" : phase5.lastTransaction };
  const nextFinancials = state.financials ? { ...state.financials, cash, debt: nextPhase5.debt, valuation: nextPhase5.valuation } : undefined;
  const intermediate: SimulationState = { ...state, business: nextBusiness, financials: nextFinancials, phase5: nextPhase5 };
  return { ...intermediate, phase5: { ...nextPhase5, risks: calculateRisk(intermediate, nextPhase5) }, log: interest > 0 ? [...state.log, `Day ${day}: financing costs ₹${Math.round(interest).toLocaleString("en-IN")} accrued.`] : state.log };
}
