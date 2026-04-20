import { appendNdjson } from "../utils/fs.js";
import { nowIso } from "../utils/time.js";
import type { StrategyParams } from "../types.js";

export interface PerfMetrics {
  trades: number;
  winRate: number;
  expectancy: number;
  maxDrawdownUsd: number;
}

export interface ExperimentResult {
  baseVersion: string;
  candidateVersion: string;
  changed: Partial<StrategyParams>;
  metrics: PerfMetrics;
  recommendation: "reject" | "candidate";
  reason: string;
}

export class LearningManager {
  constructor(private readonly logPath: string) {}

  proposeVariant(base: StrategyParams): Partial<StrategyParams> {
    return {
      maLength: Math.max(5, Math.min(50, base.maLength + 1)),
      takeProfitPct: Math.max(0.005, Math.min(0.03, base.takeProfitPct + 0.001))
    };
  }

  evaluate(baseVersion: string, candidateVersion: string, changed: Partial<StrategyParams>, metrics: PerfMetrics): ExperimentResult {
    const good = metrics.trades >= 10 && metrics.expectancy > 0 && metrics.maxDrawdownUsd <= 1;
    const result: ExperimentResult = {
      baseVersion,
      candidateVersion,
      changed,
      metrics,
      recommendation: good ? "candidate" : "reject",
      reason: good ? "meets_guardrails" : "fails_guardrails"
    };
    appendNdjson(this.logPath, { ts: nowIso(), ...result });
    return result;
  }
}
