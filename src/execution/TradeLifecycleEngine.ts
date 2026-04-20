import type { Candle, Position } from "../types.js";
import { LIFECYCLE_REASONS, type LifecycleReason } from "./reasons.js";

export interface LifecycleDecision {
  action: "hold" | "exit";
  reason: LifecycleReason;
  limitPrice?: number;
}

export class TradeLifecycleEngine {
  evaluate(position: Position, latestCandle: Candle, stopLossPct: number, takeProfitPct: number): LifecycleDecision {
    const stopLoss = position.entryPrice * (1 - stopLossPct);
    const takeProfit = position.entryPrice * (1 + takeProfitPct);

    if (latestCandle.low <= stopLoss) {
      return { action: "exit", reason: LIFECYCLE_REASONS.STOP_LOSS_HIT, limitPrice: stopLoss };
    }

    if (latestCandle.high >= takeProfit) {
      return { action: "exit", reason: LIFECYCLE_REASONS.TAKE_PROFIT_HIT, limitPrice: takeProfit };
    }

    const openedDay = position.openedAt.slice(0, 10);
    const candleDay = latestCandle.endedAt.slice(0, 10);
    if (openedDay !== candleDay) {
      return { action: "exit", reason: LIFECYCLE_REASONS.END_OF_DAY_EXIT, limitPrice: latestCandle.close };
    }

    return { action: "hold", reason: LIFECYCLE_REASONS.HOLD };
  }
}
