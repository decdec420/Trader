import { assertLiveTradingAllowed, config } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { runScan } from "./runScan.js";

export async function runLive(): Promise<void> {
  try {
    assertLiveTradingAllowed(config);
    await runScan("live");
    logger.info({ strategyVersion: config.APPROVED_STRATEGY_VERSION }, "live.tick.complete");
  } catch (err) {
    logger.error({ err }, "live.blocked_or_failed_safe");
  }
}
