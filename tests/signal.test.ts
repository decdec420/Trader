import { describe, expect, it } from "vitest";
import { SignalEngine } from "../src/strategy/SignalEngine.js";
import type { Candle } from "../src/types.js";

function c(close: number, high = close + 2): Candle {
  const now = new Date().toISOString();
  return { symbol: "BTC-USD", open: close - 1, high, low: close - 3, close, volume: 1, startedAt: now, endedAt: now };
}

describe("SignalEngine", () => {
  it("emits buy on pullback recovery above prior high in uptrend", () => {
    const engine = new SignalEngine();
    const candles: Candle[] = [
      ...Array.from({ length: 20 }, (_, i) => c(100 + i, 102 + i)),
      c(125, 126),
      c(130, 131)
    ];
    candles[candles.length - 2] = c(124, 125);
    candles[candles.length - 3] = c(126, 127);

    const signal = engine.evaluate(candles, {
      maLength: 20,
      stopLossPct: 0.01,
      takeProfitPct: 0.015,
      volatilityMaxPct: 0.35,
      cooldownCandles: 1
    });

    expect(signal.action).toBe("buy");
  });

  it("skips when not above MA", () => {
    const engine = new SignalEngine();
    const candles = Array.from({ length: 22 }, () => c(100));
    const signal = engine.evaluate(candles, {
      maLength: 20,
      stopLossPct: 0.01,
      takeProfitPct: 0.015,
      volatilityMaxPct: 0.35,
      cooldownCandles: 1
    });
    expect(signal.action).toBe("none");
  });
});
