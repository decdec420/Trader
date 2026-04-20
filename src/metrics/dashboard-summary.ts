import { join } from "node:path";
import type { AppConfig } from "../config/env.js";
import type { ApprovalPolicy } from "../approval/ApprovalPolicy.js";
import { StrategyRegistry } from "../learning/StrategyRegistry.js";
import { MetricsAggregator } from "../journal/MetricsAggregator.js";
import { buildRecentPostmortemFromJournal } from "./recent-summary.js";
import { CapitalScalingPolicy } from "../risk/CapitalScalingPolicy.js";
import { CAPITAL_PRESERVATION_DOCTRINE } from "../doctrine/capital-preservation.js";

export interface DashboardSummaryPayload {
  liveApprovalRequiredByDoctrine: boolean;
  activeModeRequiresManualApproval: boolean;
  activeLiveStrategyVersion: string | null;
  activeLiveStrategyStage: string | null;
  candidateStrategyQueue: string[];
  recentTradeSummary: ReturnType<MetricsAggregator["summarizeTradeJournal"]>["metrics"];
  recentSkipReasons: ReturnType<MetricsAggregator["summarizeTradeJournal"]>["topSkipReasons"];
  regimeDistribution: Record<string, { trades: number; netPnlUsd: number }>;
  timeBucketDistribution: Record<string, { trades: number; netPnlUsd: number }>;
  lifecycleTransitionCounts: Record<string, number>;
  scalingRecommendation: ReturnType<CapitalScalingPolicy["decide"]>;
  capitalPreservationStatus: {
    doctrineVersion: string;
    noTradeBiasActive: boolean;
    liveRequiresApproval: boolean;
  };
}

export function buildDashboardSummary(args: {
  config: AppConfig;
  approvalPolicy: ApprovalPolicy;
  mode: "paper" | "live";
}): DashboardSummaryPayload {
  const tradeJournal = join(args.config.DATA_DIR, "trade-journal.ndjson");
  const metrics = new MetricsAggregator().summarizeTradeJournal(tradeJournal);
  const registry = new StrategyRegistry(args.config.DATA_DIR);
  const postmortem = buildRecentPostmortemFromJournal(tradeJournal);

  const scalingRecommendation = new CapitalScalingPolicy().decide({
    mode: args.mode,
    currentOrderUsd: 1,
    maxOrderUsd: args.config.MAX_ORDER_USD,
    sampleSize: Math.max(0, metrics.metrics.realizedWins + metrics.metrics.realizedLosses),
    winRate: metrics.metrics.winRate,
    expectancy: 0,
    recentDrawdownUsd: Math.max(0, -(postmortem.totals.netPnlUsd < 0 ? postmortem.totals.netPnlUsd : 0))
  });

  const live = registry.getLive();
  return {
    liveApprovalRequiredByDoctrine: CAPITAL_PRESERVATION_DOCTRINE.principles.liveRequiresApproval,
    activeModeRequiresManualApproval: args.approvalPolicy.name === "manual-live",
    activeLiveStrategyVersion: live?.version ?? null,
    activeLiveStrategyStage: live?.stage ?? null,
    candidateStrategyQueue: registry.listByStage("candidate").map((x) => x.version),
    recentTradeSummary: metrics.metrics,
    recentSkipReasons: metrics.topSkipReasons,
    regimeDistribution: postmortem.byRegime,
    timeBucketDistribution: postmortem.byTimeBucket,
    lifecycleTransitionCounts: postmortem.lifecycleReasonCounts,
    scalingRecommendation,
    capitalPreservationStatus: {
      doctrineVersion: CAPITAL_PRESERVATION_DOCTRINE.doctrineVersion,
      noTradeBiasActive: CAPITAL_PRESERVATION_DOCTRINE.principles.noTradeIsValid,
      liveRequiresApproval: CAPITAL_PRESERVATION_DOCTRINE.principles.liveRequiresApproval
    }
  };
}
