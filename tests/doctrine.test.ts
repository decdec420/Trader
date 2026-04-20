import { describe, expect, it } from "vitest";
import { CAPITAL_PRESERVATION_DOCTRINE, validateDoctrineInvariants } from "../src/doctrine/capital-preservation.js";

describe("capital preservation doctrine", () => {
  it("keeps live approval as required invariant", () => {
    expect(CAPITAL_PRESERVATION_DOCTRINE.principles.liveRequiresApproval).toBe(true);
  });

  it("keeps no-trade as valid decision invariant", () => {
    expect(CAPITAL_PRESERVATION_DOCTRINE.principles.noTradeIsValid).toBe(true);
  });

  it("validates doctrine invariants", () => {
    expect(() => validateDoctrineInvariants()).not.toThrow();
  });
});
