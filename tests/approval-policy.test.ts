import { describe, expect, it } from "vitest";
import { PaperAutoApprovalPolicy } from "../src/approval/PaperAutoApprovalPolicy.js";
import { ManualApprovalPolicy } from "../src/approval/ManualApprovalPolicy.js";
import { APPROVAL_REASONS } from "../src/approval/ApprovalPolicy.js";

describe("Approval policies", () => {
  it("paper auto policy approves by default", () => {
    const decision = new PaperAutoApprovalPolicy().evaluate({
      mode: "paper",
      symbol: "BTC-USD",
      action: "enter",
      orderUsd: 1,
      strategyVersion: "paper-v1",
      context: {}
    });
    expect(decision.approved).toBe(true);
    expect(decision.reason).toBe(APPROVAL_REASONS.APPROVED_PAPER_AUTO);
  });

  it("manual live policy rejects when no token is provided", () => {
    const decision = new ManualApprovalPolicy("expected").evaluate({
      mode: "live",
      symbol: "BTC-USD",
      action: "enter",
      orderUsd: 1,
      strategyVersion: "v1",
      context: {}
    });
    expect(decision.approved).toBe(false);
    expect(decision.reason).toBe(APPROVAL_REASONS.REJECTED_MANUAL_REQUIRED);
  });

  it("manual live policy approves only when token matches", () => {
    const decision = new ManualApprovalPolicy("expected").evaluate({
      mode: "live",
      symbol: "BTC-USD",
      action: "enter",
      orderUsd: 1,
      strategyVersion: "v1",
      context: {},
      approvalToken: "expected"
    });
    expect(decision.approved).toBe(true);
    expect(decision.reason).toBe(APPROVAL_REASONS.APPROVED_MANUAL_TOKEN);
  });
});
