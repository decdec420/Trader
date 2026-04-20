export interface CompletedTrade {
  ts: string;
  regime: string;
  timeBucket: "asia" | "europe" | "us" | "overnight";
  lifecycleReason: string;
  realizedPnlUsd: number;
  strategyVersion: string;
}

export interface PostmortemPayload {
  generatedAt: string;
  totals: {
    completedTrades: number;
    wins: number;
    losses: number;
    netPnlUsd: number;
  };
  byRegime: Record<string, { trades: number; netPnlUsd: number }>;
  byTimeBucket: Record<string, { trades: number; netPnlUsd: number }>;
  lifecycleReasonCounts: Record<string, number>;
  skipReasonCounts: Record<string, number>;
  candidateStrategyPerformance: Record<string, { trades: number; netPnlUsd: number }>;
}

function bumpCount(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

function bumpPnl(map: Record<string, { trades: number; netPnlUsd: number }>, key: string, pnl: number): void {
  map[key] = map[key] ?? { trades: 0, netPnlUsd: 0 };
  map[key].trades += 1;
  map[key].netPnlUsd += pnl;
}

export function buildPostmortem(input: {
  completedTrades: CompletedTrade[];
  skipReasonCounts: Record<string, number>;
}): PostmortemPayload {
  const { completedTrades, skipReasonCounts } = input;
  const byRegime: Record<string, { trades: number; netPnlUsd: number }> = {};
  const byTimeBucket: Record<string, { trades: number; netPnlUsd: number }> = {};
  const lifecycleReasonCounts: Record<string, number> = {};
  const candidateStrategyPerformance: Record<string, { trades: number; netPnlUsd: number }> = {};

  let wins = 0;
  let losses = 0;
  let netPnlUsd = 0;

  for (const trade of completedTrades) {
    netPnlUsd += trade.realizedPnlUsd;
    if (trade.realizedPnlUsd >= 0) wins += 1;
    else losses += 1;

    bumpPnl(byRegime, trade.regime, trade.realizedPnlUsd);
    bumpPnl(byTimeBucket, trade.timeBucket, trade.realizedPnlUsd);
    bumpCount(lifecycleReasonCounts, trade.lifecycleReason);

    if (trade.strategyVersion.includes("-")) {
      bumpPnl(candidateStrategyPerformance, trade.strategyVersion, trade.realizedPnlUsd);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      completedTrades: completedTrades.length,
      wins,
      losses,
      netPnlUsd: Math.round(netPnlUsd * 10000) / 10000
    },
    byRegime,
    byTimeBucket,
    lifecycleReasonCounts,
    skipReasonCounts,
    candidateStrategyPerformance
  };
}
