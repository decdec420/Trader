import { config } from "../config/env.js";
import type { Broker } from "./Broker.js";
import { PaperBroker } from "./PaperBroker.js";
import { RobinhoodLiveBroker } from "./RobinhoodLiveBroker.js";

export function createBroker(mode: "paper" | "live"): Broker {
  if (mode === "paper") {
    return new PaperBroker(10, config.FEE_BPS, config.SLIPPAGE_BPS, config.DATA_DIR);
  }
  return new RobinhoodLiveBroker(config.ROBINHOOD_API_KEY, config.ROBINHOOD_API_SECRET);
}
