export interface CapitalPreservationDoctrine {
  doctrineVersion: "v1";
  principles: {
    preserveCapitalFirst: true;
    noTradeIsValid: true;
    overtradingIsFailure: true;
    liveRequiresApproval: true;
    scalingMustBeEarned: true;
    candidateNotTrustedByDefault: true;
    learningCannotOverrideGuardrails: true;
  };
  hardRules: {
    maxOrderUsdHardCap: 1;
    maxDailyTradesHardCap: 2;
    maxDailyLossUsdHardCap: 1;
    minBalanceUsdKillSwitch: 8;
    symbolWhitelist: ["BTC-USD"];
  };
}

export const CAPITAL_PRESERVATION_DOCTRINE: CapitalPreservationDoctrine = {
  doctrineVersion: "v1",
  principles: {
    preserveCapitalFirst: true,
    noTradeIsValid: true,
    overtradingIsFailure: true,
    liveRequiresApproval: true,
    scalingMustBeEarned: true,
    candidateNotTrustedByDefault: true,
    learningCannotOverrideGuardrails: true
  },
  hardRules: {
    maxOrderUsdHardCap: 1,
    maxDailyTradesHardCap: 2,
    maxDailyLossUsdHardCap: 1,
    minBalanceUsdKillSwitch: 8,
    symbolWhitelist: ["BTC-USD"]
  }
};

export function validateDoctrineInvariants(): void {
  if (CAPITAL_PRESERVATION_DOCTRINE.hardRules.maxOrderUsdHardCap > 1) {
    throw new Error("Doctrine invariant failed: maxOrderUsdHardCap must be <= $1.");
  }
  if (!CAPITAL_PRESERVATION_DOCTRINE.principles.liveRequiresApproval) {
    throw new Error("Doctrine invariant failed: live must require approval.");
  }
}
