import { join } from "node:path";
import { readJsonFile, writeJsonFile } from "../utils/fs.js";
import type { StrategyParams } from "../types.js";

export type StrategyStage = "seeded" | "candidate" | "approved" | "live" | "retired";
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

const ALLOWED_TRANSITIONS: Record<StrategyStage, StrategyStage[]> = {
  seeded: ["candidate", "retired"],
  candidate: ["approved", "retired"],
  approved: ["live", "retired"],
  live: ["approved", "retired"],
  retired: []
};

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

  listByStage(stage: StrategyStage): StrategyVersion[] {
    return this.list().filter((v) => v.stage === stage);
  }

  getLive(): StrategyVersion | undefined {
    return this.list().find((v) => v.stage === "live");
  }

  transition(version: string, toStage: StrategyStage): StrategyVersion {
    const existing = this.get(version);
    if (!existing) throw new Error(`Strategy version not found: ${version}`);

    if (existing.stage === "retired") {
      throw new Error(`Retired strategy cannot be transitioned without explicit restore logic: ${version}`);
    }

    const allowed = ALLOWED_TRANSITIONS[existing.stage];
    if (!allowed.includes(toStage)) {
      throw new Error(`Invalid strategy transition: ${existing.stage} -> ${toStage}`);
    }

    const updated = { ...existing, stage: toStage };
    this.save(updated);
    return updated;
  }

  setLive(version: string): StrategyVersion {
    const target = this.get(version);
    if (!target) throw new Error(`Strategy version not found: ${version}`);
    if (target.stage !== "approved") {
      throw new Error(`Only approved strategy can become live. Received stage: ${target.stage}`);
    }

    const currentLive = this.getLive();
    if (currentLive) {
      this.transition(currentLive.version, "approved");
    }

    return this.transition(version, "live");
  }
}
