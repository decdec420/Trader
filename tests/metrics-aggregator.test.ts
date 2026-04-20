import { writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MetricsAggregator } from "../src/journal/MetricsAggregator.js";

describe("MetricsAggregator", () => {
  it("builds LLM-ready summary payload", () => {
    const file = join("tests", "tmp", `metrics-${Date.now()}.ndjson`);
    rmSync(file, { force: true });

    const rows = [
      { type: "decision", decision: "skip", reason: "spread_too_wide" },
      { type: "decision", decision: "allow", reason: "ok" },
      { type: "order", side: "buy" },
      { type: "order", side: "sell", realizedPnlUsd: 0.2 },
      { type: "order", side: "sell", realizedPnlUsd: -0.1 }
    ];
    writeFileSync(file, rows.map((r) => JSON.stringify(r)).join("\n"), "utf8");

    const payload = new MetricsAggregator().summarizeTradeJournal(file);

    expect(payload.context).toBe("paper_trading_summary");
    expect(payload.metrics.totalDecisions).toBe(2);
    expect(payload.metrics.realizedWins).toBe(1);
    expect(payload.topSkipReasons[0]?.reason).toBe("spread_too_wide");
  });
});
