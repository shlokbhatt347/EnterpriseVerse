import { describe, expect, it } from "vitest";
import {
  advanceLivingWorld,
  createLivingWorldState,
  getRelationshipTrend,
  updateLivingWorldActor,
} from "./living-world";

const actor = {
  id: "customer-1",
  kind: "customer" as const,
  name: "Customer One",
  relationship: 50,
  trust: 50,
  activity: 80,
  lastInteractionDay: 1,
};

describe("living world", () => {
  it("creates a bounded deterministic world", () => {
    const state = createLivingWorldState(1, [actor]);
    expect(state.day).toBe(1);
    expect(state.marketPressure).toBe(50);
    expect(state.actors).toHaveLength(1);
  });

  it("clamps relationship, trust and activity changes", () => {
    const updated = updateLivingWorldActor(actor, 2, 100, -100, 100);
    expect(updated.relationship).toBe(100);
    expect(updated.trust).toBe(0);
    expect(updated.activity).toBe(100);
    expect(updated.lastInteractionDay).toBe(2);
  });

  it("classifies relationship trend", () => {
    expect(getRelationshipTrend({ ...actor, relationship: 80 })).toBe("improving");
    expect(getRelationshipTrend(actor)).toBe("stable");
    expect(getRelationshipTrend({ ...actor, relationship: 20 })).toBe("declining");
  });

  it("advances without mutating the input", () => {
    const state = createLivingWorldState(1, [actor]);
    const next = advanceLivingWorld(state, 15);
    expect(next.day).toBe(15);
    expect(next).not.toBe(state);
    expect(state.day).toBe(1);
    expect(next.actors[0].activity).toBeLessThanOrEqual(actor.activity);
  });

  it("ignores backwards time", () => {
    const state = createLivingWorldState(10, [actor]);
    expect(advanceLivingWorld(state, 9)).toBe(state);
  });
});
