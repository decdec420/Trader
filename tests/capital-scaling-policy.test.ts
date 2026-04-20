import { describe, expect, it } from "vitest";
import { CapitalScalingPolicy } from "../src/risk/CapitalScalingPolicy.js";

describe("CapitalScalingPolicy", () => {
  const policy = new CapitalScalingPolicy();

  it("holds by default when sample size is insufficient", () => {
    const decision = policy.decide({
      mode: "paper",
      currentOrderUsd: 1,
      maxOrderUsd: 1,
      sampleSize: 10,
      winRate: 0.8,
      expectancy: 0.1,
      recentDrawdownUsd: 0
    });
    expect(decision.action).toBe("hold");
  });

  it("scales down on drawdown", () => {
    const decision = policy.decide({
      mode: "paper",
      currentOrderUsd: 1,
      maxOrderUsd: 1,
      sampleSize: 50,
      winRate: 0.55,
      expectancy: 0.01,
      recentDrawdownUsd: 0.9
    });
    expect(decision.action).toBe("scale_down");
    expect(decision.recommendedOrderUsd).toBeLessThanOrEqual(1);
  });

  it("never exceeds hard cap when scaling up", () => {
    const decision = policy.decide({
      mode: "paper",
      currentOrderUsd: 0.95,
      maxOrderUsd: 1,
      sampleSize: 60,
      winRate: 0.65,
      expectancy: 0.02,
      recentDrawdownUsd: 0.1
    });
    expect(decision.recommendedOrderUsd).toBeLessThanOrEqual(1);
  });
});
