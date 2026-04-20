import { appendNdjson } from "../utils/fs.js";
import { nowIso } from "../utils/time.js";

export class TradeJournal {
  constructor(private readonly filePath: string) {}

  decision(payload: Record<string, unknown>): void {
    appendNdjson(this.filePath, { ts: nowIso(), type: "decision", ...payload });
  }

  order(payload: Record<string, unknown>): void {
    appendNdjson(this.filePath, { ts: nowIso(), type: "order", ...payload });
  }

  metric(payload: Record<string, unknown>): void {
    appendNdjson(this.filePath, { ts: nowIso(), type: "metric", ...payload });
  }
}
