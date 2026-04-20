import { rmSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PaperBroker } from "../src/broker/PaperBroker.js";

describe("PaperBroker persistence", () => {
  it("persists open position state across instances", async () => {
    const tmpDir = join("tests", "tmp", `paper-${Date.now()}`);
    rmSync(tmpDir, { recursive: true, force: true });

    const first = new PaperBroker(10, 0, 0, tmpDir);
    await first.placeLimitOrder({
      symbol: "BTC-USD",
      side: "buy",
      type: "limit",
      limitPrice: 100,
      notionalUsd: 1,
      clientOrderId: "t1"
    });

    const second = new PaperBroker(10, 0, 0, tmpDir);
    const open = await second.getOpenPosition("BTC-USD");
    expect(open).not.toBeNull();
    expect(open?.entryPrice).toBe(100);
  });
});
