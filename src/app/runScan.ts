import { config } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { createBroker } from "../broker/createBroker.js";
import { CandleLoader } from "../market/CandleLoader.js";
import { classifyRegime } from "../strategy/regime.js";
import { SignalEngine } from "../strategy/SignalEngine.js";
import { RiskManager } from "../execution/RiskManager.js";
import { defaultStrategy } from "./defaultStrategy.js";
import { TradeJournal } from "../journal/TradeJournal.js";
import { join } from "node:path";

export async function runScan(mode: "paper" | "live"): Promise<void> {
  const broker = createBroker(mode);
  const loader = new CandleLoader(broker, config.STALE_CANDLE_SECONDS);
  const signalEngine = new SignalEngine();
  const risk = new RiskManager();
  const journal = new TradeJournal(join(config.DATA_DIR, "trade-journal.ndjson"));

  logger.info({ mode }, "scan.start");
  const candles = await loader.load5m("BTC-USD", 60);
  const regime = classifyRegime(candles, defaultStrategy.maLength, defaultStrategy.volatilityMaxPct);
  const signal = signalEngine.evaluate(candles, defaultStrategy);

  if (regime !== "trend" || signal.action === "none") {
    journal.decision({ decision: "skip", regime, reason: signal.reason });
    logger.info({ regime, reason: signal.reason }, "scan.skip");
    return;
  }

  const account = await broker.getAccount();
  const quote = await broker.getQuote("BTC-USD");
  const hasOpenOrder = Boolean(await broker.getOpenOrder());
  const hasOpenPosition = Boolean(await broker.getOpenPosition("BTC-USD"));

  const decision = risk.check({
    symbol: "BTC-USD",
    quote,
    account,
    hasOpenOrder,
    hasOpenPosition,
    orderUsd: 1,
    maxOrderUsd: config.MAX_ORDER_USD,
    maxDailyTrades: config.MAX_DAILY_TRADES,
    maxDailyLossUsd: config.MAX_DAILY_LOSS_USD,
    maxSpreadBps: config.MAX_SPREAD_BPS,
    minBalanceUsd: config.MIN_BALANCE_USD,
    latestCandleEndedAt: candles[candles.length - 1].endedAt,
    staleCandleSeconds: config.STALE_CANDLE_SECONDS
  });

  journal.decision({ decision: decision.allow ? "allow" : "skip", reason: decision.reason, regime });
  logger.info({ decision }, "scan.risk");
}
