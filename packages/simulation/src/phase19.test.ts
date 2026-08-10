import { describe, expect, it } from "vitest";
import { generatePersonalities19 } from "./phase19";

describe("phase19", () => {
  it("generates deterministic personalities", () => {
    expect(generatePersonalities19(42, 100)).toEqual(generatePersonalities19(42, 100));
  });
});
