import type { Mode } from "../types.js";
import { ManualApprovalPolicy } from "./ManualApprovalPolicy.js";
import { PaperAutoApprovalPolicy } from "./PaperAutoApprovalPolicy.js";
import type { ApprovalPolicy } from "./ApprovalPolicy.js";

export function createApprovalPolicy(mode: Mode, liveToken: string): ApprovalPolicy {
  if (mode === "live") {
    return new ManualApprovalPolicy(liveToken);
  }
  return new PaperAutoApprovalPolicy();
}
