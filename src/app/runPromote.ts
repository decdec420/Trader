import { config } from "../config/env.js";
import { StrategyRegistry } from "../learning/StrategyRegistry.js";
import { logger } from "../utils/logger.js";

export async function runPromote(version?: string): Promise<void> {
  const registry = new StrategyRegistry(config.DATA_DIR);
  const target = version ?? config.APPROVED_STRATEGY_VERSION;
  if (!target) throw new Error("No version supplied for promotion.");

  const existing = registry.get(target);
  if (!existing) throw new Error(`Strategy not found: ${target}`);

  let promoted = existing;
  if (existing.stage === "seeded") {
    promoted = registry.transition(target, "candidate");
    promoted = registry.transition(promoted.version, "approved");
  } else if (existing.stage === "candidate") {
    promoted = registry.transition(target, "approved");
  } else if (existing.stage === "approved") {
    promoted = existing;
  } else {
    throw new Error(`Cannot promote strategy from stage ${existing.stage}`);
  }

  logger.info({ promoted }, "strategy.promoted_to_approved");
}
