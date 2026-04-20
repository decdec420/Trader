import { APPROVAL_REASONS, type ApprovalDecision, type ApprovalPolicy, type ApprovalRequest } from "./ApprovalPolicy.js";

export class ManualApprovalPolicy implements ApprovalPolicy {
  readonly name = "manual-live" as const;

  constructor(private readonly expectedToken: string) {}

  evaluate(request: ApprovalRequest): ApprovalDecision {
    if (!request.approvalToken) {
      return {
        approved: false,
        reason: APPROVAL_REASONS.REJECTED_MANUAL_REQUIRED,
        reviewer: "manual-policy"
      };
    }

    if (!this.expectedToken || request.approvalToken !== this.expectedToken) {
      return {
        approved: false,
        reason: APPROVAL_REASONS.REJECTED_MISSING_APPROVAL_TOKEN,
        reviewer: "manual-policy"
      };
    }

    return {
      approved: true,
      reason: APPROVAL_REASONS.APPROVED_MANUAL_TOKEN,
      reviewer: "manual-policy"
    };
  }
}
