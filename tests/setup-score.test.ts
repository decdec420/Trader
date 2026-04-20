import { describe, expect, it } from "vitest";
import { computeSetupScore } from "../src/strategy/setupScore.js";
import type { Candle, Quote } from "../src/types.js";

function candle(close: number, high: number): Candle {
  const now = new Date().toISOString();
  return {
    symbol: "BTC-USD",
    open: close - 2,
    high,
    low: close - 4,
    close,
    volume: 1,
    startedAt: now,
    endedAt: now
  };
}

describe("computeSetupScore", () => {
  it("passes strong setups", () => {
    const candles = [candle(100, 101), candle(102, 103), candle(106, 108)];
    const quote: Quote = { symbol: "BTC-USD", bid: 105.9, ask: 106.1, timestamp: new Date().toISOString() };

    const result = computeSetupScore({ candles, ma: 100, quote, volatilityPct: 0.2, minScore: 0.55 });

    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(0.55);
  });

  it("rejects low-quality setups", () => {
    const candles = [candle(100, 101), candle(100.1, 100.2), candle(100.15, 100.2)];
    const quote: Quote = { symbol: "BTC-USD", bid: 99.5, ask: 100.8, timestamp: new Date().toISOString() };

    const result = computeSetupScore({ candles, ma: 100, quote, volatilityPct: 0.9, minScore: 0.55 });

    expect(result.passed).toBe(false);
  });
});
