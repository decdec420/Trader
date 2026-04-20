import type { Candle, Quote } from "../types.js";

export interface SetupScoreBreakdown {
  trendStrength: number;
  recoveryStrength: number;
  spreadPenalty: number;
  volatilityPenalty: number;
}

export interface SetupScoreResult {
  score: number;
  breakdown: SetupScoreBreakdown;
  passed: boolean;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function computeSetupScore(args: {
  candles: Candle[];
  ma: number;
  quote: Quote;
  volatilityPct: number;
  minScore: number;
}): SetupScoreResult {
  const { candles, ma, quote, volatilityPct, minScore } = args;
  const prev = candles[candles.length - 2];
  const cur = candles[candles.length - 1];

  const trendStrength = clamp01((cur.close - ma) / ma * 100 * 20);
  const recoveryStrength = clamp01((cur.close - prev.high) / prev.high * 100 * 35);
  const spreadBps = ((quote.ask - quote.bid) / ((quote.ask + quote.bid) / 2)) * 10000;
  const spreadPenalty = clamp01(spreadBps / 60);
  const volatilityPenalty = clamp01(volatilityPct / 1.0);

  const rawScore = trendStrength * 0.4 + recoveryStrength * 0.4 + (1 - spreadPenalty) * 0.1 + (1 - volatilityPenalty) * 0.1;
  const score = Math.round(rawScore * 1000) / 1000;

  return {
    score,
    breakdown: { trendStrength, recoveryStrength, spreadPenalty, volatilityPenalty },
    passed: score >= minScore
  };
}
