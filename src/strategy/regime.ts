import type { Candle, MarketRegime } from "../types.js";
import { maFromCandles, realizedVolatilityPct } from "./indicators.js";

export function classifyRegime(candles: Candle[], maLength: number, volMaxPct: number): MarketRegime {
  if (candles.length < maLength + 2) return "no_trade";
  const ma = maFromCandles(candles, maLength);
  if (!ma) return "no_trade";
  const last = candles[candles.length - 1];
  const vol = realizedVolatilityPct(candles, Math.min(20, candles.length - 1));

  if (vol > volMaxPct) return "high_volatility";
  if (last.close > ma) return "trend";
  return "chop";
}
