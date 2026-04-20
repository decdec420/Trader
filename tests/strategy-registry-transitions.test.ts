import { rmSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { StrategyRegistry } from "../src/learning/StrategyRegistry.js";
import { defaultStrategy } from "../src/app/defaultStrategy.js";

describe("StrategyRegistry transitions", () => {
  it("allows valid seeded -> candidate -> approved -> live transitions", () => {
    const dir = join("tests", "tmp", `registry-${Date.now()}`);
    rmSync(dir, { recursive: true, force: true });

    const reg = new StrategyRegistry(dir);
    reg.save({ version: "s1", params: defaultStrategy, stage: "seeded", createdAt: new Date().toISOString(), notes: "seed" });
    reg.transition("s1", "candidate");
    reg.transition("s1", "approved");
    const live = reg.setLive("s1");

    expect(live.stage).toBe("live");
  });

  it("fails loudly for invalid candidate -> live transition", () => {
    const dir = join("tests", "tmp", `registry-${Date.now()}-invalid`);
    rmSync(dir, { recursive: true, force: true });

    const reg = new StrategyRegistry(dir);
    reg.save({ version: "s2", params: defaultStrategy, stage: "candidate", createdAt: new Date().toISOString(), notes: "candidate" });
    expect(() => reg.transition("s2", "live")).toThrow();
  });

  it("blocks reuse of retired strategies", () => {
    const dir = join("tests", "tmp", `registry-${Date.now()}-retired`);
    rmSync(dir, { recursive: true, force: true });

    const reg = new StrategyRegistry(dir);
    reg.save({ version: "s3", params: defaultStrategy, stage: "seeded", createdAt: new Date().toISOString(), notes: "seed" });
    reg.transition("s3", "retired");
    expect(() => reg.transition("s3", "candidate")).toThrow();
  });
});
