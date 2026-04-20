import type { StrategyParams } from "../types.js";

export const defaultStrategy: StrategyParams = {
  maLength: 20,
  stopLossPct: 0.01,
  takeProfitPct: 0.015,
  volatilityMaxPct: 0.35,
  cooldownCandles: 1
};
