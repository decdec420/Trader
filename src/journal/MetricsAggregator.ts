import { readFileSync, existsSync } from "node:fs";

export interface TradingMetrics {
  totalDecisions: number;
  allowedSetups: number;
  skippedSetups: number;
  buyOrders: number;
  sellOrders: number;
  realizedWins: number;
  realizedLosses: number;
  winRate: number;
}

export interface LlmSummaryPayload {
  context: "paper_trading_summary";
  metrics: TradingMetrics;
  topSkipReasons: Array<{ reason: string; count: number }>;
  recommendations: string[];
}

function parseLines(path: string): Array<Record<string, unknown>> {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

export class MetricsAggregator {
  summarizeTradeJournal(path: string): LlmSummaryPayload {
    const rows = parseLines(path);
    const skipCounts = new Map<string, number>();

    let allowedSetups = 0;
    let skippedSetups = 0;
    let buyOrders = 0;
    let sellOrders = 0;
    let realizedWins = 0;
    let realizedLosses = 0;

    for (const row of rows) {
      const type = row.type;
      if (type === "decision") {
        if (row.decision === "allow") allowedSetups += 1;
        if (row.decision === "skip") {
          skippedSetups += 1;
          const reason = String(row.reason ?? "unknown");
          skipCounts.set(reason, (skipCounts.get(reason) ?? 0) + 1);
        }
      }

      if (type === "order") {
        const side = row.side;
        if (side === "buy") buyOrders += 1;
        if (side === "sell") sellOrders += 1;
        const pnl = Number(row.realizedPnlUsd ?? 0);
        if (pnl > 0) realizedWins += 1;
        if (pnl < 0) realizedLosses += 1;
      }
    }

    const closedTrades = realizedWins + realizedLosses;
    const winRate = closedTrades > 0 ? realizedWins / closedTrades : 0;

    const topSkipReasons = Array.from(skipCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const recommendations: string[] = [];
    if (topSkipReasons.some((x) => x.reason === "spread_too_wide")) {
      recommendations.push("Prefer tighter-spread sessions before enabling entries.");
    }
    if (winRate < 0.45 && closedTrades >= 4) {
      recommendations.push("Keep strategy in paper mode and review setup score threshold.");
    }
    if (recommendations.length === 0) {
      recommendations.push("No urgent risk action; continue paper observation.");
    }

    const metrics: TradingMetrics = {
      totalDecisions: allowedSetups + skippedSetups,
      allowedSetups,
      skippedSetups,
      buyOrders,
      sellOrders,
      realizedWins,
      realizedLosses,
      winRate
    };

    return {
      context: "paper_trading_summary",
      metrics,
      topSkipReasons,
      recommendations
    };
  }
}
