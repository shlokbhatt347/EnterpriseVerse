import { describe, expect, it } from "vitest";
import { createRng, createWorld, runLong, validateWorld } from "./business-world";

describe("Phase 3 smoke gate", () => {
  it("runs a stable 250-day seeded world", () => {
    const world = runLong(createWorld(2026, "technology"), 250, createRng(2026));
    expect(validateWorld(world)).toEqual([]);
    expect(world.day).toBe(251);
  });

  it("keeps independent seeded worlds reproducible", () => {
    const a = runLong(createWorld(11, "food"), 100, createRng(11));
    const b = runLong(createWorld(11, "food"), 100, createRng(11));
    expect(a).toEqual(b);
  });
});
