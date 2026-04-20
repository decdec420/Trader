import { join } from "node:path";
import { readJsonFile, writeJsonFile } from "../utils/fs.js";
import type { StrategyParams } from "../types.js";

export type StrategyStage = "candidate" | "approved" | "live";
export interface StrategyVersion {
  version: string;
  params: StrategyParams;
  stage: StrategyStage;
  createdAt: string;
  notes: string;
}

interface RegistryFile {
  versions: StrategyVersion[];
}

export class StrategyRegistry {
  private readonly filePath: string;

  constructor(dataDir: string) {
    this.filePath = join(dataDir, "strategy-registry.json");
  }

  list(): StrategyVersion[] {
    return readJsonFile<RegistryFile>(this.filePath, { versions: [] }).versions;
  }

  save(v: StrategyVersion): void {
    const cur = this.list().filter((x) => x.version !== v.version);
    cur.push(v);
    writeJsonFile(this.filePath, { versions: cur });
  }

  get(version: string): StrategyVersion | undefined {
    return this.list().find((v) => v.version === version);
  }

  promote(version: string, stage: StrategyStage): StrategyVersion {
    const existing = this.get(version);
    if (!existing) throw new Error(`Strategy version not found: ${version}`);
    const updated = { ...existing, stage };
    this.save(updated);
    return updated;
  }
}
