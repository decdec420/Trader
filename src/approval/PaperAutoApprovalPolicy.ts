import { APPROVAL_REASONS, type ApprovalDecision, type ApprovalPolicy, type ApprovalRequest } from "./ApprovalPolicy.js";

export class PaperAutoApprovalPolicy implements ApprovalPolicy {
  readonly name = "paper-auto" as const;

  evaluate(_request: ApprovalRequest): ApprovalDecision {
    return {
      approved: true,
      reason: APPROVAL_REASONS.APPROVED_PAPER_AUTO,
      reviewer: "system"
    };
  }
}
