import { config } from "../config/env.js";
import { createBroker } from "../broker/createBroker.js";
import { CandleLoader } from "../market/CandleLoader.js";
import { classifyRegime } from "../strategy/regime.js";
import { maFromCandles, realizedVolatilityPct } from "../strategy/indicators.js";
import { ResearchJournal } from "../journal/ResearchJournal.js";
import { join } from "node:path";
import { logger } from "../utils/logger.js";
import { defaultStrategy } from "./defaultStrategy.js";

export async function runResearch(): Promise<void> {
  const broker = createBroker("paper");
  const loader = new CandleLoader(broker, config.STALE_CANDLE_SECONDS);
  const journal = new ResearchJournal(join(config.DATA_DIR, "research-journal.ndjson"));

  const candles = await loader.load5m("BTC-USD", 60);
  const ma = maFromCandles(candles, defaultStrategy.maLength) ?? 0;
  const vol = realizedVolatilityPct(candles, 20);
  const regime = classifyRegime(candles, defaultStrategy.maLength, defaultStrategy.volatilityMaxPct);

  journal.record({
    symbol: "BTC-USD",
    regime,
    reason: "periodic_research_sample",
    indicators: { ma20: ma, volPct20: vol }
  });

  logger.info({ regime, ma, vol }, "research.observation");
}
