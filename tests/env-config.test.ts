import { describe, expect, it } from "vitest";
import { parseAppConfig, parseEnvBoolean } from "../src/config/env.js";

describe("env boolean parsing", () => {
  it("parses 'true' as true", () => {
    expect(parseEnvBoolean("true")).toBe(true);
  });

  it("parses 'false' as false", () => {
    expect(parseEnvBoolean("false")).toBe(false);
  });

  it("throws for invalid boolean strings", () => {
    expect(() => parseEnvBoolean("yes")).toThrow();
  });

  it("parses LIVE_TRADING=false from config input", () => {
    const parsed = parseAppConfig({ LIVE_TRADING: "false" });
    expect(parsed.LIVE_TRADING).toBe(false);
  });
});
