import type { AppConfig } from "../config/env.js";

export class PortfolioGuard {
  constructor(private readonly cfg: AppConfig) {}

  canEnterLiveMode(): { ok: boolean; reason: string } {
    if (!this.cfg.LIVE_TRADING) return { ok: false, reason: "live_disabled" };
    if (!this.cfg.ROBINHOOD_API_KEY || !this.cfg.ROBINHOOD_API_SECRET) return { ok: false, reason: "missing_api_credentials" };
    if (!this.cfg.APPROVED_STRATEGY_VERSION) return { ok: false, reason: "missing_approved_strategy_version" };
    return { ok: true, reason: "ok" };
  }
}
