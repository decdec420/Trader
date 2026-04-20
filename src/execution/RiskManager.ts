import type { AccountSnapshot, Quote, StrategyParams, SymbolPair } from "../types.js";
import { secondsSince } from "../utils/time.js";

export interface RiskInput {
  symbol: SymbolPair;
  quote: Quote;
  account: AccountSnapshot;
  hasOpenOrder: boolean;
  hasOpenPosition: boolean;
  orderUsd: number;
  maxOrderUsd: number;
  maxDailyTrades: number;
  maxDailyLossUsd: number;
  maxSpreadBps: number;
  minBalanceUsd: number;
  latestCandleEndedAt: string;
  staleCandleSeconds: number;
}

export interface RiskDecision {
  allow: boolean;
  reason: string;
}

export class RiskManager {
  check(input: RiskInput): RiskDecision {
    if (input.symbol !== "BTC-USD") return { allow: false, reason: "symbol_not_allowed" };
    if (input.orderUsd > input.maxOrderUsd || input.orderUsd > 1) return { allow: false, reason: "order_size_too_large" };
    if (input.hasOpenOrder || input.hasOpenPosition) return { allow: false, reason: "existing_open_order_or_position" };
    if (input.account.dailyTrades >= input.maxDailyTrades) return { allow: false, reason: "daily_trade_limit_reached" };
    if (Math.abs(input.account.dailyRealizedPnlUsd) >= input.maxDailyLossUsd && input.account.dailyRealizedPnlUsd < 0) {
      return { allow: false, reason: "daily_loss_limit_reached" };
    }
    if (input.account.balanceUsd < input.minBalanceUsd) return { allow: false, reason: "balance_below_kill_switch" };
    const spreadBps = ((input.quote.ask - input.quote.bid) / ((input.quote.ask + input.quote.bid) / 2)) * 10000;
    if (spreadBps > input.maxSpreadBps) return { allow: false, reason: "spread_too_wide" };
    if (secondsSince(input.quote.timestamp) > input.staleCandleSeconds) return { allow: false, reason: "quote_stale" };
    if (secondsSince(input.latestCandleEndedAt) > input.staleCandleSeconds) return { allow: false, reason: "candle_stale" };
    return { allow: true, reason: "ok" };
  }

  assertNoUnsafeParams(params: StrategyParams): void {
    if (params.stopLossPct <= 0 || params.stopLossPct > 0.02) throw new Error("Unsafe stopLossPct");
    if (params.takeProfitPct <= 0 || params.takeProfitPct > 0.03) throw new Error("Unsafe takeProfitPct");
    if (params.maLength < 5 || params.maLength > 50) throw new Error("Unsafe maLength");
  }
}
