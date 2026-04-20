import type { Mode, SymbolPair } from "../types.js";

export const APPROVAL_REASONS = {
  APPROVED_PAPER_AUTO: "approved_paper_auto",
  REJECTED_MANUAL_REQUIRED: "rejected_manual_required",
  REJECTED_MISSING_APPROVAL_TOKEN: "rejected_missing_approval_token",
  APPROVED_MANUAL_TOKEN: "approved_manual_token"
} as const;

export type ApprovalReason = (typeof APPROVAL_REASONS)[keyof typeof APPROVAL_REASONS];

export interface ApprovalRequest {
  mode: Mode;
  symbol: SymbolPair;
  action: "enter" | "exit";
  orderUsd: number;
  strategyVersion: string;
  context: Record<string, unknown>;
  approvalToken?: string;
}

export interface ApprovalDecision {
  approved: boolean;
  reason: ApprovalReason;
  reviewer: "system" | "manual-policy";
}

export interface ApprovalPolicy {
  name: "paper-auto" | "manual-live";
  evaluate(request: ApprovalRequest): ApprovalDecision;
}
