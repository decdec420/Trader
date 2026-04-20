import { appendNdjson } from "../utils/fs.js";
import { nowIso } from "../utils/time.js";

export class ResearchJournal {
  constructor(private readonly filePath: string) {}

  record(observation: {
    symbol: string;
    regime: string;
    reason: string;
    indicators: Record<string, number>;
  }): void {
    appendNdjson(this.filePath, { ts: nowIso(), ...observation });
  }
}
