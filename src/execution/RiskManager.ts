import type { AccountSnapshot, Quote, StrategyParams, SymbolPair } from "../types.js";
import { secondsSince } from "../utils/time.js";
import { RISK_REASONS, type RiskReason } from "./reasons.js";

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
  candleVolatilityPct: number;
  maxCandleVolatilityPct: number;
  tradingWindowStartHourUtc: number;
  tradingWindowEndHourUtc: number;
}

export interface RiskDecision {
  allow: boolean;
  reason: RiskReason;
}

export class RiskManager {
  check(input: RiskInput): RiskDecision {
    if (input.symbol !== "BTC-USD") return { allow: false, reason: RISK_REASONS.SYMBOL_NOT_ALLOWED };
    if (input.orderUsd > input.maxOrderUsd || input.orderUsd > 1) return { allow: false, reason: RISK_REASONS.ORDER_SIZE_TOO_LARGE };
    if (input.hasOpenOrder || input.hasOpenPosition) return { allow: false, reason: RISK_REASONS.EXISTING_OPEN_ORDER_OR_POSITION };
    if (input.account.dailyTrades >= input.maxDailyTrades) return { allow: false, reason: RISK_REASONS.DAILY_TRADE_LIMIT_REACHED };
    if (Math.abs(input.account.dailyRealizedPnlUsd) >= input.maxDailyLossUsd && input.account.dailyRealizedPnlUsd < 0) {
      return { allow: false, reason: RISK_REASONS.DAILY_LOSS_LIMIT_REACHED };
    }
    if (input.account.balanceUsd < input.minBalanceUsd) return { allow: false, reason: RISK_REASONS.BALANCE_BELOW_KILL_SWITCH };

    const spreadBps = ((input.quote.ask - input.quote.bid) / ((input.quote.ask + input.quote.bid) / 2)) * 10000;
    if (spreadBps > input.maxSpreadBps) return { allow: false, reason: RISK_REASONS.SPREAD_TOO_WIDE };

    if (secondsSince(input.quote.timestamp) > input.staleCandleSeconds) return { allow: false, reason: RISK_REASONS.QUOTE_STALE };
    if (secondsSince(input.latestCandleEndedAt) > input.staleCandleSeconds) return { allow: false, reason: RISK_REASONS.CANDLE_STALE };

    const hour = new Date(input.latestCandleEndedAt).getUTCHours();
    if (hour < input.tradingWindowStartHourUtc || hour >= input.tradingWindowEndHourUtc) {
      return { allow: false, reason: RISK_REASONS.OUTSIDE_TRADING_WINDOW };
    }

    if (input.candleVolatilityPct > input.maxCandleVolatilityPct) {
      return { allow: false, reason: RISK_REASONS.VOLATILITY_TOO_HIGH };
    }

    return { allow: true, reason: RISK_REASONS.OK };
  }

  assertNoUnsafeParams(params: StrategyParams): void {
    if (params.stopLossPct <= 0 || params.stopLossPct > 0.02) throw new Error("Unsafe stopLossPct");
    if (params.takeProfitPct <= 0 || params.takeProfitPct > 0.03) throw new Error("Unsafe takeProfitPct");
    if (params.maLength < 5 || params.maLength > 50) throw new Error("Unsafe maLength");
  }
}
