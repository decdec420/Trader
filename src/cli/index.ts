import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { config } from "../config/env.js";
import { runLearn } from "../app/runLearn.js";
import { runLive } from "../app/runLive.js";
import { runPaper } from "../app/runPaper.js";
import { runPromote } from "../app/runPromote.js";
import { runResearch } from "../app/runResearch.js";
import { runScan } from "../app/runScan.js";
import { MetricsAggregator } from "../journal/MetricsAggregator.js";
import { logger } from "../utils/logger.js";
import { buildRecentPostmortemFromJournal } from "../metrics/recent-summary.js";
import { toLlmAnalystPayload } from "../analysis/llm-payloads.js";
import { CAPITAL_PRESERVATION_DOCTRINE, validateDoctrineInvariants } from "../doctrine/capital-preservation.js";
import { createApprovalPolicy } from "../approval/createApprovalPolicy.js";
import { buildDashboardSummary } from "../metrics/dashboard-summary.js";

async function main(): Promise<void> {
  const cmd = process.argv[2];
  validateDoctrineInvariants();

  switch (cmd) {
    case "bot:status":
      logger.info(
        {
          paperTrading: config.PAPER_TRADING,
          liveTrading: config.LIVE_TRADING,
          approvedStrategyVersion: config.APPROVED_STRATEGY_VERSION || "(none)",
          hardCaps: {
            maxOrderUsd: config.MAX_ORDER_USD,
            maxDailyTrades: config.MAX_DAILY_TRADES,
            maxDailyLossUsd: config.MAX_DAILY_LOSS_USD,
            minBalanceUsd: config.MIN_BALANCE_USD
          },
          doctrine: CAPITAL_PRESERVATION_DOCTRINE.doctrineVersion
        },
        "status"
      );
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

      const metrics = new MetricsAggregator().summarizeTradeJournal(file);
      const postmortem = buildRecentPostmortemFromJournal(file);
      const llmPayload = toLlmAnalystPayload(postmortem, CAPITAL_PRESERVATION_DOCTRINE);

      console.log(JSON.stringify(metrics, null, 2));
      console.log(JSON.stringify(llmPayload, null, 2));
      break;
    }
    case "bot:summary": {
      const mode = config.LIVE_TRADING ? "live" : "paper";
      const approvalPolicy = createApprovalPolicy(mode, config.LIVE_APPROVAL_TOKEN);
      const summary = buildDashboardSummary({ config, approvalPolicy, mode });
      console.log(JSON.stringify(summary, null, 2));
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
