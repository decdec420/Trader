import type { Candle, Signal, StrategyParams } from "../types.js";
import { SIGNAL_REASONS } from "../execution/reasons.js";
import { maFromCandles } from "./indicators.js";

export class SignalEngine {
  evaluate(candles: Candle[], params: StrategyParams): Signal {
    if (candles.length < Math.max(params.maLength, 3)) {
      return { action: "none", reason: SIGNAL_REASONS.INSUFFICIENT_CANDLES };
    }

    const ma = maFromCandles(candles, params.maLength);
    if (!ma) return { action: "none", reason: SIGNAL_REASONS.MA_UNAVAILABLE };

    const prev = candles[candles.length - 2];
    const cur = candles[candles.length - 1];

    if (cur.close <= ma) return { action: "none", reason: SIGNAL_REASONS.NOT_ABOVE_MA };

    const pullback = prev.close < candles[candles.length - 3].close;
    if (!pullback) return { action: "none", reason: SIGNAL_REASONS.NO_PULLBACK };

    if (cur.close <= prev.high) return { action: "none", reason: SIGNAL_REASONS.NO_RECOVERY_BREAK };

    return {
      action: "buy",
      reason: SIGNAL_REASONS.PULLBACK_RECOVERY_ABOVE_MA,
      stopLoss: cur.close * (1 - params.stopLossPct),
      takeProfit: cur.close * (1 + params.takeProfitPct)
    };
  }
}
