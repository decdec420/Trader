import { describe, expect, it } from "vitest";
import { TradeLifecycleEngine } from "../src/execution/TradeLifecycleEngine.js";
import { LIFECYCLE_REASONS } from "../src/execution/reasons.js";
import type { Candle, Position } from "../src/types.js";

function candle(low: number, high: number, close: number, endedAt: string): Candle {
  return {
    symbol: "BTC-USD",
    open: close,
    high,
    low,
    close,
    volume: 1,
    startedAt: endedAt,
    endedAt
  };
}

describe("TradeLifecycleEngine", () => {
  const engine = new TradeLifecycleEngine();
  const position: Position = {
    symbol: "BTC-USD",
    qty: 0.00001,
    entryPrice: 100,
    openedAt: "2026-01-01T10:00:00.000Z"
  };

  it("exits on stop loss", () => {
    const decision = engine.evaluate(position, candle(98.5, 100.5, 99, "2026-01-01T10:05:00.000Z"), 0.01, 0.015);
    expect(decision.action).toBe("exit");
    expect(decision.reason).toBe(LIFECYCLE_REASONS.STOP_LOSS_HIT);
  });

  it("exits on take profit", () => {
    const decision = engine.evaluate(position, candle(99.5, 102, 101.2, "2026-01-01T10:05:00.000Z"), 0.01, 0.015);
    expect(decision.action).toBe("exit");
    expect(decision.reason).toBe(LIFECYCLE_REASONS.TAKE_PROFIT_HIT);
  });

  it("exits end-of-day to avoid overnight", () => {
    const decision = engine.evaluate(position, candle(99.5, 100.8, 100.1, "2026-01-02T00:00:00.000Z"), 0.01, 0.015);
    expect(decision.action).toBe("exit");
    expect(decision.reason).toBe(LIFECYCLE_REASONS.END_OF_DAY_EXIT);
  });
});
