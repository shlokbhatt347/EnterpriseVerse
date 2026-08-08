import type { Business, MarketState, OperationsState } from "@enterpriseverse/types";

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export function createMarketState(): MarketState {
  return {
    demandIndex: 100,
    marketPrice: 120,
    competitorPrice: 118,
    competitorQuality: 55,
    competitorMarketShare: 48,
    trend: "stable",
    confidence: 70,
  };
}

export function advanceMarket(day: number, business: Business, operations: OperationsState, previous = createMarketState()): MarketState {
  const cycle = day % 12;
  const trend = cycle <= 2 ? "growing" : cycle >= 9 ? "declining" : "stable";
  const trendEffect = trend === "growing" ? 4 : trend === "declining" ? -4 : 0;
  const priceGap = operations.price - previous.competitorPrice;
  const competitorMove = priceGap > 15 ? -2 : priceGap < -15 ? 2 : 0;
  const demandIndex = clamp(previous.demandIndex + trendEffect + competitorMove + (business.reputation - 50) * 0.05, 40, 160);
  const competitorPrice = clamp(previous.competitorPrice + (business.marketShare > previous.competitorMarketShare ? 2 : -1), 60, 240);
  const competitorQuality = clamp(previous.competitorQuality + (operations.quality > previous.competitorQuality ? 0.5 : -0.25));
  const relativeAttractiveness = (operations.quality - competitorQuality) * 0.35 - (operations.price - competitorPrice) * 0.12 + (operations.brandAwareness - 50) * 0.08;
  const competitorMarketShare = clamp(previous.competitorMarketShare - relativeAttractiveness * 0.04, 20, 80);

  return {
    demandIndex: Math.round(demandIndex * 10) / 10,
    marketPrice: Math.round((previous.marketPrice + (demandIndex - 100) * 0.08) * 10) / 10,
    competitorPrice: Math.round(competitorPrice * 10) / 10,
    competitorQuality: Math.round(competitorQuality * 10) / 10,
    competitorMarketShare: Math.round(competitorMarketShare * 10) / 10,
    trend,
    confidence: clamp(previous.confidence + (trend === "stable" ? 1 : -1)),
  };
}

export function explainMarketPosition(operations: OperationsState, market: MarketState): string {
  const price = operations.price <= market.competitorPrice ? "price-competitive" : "priced above the main competitor";
  const quality = operations.quality >= market.competitorQuality ? "quality-leading" : "quality is trailing";
  return `${price}; ${quality}; demand is ${market.trend}.`;
}
