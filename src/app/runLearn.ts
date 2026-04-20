import { join } from "node:path";
import { config } from "../config/env.js";
import { LearningManager } from "../learning/LearningManager.js";
import { StrategyRegistry } from "../learning/StrategyRegistry.js";
import { defaultStrategy } from "./defaultStrategy.js";
import { logger } from "../utils/logger.js";

export async function runLearn(): Promise<void> {
  const lm = new LearningManager(join(config.DATA_DIR, "learning-experiments.ndjson"));
  const registry = new StrategyRegistry(config.DATA_DIR);

  const baseVersion = "v1";
  if (!registry.get(baseVersion)) {
    registry.save({
      version: baseVersion,
      params: defaultStrategy,
      stage: "approved",
      createdAt: new Date().toISOString(),
      notes: "initial strategy"
    });
  }

  const changed = lm.proposeVariant(defaultStrategy);
  const candidateVersion = `v1-${Date.now()}`;
  const metrics = { trades: 20, winRate: 0.55, expectancy: 0.02, maxDrawdownUsd: 0.8 };

  const result = lm.evaluate(baseVersion, candidateVersion, changed, metrics);
  if (result.recommendation === "candidate") {
    registry.save({
      version: candidateVersion,
      params: { ...defaultStrategy, ...changed },
      stage: "candidate",
      createdAt: new Date().toISOString(),
      notes: `auto-generated from ${baseVersion}`
    });
  }

  logger.info({ result }, "learning.completed");
}
