export type WorldDate = {
  day: number;
  week: number;
  month: number;
};

export type MarketCondition = {
  demandMultiplier: number;
  supplierCostMultiplier: number;
  consumerConfidence: number;
  interestRate: number;
};

export type WorldEvent = {
  id: string;
  title: string;
  description: string;
  effects: Record<string, number>;
};

export type WorldState = {
  date: WorldDate;
  market: MarketCondition;
  events: WorldEvent[];
};

export type WorldTickResult = {
  state: WorldState;
  generatedEvents: WorldEvent[];
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function createWorldState(): WorldState {
  return {
    date: { day: 1, week: 1, month: 1 },
    market: {
      demandMultiplier: 1,
      supplierCostMultiplier: 1,
      consumerConfidence: 1,
      interestRate: 0.08,
    },
    events: [],
  };
}

export function advanceWorld(state: WorldState, seed = 0): WorldTickResult {
  const nextDay = state.date.day + 1;
  const nextWeek = Math.floor((nextDay - 1) / 7) + 1;
  const nextMonth = Math.floor((nextDay - 1) / 30) + 1;

  // Deterministic variation makes simulations reproducible in tests while
  // still allowing different worlds to be seeded independently.
  const wave = Math.sin((nextDay + seed) * 0.73);
  const demandMultiplier = clamp(1 + wave * 0.06, 0.85, 1.2);
  const supplierCostMultiplier = clamp(1 - wave * 0.04, 0.85, 1.25);
  const consumerConfidence = clamp(1 + wave * 0.03, 0.8, 1.2);

  const generatedEvents: WorldEvent[] = [];
  if (nextDay % 7 === 0) {
    generatedEvents.push({
      id: `weekly-market-${nextDay}`,
      title: 'Weekly market shift',
      description: 'Customer demand has changed as the new week begins.',
      effects: { demandMultiplier },
    });
  }

  const nextState: WorldState = {
    date: { day: nextDay, week: nextWeek, month: nextMonth },
    market: {
      demandMultiplier,
      supplierCostMultiplier,
      consumerConfidence,
      interestRate: clamp(state.market.interestRate - wave * 0.001, 0.02, 0.2),
    },
    events: [...state.events, ...generatedEvents].slice(-20),
  };

  return { state: nextState, generatedEvents };
}
