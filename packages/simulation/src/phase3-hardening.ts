export const PHASE_3_HARDENING = {
  deterministic: true,
  bounded: true,
  causal: true,
  explainable: true,
  backwardCompatible: true,
} as const;

export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function boundedRate(value: number, maxAbs = 1): number {
  return clamp(value, -maxAbs, maxAbs);
}

export function safePositive(value: number, fallback = 0): number {
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}
