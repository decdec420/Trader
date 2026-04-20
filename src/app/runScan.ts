import { join } from "node:path";
import { config } from "../config/env.js";
import { createBroker } from "../broker/createBroker.js";
import { RiskManager } from "../execution/RiskManager.js";
import { TradeLifecycleEngine } from "../execution/TradeLifecycleEngine.js";
import { OrderManager } from "../execution/OrderManager.js";
import { CandleLoader } from "../market/CandleLoader.js";
import { SignalEngine } from "../strategy/SignalEngine.js";
import { classifyRegime } from "../strategy/regime.js";
import { maFromCandles, realizedVolatilityPct } from "../strategy/indicators.js";
import { computeSetupScore } from "../strategy/setupScore.js";
import { TradeJournal } from "../journal/TradeJournal.js";
import { logger } from "../utils/logger.js";
import { defaultStrategy } from "./defaultStrategy.js";

export async function runScan(mode: "paper" | "live"): Promise<void> {
  const broker = createBroker(mode);
  const loader = new CandleLoader(broker, config.STALE_CANDLE_SECONDS);
  const signalEngine = new SignalEngine();
  const risk = new RiskManager();
  const orderManager = new OrderManager(broker);
  const lifecycle = new TradeLifecycleEngine();
  const journal = new TradeJournal(join(config.DATA_DIR, "trade-journal.ndjson"));

  logger.info({ mode }, "scan.start");
  const candles = await loader.load5m("BTC-USD", 60);
  const latest = candles[candles.length - 1];
  const regime = classifyRegime(candles, defaultStrategy.maLength, defaultStrategy.volatilityMaxPct);
  const signal = signalEngine.evaluate(candles, defaultStrategy);

  const openPosition = await broker.getOpenPosition("BTC-USD");
  if (openPosition) {
    const lifecycleDecision = lifecycle.evaluate(openPosition, latest, defaultStrategy.stopLossPct, defaultStrategy.takeProfitPct);
    if (lifecycleDecision.action === "exit") {
      const notional = openPosition.qty * (lifecycleDecision.limitPrice ?? latest.close);
      const exitOrder = await orderManager.placeExit("BTC-USD", lifecycleDecision.limitPrice ?? latest.close, notional);
      journal.order({
        side: "sell",
        reason: lifecycleDecision.reason,
        orderId: exitOrder.id,
        limitPrice: lifecycleDecision.limitPrice,
        notionalUsd: notional
      });
      logger.info({ lifecycleDecision, orderId: exitOrder.id }, "scan.lifecycle.exit");
    } else {
      journal.decision({ decision: "skip", regime, reason: lifecycleDecision.reason });
      logger.info({ reason: lifecycleDecision.reason }, "scan.lifecycle.hold");
    }
    return;
  }

  if (regime !== "trend" || signal.action === "none") {
    journal.decision({ decision: "skip", regime, reason: signal.reason });
    logger.info({ regime, reason: signal.reason }, "scan.skip");
    return;
  }

  const account = await broker.getAccount();
  const quote = await broker.getQuote("BTC-USD");
  const hasOpenOrder = Boolean(await broker.getOpenOrder());
  const candleVolatilityPct = realizedVolatilityPct(candles, 20);

  const decision = risk.check({
    symbol: "BTC-USD",
    quote,
    account,
    hasOpenOrder,
    hasOpenPosition: false,
    orderUsd: 1,
    maxOrderUsd: config.MAX_ORDER_USD,
    maxDailyTrades: config.MAX_DAILY_TRADES,
    maxDailyLossUsd: config.MAX_DAILY_LOSS_USD,
    maxSpreadBps: config.MAX_SPREAD_BPS,
    minBalanceUsd: config.MIN_BALANCE_USD,
    latestCandleEndedAt: latest.endedAt,
    staleCandleSeconds: config.STALE_CANDLE_SECONDS,
    candleVolatilityPct,
    maxCandleVolatilityPct: defaultStrategy.volatilityMaxPct,
    tradingWindowStartHourUtc: 6,
    tradingWindowEndHourUtc: 22
  });

  if (!decision.allow) {
    journal.decision({ decision: "skip", regime, reason: decision.reason });
    logger.info({ decision }, "scan.risk.blocked");
    return;
  }

  const ma = maFromCandles(candles, defaultStrategy.maLength);
  if (!ma) {
    journal.decision({ decision: "skip", regime, reason: signal.reason });
    return;
  }

  const setup = computeSetupScore({
    candles,
    ma,
    quote,
    volatilityPct: candleVolatilityPct,
    minScore: 0.55
  });

  if (!setup.passed) {
    journal.decision({ decision: "skip", regime, reason: "setup_score_too_low", setupScore: setup.score });
    logger.info({ setup }, "scan.setup.rejected");
    return;
  }

  const entryPrice = quote.ask;
  const order = await orderManager.placeEntry("BTC-USD", entryPrice, 1);
  journal.decision({ decision: "allow", regime, reason: decision.reason, setupScore: setup.score });
  journal.order({ side: "buy", reason: signal.reason, orderId: order.id, limitPrice: entryPrice, notionalUsd: 1 });
  logger.info({ orderId: order.id, setupScore: setup.score }, "scan.entry.placed");
}
