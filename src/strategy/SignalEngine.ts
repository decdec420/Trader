import type { Candle, Signal, StrategyParams } from "../types.js";
import { maFromCandles } from "./indicators.js";

export class SignalEngine {
  evaluate(candles: Candle[], params: StrategyParams): Signal {
    if (candles.length < Math.max(params.maLength, 3)) return { action: "none", reason: "insufficient_candles" };

    const ma = maFromCandles(candles, params.maLength);
    if (!ma) return { action: "none", reason: "ma_unavailable" };

    const prev = candles[candles.length - 2];
    const cur = candles[candles.length - 1];

    if (cur.close <= ma) return { action: "none", reason: "not_above_ma" };

    const pullback = prev.close < candles[candles.length - 3].close;
    if (!pullback) return { action: "none", reason: "no_pullback" };

    if (cur.close <= prev.high) return { action: "none", reason: "no_recovery_break" };

    return {
      action: "buy",
      reason: "pullback_recovery_above_ma",
      stopLoss: cur.close * (1 - params.stopLossPct),
      takeProfit: cur.close * (1 + params.takeProfitPct)
    };
  }
}
