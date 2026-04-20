import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildDashboardSummary } from "../src/metrics/dashboard-summary.js";
import { parseAppConfig } from "../src/config/env.js";
import { StrategyRegistry } from "../src/learning/StrategyRegistry.js";
import { defaultStrategy } from "../src/app/defaultStrategy.js";
import { ManualApprovalPolicy } from "../src/approval/ManualApprovalPolicy.js";

describe("dashboard summary payload", () => {
  it("contains approval, strategy queue, distributions, and scaling recommendation", () => {
    const dataDir = join("tests", "tmp", `dashboard-${Date.now()}`);
    rmSync(dataDir, { recursive: true, force: true });
    mkdirSync(dataDir, { recursive: true });

    writeFileSync(
      join(dataDir, "trade-journal.ndjson"),
      [
        JSON.stringify({ type: "decision", decision: "skip", reason: "spread_too_wide" }),
        JSON.stringify({ type: "order", side: "sell", reason: "take_profit_hit", realizedPnlUsd: 0.1, regime: "trend", strategyVersion: "v1-2", ts: "2026-01-01T12:00:00.000Z" })
      ].join("\n"),
      "utf8"
    );

    const reg = new StrategyRegistry(dataDir);
    reg.save({ version: "v1", params: defaultStrategy, stage: "seeded", createdAt: new Date().toISOString(), notes: "seed" });
    reg.transition("v1", "candidate");

    const config = parseAppConfig({ DATA_DIR: dataDir, MAX_ORDER_USD: 1 });
    const payload = buildDashboardSummary({ config, approvalPolicy: new ManualApprovalPolicy("token"), mode: "live" });

    expect(payload.activeModeRequiresManualApproval).toBe(true);
    expect(payload.liveApprovalRequiredByDoctrine).toBe(true);
    expect(payload.candidateStrategyQueue).toContain("v1");
    expect(payload.recentSkipReasons.length).toBeGreaterThan(0);
    expect(payload.scalingRecommendation.recommendedOrderUsd).toBeLessThanOrEqual(1);
    expect(payload.capitalPreservationStatus.liveRequiresApproval).toBe(true);
  });
});
