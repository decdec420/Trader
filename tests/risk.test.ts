import { describe, expect, it } from "vitest";
import { RiskManager } from "../src/execution/RiskManager.js";
import { RISK_REASONS } from "../src/execution/reasons.js";

const baseInput = {
  symbol: "BTC-USD" as const,
  quote: { symbol: "BTC-USD" as const, bid: 100, ask: 100.1, timestamp: new Date().toISOString() },
  account: { balanceUsd: 10, equityUsd: 10, dailyRealizedPnlUsd: 0, dailyTrades: 0 },
  hasOpenOrder: false,
  hasOpenPosition: false,
  orderUsd: 1,
  maxOrderUsd: 1,
  maxDailyTrades: 2,
  maxDailyLossUsd: 1,
  maxSpreadBps: 30,
  minBalanceUsd: 8,
  latestCandleEndedAt: new Date().toISOString(),
  staleCandleSeconds: 180,
  candleVolatilityPct: 0.2,
  maxCandleVolatilityPct: 0.35,
  tradingWindowStartHourUtc: 0,
  tradingWindowEndHourUtc: 24
};

describe("RiskManager", () => {
  it("blocks order > $1", () => {
    const r = new RiskManager().check({ ...baseInput, orderUsd: 1.01 });
    expect(r.allow).toBe(false);
    expect(r.reason).toBe(RISK_REASONS.ORDER_SIZE_TOO_LARGE);
  });

  it("blocks when daily trade limit reached", () => {
    const r = new RiskManager().check({ ...baseInput, account: { ...baseInput.account, dailyTrades: 2 } });
    expect(r.allow).toBe(false);
    expect(r.reason).toBe(RISK_REASONS.DAILY_TRADE_LIMIT_REACHED);
  });

  it("blocks outside configured UTC trading window", () => {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const blockedStart = (currentHour + 1) % 24;
    const blockedEnd = (currentHour + 2) % 24;

    const r = new RiskManager().check({
      ...baseInput,
      quote: { ...baseInput.quote, timestamp: now.toISOString() },
      latestCandleEndedAt: now.toISOString(),
      tradingWindowStartHourUtc: blockedStart,
      tradingWindowEndHourUtc: blockedEnd
    });

    expect(r.allow).toBe(false);
    expect(r.reason).toBe(RISK_REASONS.OUTSIDE_TRADING_WINDOW);
  });

  it("blocks when volatility is above threshold", () => {
    const r = new RiskManager().check({ ...baseInput, candleVolatilityPct: 0.9, maxCandleVolatilityPct: 0.35 });
    expect(r.allow).toBe(false);
    expect(r.reason).toBe(RISK_REASONS.VOLATILITY_TOO_HIGH);
  });
});
