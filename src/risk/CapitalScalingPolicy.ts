export interface ScalingInput {
  mode: "paper" | "live";
  currentOrderUsd: number;
  maxOrderUsd: number;
  sampleSize: number;
  winRate: number;
  expectancy: number;
  recentDrawdownUsd: number;
}

export interface ScalingDecision {
  recommendedOrderUsd: number;
  action: "hold" | "scale_up_small" | "scale_down";
  reason: string;
}

export class CapitalScalingPolicy {
  decide(input: ScalingInput): ScalingDecision {
    const cappedCurrent = Math.min(input.currentOrderUsd, input.maxOrderUsd, 1);

    if (input.sampleSize < 20) {
      return {
        recommendedOrderUsd: cappedCurrent,
        action: "hold",
        reason: "insufficient_sample_size"
      };
    }

    if (input.recentDrawdownUsd >= 0.75) {
      return {
        recommendedOrderUsd: Math.max(0.5, Math.round((cappedCurrent * 0.75) * 100) / 100),
        action: "scale_down",
        reason: "drawdown_protection"
      };
    }

    const liveRequiresMoreEvidence = input.mode === "live" && input.sampleSize < 40;
    if (liveRequiresMoreEvidence) {
      return {
        recommendedOrderUsd: cappedCurrent,
        action: "hold",
        reason: "live_mode_requires_more_evidence"
      };
    }

    if (input.winRate >= 0.6 && input.expectancy > 0.015) {
      return {
        recommendedOrderUsd: Math.min(1, input.maxOrderUsd, Math.round((cappedCurrent + 0.1) * 100) / 100),
        action: "scale_up_small",
        reason: "earned_small_scale_up"
      };
    }

    return {
      recommendedOrderUsd: cappedCurrent,
      action: "hold",
      reason: "conservative_default"
    };
  }
}
