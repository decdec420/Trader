import type { PostmortemPayload } from "./postmortem-builder.js";
import type { CapitalPreservationDoctrine } from "../doctrine/capital-preservation.js";

export interface LlmAnalystPayload {
  context: "slow_brain_postmortem";
  doctrineVersion: string;
  postmortem: PostmortemPayload;
  focusQuestions: string[];
}

export function toLlmAnalystPayload(postmortem: PostmortemPayload, doctrine: CapitalPreservationDoctrine): LlmAnalystPayload {
  return {
    context: "slow_brain_postmortem",
    doctrineVersion: doctrine.doctrineVersion,
    postmortem,
    focusQuestions: [
      "Are skips increasing in high-volatility periods?",
      "Is candidate strategy performance stable enough for continued paper testing?",
      "Are lifecycle exits dominated by stop-loss events?"
    ]
  };
}
