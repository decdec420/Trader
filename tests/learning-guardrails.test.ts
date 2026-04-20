import { rmSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LearningManager } from "../src/learning/LearningManager.js";

const TEST_LOG_PATH = join("tests", "tmp", "learning-guardrails.ndjson");

describe("Learning guardrails", () => {
  it("rejects weak candidates", () => {
    rmSync(TEST_LOG_PATH, { force: true });

    const lm = new LearningManager(TEST_LOG_PATH);
    const res = lm.evaluate("v1", "v1-a", { maLength: 21 }, {
      trades: 5,
      winRate: 0.4,
      expectancy: -0.01,
      maxDrawdownUsd: 1.2
    });
    expect(res.recommendation).toBe("reject");
  });

  it("accepts only controlled positive candidates", () => {
    rmSync(TEST_LOG_PATH, { force: true });

    const lm = new LearningManager(TEST_LOG_PATH);
    const res = lm.evaluate("v1", "v1-b", { maLength: 21 }, {
      trades: 20,
      winRate: 0.55,
      expectancy: 0.01,
      maxDrawdownUsd: 0.9
    });
    expect(res.recommendation).toBe("candidate");
  });
});
