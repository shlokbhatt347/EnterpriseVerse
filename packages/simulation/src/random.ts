import { stableSeed } from "./phase1";

export type RandomStreamName = "market" | "customers" | "suppliers" | "competitors" | "investors" | "scenarios" | "consequences" | "events";

export interface RandomStreams {
  seed: number;
  for: (stream: RandomStreamName, day: number) => () => number;
}

/**
 * Creates independent deterministic streams. A random draw in one subsystem cannot
 * silently shift the sequence used by another subsystem.
 */
export function createRandomStreams(seed: number): RandomStreams {
  return {
    seed,
    for(stream, day) {
      return createSeededRandom(stableSeed(seed, stream, day));
    },
  };
}

export function createSeededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
