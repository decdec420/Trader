import { describe, expect, it } from "vitest";
import { RiskManager } from "../src/execution/RiskManager.js";

describe("RiskManager", () => {
  it("blocks order > $1", () => {
    const r = new RiskManager().check({
      symbol: "BTC-USD",
      quote: { symbol: "BTC-USD", bid: 100, ask: 100.1, timestamp: new Date().toISOString() },
      account: { balanceUsd: 10, equityUsd: 10, dailyRealizedPnlUsd: 0, dailyTrades: 0 },
      hasOpenOrder: false,
      hasOpenPosition: false,
      orderUsd: 1.01,
      maxOrderUsd: 1,
      maxDailyTrades: 2,
      maxDailyLossUsd: 1,
      maxSpreadBps: 30,
      minBalanceUsd: 8,
      latestCandleEndedAt: new Date().toISOString(),
      staleCandleSeconds: 180
    });
    expect(r.allow).toBe(false);
    expect(r.reason).toBe("order_size_too_large");
  });

  it("blocks when daily trade limit reached", () => {
    const r = new RiskManager().check({
      symbol: "BTC-USD",
      quote: { symbol: "BTC-USD", bid: 100, ask: 100.1, timestamp: new Date().toISOString() },
      account: { balanceUsd: 10, equityUsd: 10, dailyRealizedPnlUsd: 0, dailyTrades: 2 },
      hasOpenOrder: false,
      hasOpenPosition: false,
      orderUsd: 1,
      maxOrderUsd: 1,
      maxDailyTrades: 2,
      maxDailyLossUsd: 1,
      maxSpreadBps: 30,
      minBalanceUsd: 8,
      latestCandleEndedAt: new Date().toISOString(),
      staleCandleSeconds: 180
    });
    expect(r.allow).toBe(false);
    expect(r.reason).toBe("daily_trade_limit_reached");
  });
});
