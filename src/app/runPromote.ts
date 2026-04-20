import { config } from "../config/env.js";
import { StrategyRegistry } from "../learning/StrategyRegistry.js";
import { logger } from "../utils/logger.js";

export async function runPromote(version?: string): Promise<void> {
  const registry = new StrategyRegistry(config.DATA_DIR);
  const target = version ?? config.APPROVED_STRATEGY_VERSION;
  if (!target) throw new Error("No version supplied for promotion.");
  const promoted = registry.promote(target, "approved");
  logger.info({ promoted }, "strategy.promoted");
}
