import type { Business, MarketState, OperationsState } from "@enterpriseverse/types";

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const round = (value: number) => Math.round(value * 10) / 10;

export function createMarketState(): MarketState {
  return {
    demandIndex: 100,
    marketPrice: 120,
    competitorPrice: 118,
    competitorQuality: 55,
    competitorMarketShare: 48,
    trend: "stable",
    confidence: 70,
    priceElasticity: 1.1,
    customerAcquisition: 8,
    competitivePressure: 20,
    strategyScore: 50,
  };
}

export function advanceMarket(day: number, business: Business, operations: OperationsState, previous = createMarketState()): MarketState {
  const cycle = day % 12;
  const trend = cycle <= 2 ? "growing" : cycle >= 9 ? "declining" : "stable";
  const trendEffect = trend === "growing" ? 4 : trend === "declining" ? -4 : 0;
  const priceGap = operations.price - previous.competitorPrice;
  const competitorMove = priceGap > 15 ? -3 : priceGap < -15 ? 2 : 0;
  const pricePenalty = Math.max(0, priceGap) * previous.priceElasticity * 0.12;
  const qualityAdvantage = operations.quality - previous.competitorQuality;
  const brandEffect = (operations.brandAwareness - 50) * 0.08;
  const demandIndex = clamp(previous.demandIndex + trendEffect + competitorMove - pricePenalty + qualityAdvantage * 0.08 + brandEffect + (business.reputation - 50) * 0.05, 40, 160);
  const competitorPrice = clamp(previous.competitorPrice + (business.marketShare > previous.competitorMarketShare ? 2 : -1), 60, 240);
  const competitorQuality = clamp(previous.competitorQuality + (operations.quality > previous.competitorQuality ? 0.5 : -0.25));
  const relativeAttractiveness = qualityAdvantage * 0.35 - (operations.price - competitorPrice) * 0.12 + (operations.brandAwareness - 50) * 0.08 + (operations.customerSatisfaction - 50) * 0.05;
  const competitorMarketShare = clamp(previous.competitorMarketShare - relativeAttractiveness * 0.04, 20, 80);
  const competitivePressure = clamp(20 + Math.abs(operations.price - competitorPrice) * 0.8 + Math.max(0, competitorQuality - operations.quality) * 0.7 + (competitorMarketShare - 40) * 0.3);
  const customerAcquisition = clamp(5 + operations.brandAwareness * 0.12 + Math.max(0, operations.customerSatisfaction - 50) * 0.15 - competitivePressure * 0.04, 0, 30);
  const strategyScore = clamp(50 + relativeAttractiveness * 1.5 + (demandIndex - 100) * 0.15 + (business.reputation - 50) * 0.2);

  return {
    demandIndex: round(demandIndex),
    marketPrice: round(previous.marketPrice + (demandIndex - 100) * 0.08),
    competitorPrice: round(competitorPrice),
    competitorQuality: round(competitorQuality),
    competitorMarketShare: round(competitorMarketShare),
    trend,
    confidence: clamp(previous.confidence + (trend === "stable" ? 1 : -1) + (Math.abs(priceGap) < 10 ? 1 : -1)),
    priceElasticity: round(clamp(previous.priceElasticity + (trend === "declining" ? 0.02 : -0.01), 0.6, 1.8)),
    customerAcquisition: round(customerAcquisition),
    competitivePressure: round(competitivePressure),
    strategyScore: round(strategyScore),
  };
}

export function explainMarketPosition(operations: OperationsState, market: MarketState): string {
  const price = operations.price <= market.competitorPrice ? "price-competitive" : "priced above the main competitor";
  const quality = operations.quality >= market.competitorQuality ? "quality-leading" : "quality is trailing";
  const pressure = market.competitivePressure >= 60 ? "competition is intense" : market.competitivePressure >= 35 ? "competition is active" : "competition is manageable";
  return `${price}; ${quality}; demand is ${market.trend}; ${pressure}; strategy score ${Math.round(market.strategyScore)}/100.`;
}
