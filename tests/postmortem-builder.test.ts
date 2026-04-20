import { describe, expect, it } from "vitest";
import { buildPostmortem } from "../src/analysis/postmortem-builder.js";

describe("buildPostmortem", () => {
  it("builds deterministic aggregates by regime/time and reasons", () => {
    const payload = buildPostmortem({
      completedTrades: [
        {
          ts: "2026-01-01T12:00:00.000Z",
          regime: "trend",
          timeBucket: "us",
          lifecycleReason: "take_profit_hit",
          realizedPnlUsd: 0.2,
          strategyVersion: "v1-1"
        },
        {
          ts: "2026-01-01T13:00:00.000Z",
          regime: "trend",
          timeBucket: "us",
          lifecycleReason: "stop_loss_hit",
          realizedPnlUsd: -0.1,
          strategyVersion: "v1-1"
        }
      ],
      skipReasonCounts: { spread_too_wide: 3 }
    });

    expect(payload.totals.completedTrades).toBe(2);
    expect(payload.byRegime.trend.trades).toBe(2);
    expect(payload.byTimeBucket.us.trades).toBe(2);
    expect(payload.lifecycleReasonCounts.take_profit_hit).toBe(1);
    expect(payload.skipReasonCounts.spread_too_wide).toBe(3);
    expect(payload.candidateStrategyPerformance["v1-1"].trades).toBe(2);
  });
});
