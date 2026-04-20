import { config } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { runScan } from "../app/runScan.js";
import { runPaper } from "../app/runPaper.js";
import { runLive } from "../app/runLive.js";
import { runLearn } from "../app/runLearn.js";
import { runResearch } from "../app/runResearch.js";
import { runPromote } from "../app/runPromote.js";
import { join } from "node:path";
import { readFileSync, existsSync } from "node:fs";

async function main(): Promise<void> {
  const cmd = process.argv[2];

  switch (cmd) {
    case "bot:status":
      logger.info({
        paperTrading: config.PAPER_TRADING,
        liveTrading: config.LIVE_TRADING,
        approvedStrategyVersion: config.APPROVED_STRATEGY_VERSION || "(none)",
        hardCaps: {
          maxOrderUsd: config.MAX_ORDER_USD,
          maxDailyTrades: config.MAX_DAILY_TRADES,
          maxDailyLossUsd: config.MAX_DAILY_LOSS_USD,
          minBalanceUsd: config.MIN_BALANCE_USD
        }
      }, "status");
      break;
    case "bot:scan":
      await runScan(config.LIVE_TRADING ? "live" : "paper");
      break;
    case "bot:research":
      await runResearch();
      break;
    case "bot:paper":
      await runPaper();
      break;
    case "bot:learn":
      await runLearn();
      break;
    case "bot:live":
      await runLive();
      break;
    case "bot:journal": {
      const file = join(config.DATA_DIR, "trade-journal.ndjson");
      if (!existsSync(file)) {
        logger.info("No trade journal file yet.");
        break;
      }
      const lines = readFileSync(file, "utf8").trim().split("\n").slice(-20);
      for (const line of lines) console.log(line);
      break;
    }
    case "bot:promote":
      await runPromote(process.argv[3]);
      break;
    default:
      throw new Error(`Unknown command: ${cmd}`);
  }
}

main().catch((err) => {
  logger.error({ err }, "cli.failed_safe_exit");
  process.exit(1);
});
