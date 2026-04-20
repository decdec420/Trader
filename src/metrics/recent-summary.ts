import { readFileSync, existsSync } from "node:fs";
import { buildPostmortem, type CompletedTrade } from "../analysis/postmortem-builder.js";

interface RawRow {
  type?: string;
  decision?: string;
  reason?: string;
  regime?: string;
  side?: string;
  realizedPnlUsd?: number;
  strategyVersion?: string;
  ts?: string;
}

function hourToBucket(ts: string): CompletedTrade["timeBucket"] {
  const hour = new Date(ts).getUTCHours();
  if (hour >= 0 && hour < 6) return "overnight";
  if (hour >= 6 && hour < 12) return "europe";
  if (hour >= 12 && hour < 20) return "us";
  return "asia";
}

export function buildRecentPostmortemFromJournal(path: string) {
  if (!existsSync(path)) {
    return buildPostmortem({ completedTrades: [], skipReasonCounts: {} });
  }

  const rows = readFileSync(path, "utf8")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => JSON.parse(x) as RawRow);

  const skipReasonCounts: Record<string, number> = {};
  const completedTrades: CompletedTrade[] = [];

  for (const row of rows) {
    if (row.type === "decision" && row.decision === "skip") {
      const reason = String(row.reason ?? "unknown");
      skipReasonCounts[reason] = (skipReasonCounts[reason] ?? 0) + 1;
    }

    if (row.type === "order" && row.side === "sell") {
      const ts = row.ts ?? new Date().toISOString();
      completedTrades.push({
        ts,
        regime: String(row.regime ?? "unknown"),
        timeBucket: hourToBucket(ts),
        lifecycleReason: String(row.reason ?? "unknown"),
        realizedPnlUsd: Number(row.realizedPnlUsd ?? 0),
        strategyVersion: String(row.strategyVersion ?? "unknown")
      });
    }
  }

  return buildPostmortem({ completedTrades, skipReasonCounts });
}
