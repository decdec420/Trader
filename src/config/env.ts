import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const TRUE_VALUES = new Set(["true", "1", "yes", "on"]);
const FALSE_VALUES = new Set(["false", "0", "no", "off"]);

function parseBooleanEnv(
  value: string | undefined,
  defaultValue: boolean,
  envName: string,
): boolean {
  if (value == null || value.trim() === "") {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();

  if (TRUE_VALUES.has(normalized)) {
    return true;
  }

  if (FALSE_VALUES.has(normalized)) {
    return false;
  }

  throw new Error(
    `Invalid boolean value for ${envName}: "${value}". Expected one of: true, false, 1, 0, yes, no, on, off.`,
  );
}

const rawEnvSchema = z.object({
  ROBINHOOD_API_KEY: z.string().optional(),
  ROBINHOOD_API_SECRET: z.string().optional(),
  PAPER_TRADING: z.string().optional(),
  LIVE_TRADING: z.string().optional(),
  MAX_ORDER_USD: z.coerce.number().positive().max(1).default(1),
  MAX_DAILY_TRADES: z.coerce.number().int().positive().max(2).default(2),
  MAX_DAILY_LOSS_USD: z.coerce.number().positive().max(1).default(1),
  MIN_BALANCE_USD: z.coerce.number().positive().default(8),
  APPROVED_STRATEGY_VERSION: z.string().optional(),
  FEE_BPS: z.coerce.number().min(0).max(1000).default(10),
  SLIPPAGE_BPS: z.coerce.number().min(0).max(1000).default(10),
  MAX_SPREAD_BPS: z.coerce.number().min(1).max(500).default(30),
  STALE_CANDLE_SECONDS: z.coerce.number().int().positive().default(180),
  DATA_DIR: z.string().default("./data"),
});

const rawEnv = rawEnvSchema.parse(process.env);

export const config = {
  ROBINHOOD_API_KEY: rawEnv.ROBINHOOD_API_KEY ?? "",
  ROBINHOOD_API_SECRET: rawEnv.ROBINHOOD_API_SECRET ?? "",
  PAPER_TRADING: parseBooleanEnv(
    rawEnv.PAPER_TRADING,
    true,
    "PAPER_TRADING",
  ),
  LIVE_TRADING: parseBooleanEnv(
    rawEnv.LIVE_TRADING,
    false,
    "LIVE_TRADING",
  ),
  MAX_ORDER_USD: rawEnv.MAX_ORDER_USD,
  MAX_DAILY_TRADES: rawEnv.MAX_DAILY_TRADES,
  MAX_DAILY_LOSS_USD: rawEnv.MAX_DAILY_LOSS_USD,
  MIN_BALANCE_USD: rawEnv.MIN_BALANCE_USD,
  APPROVED_STRATEGY_VERSION: rawEnv.APPROVED_STRATEGY_VERSION ?? "",
  FEE_BPS: rawEnv.FEE_BPS,
  SLIPPAGE_BPS: rawEnv.SLIPPAGE_BPS,
  MAX_SPREAD_BPS: rawEnv.MAX_SPREAD_BPS,
  STALE_CANDLE_SECONDS: rawEnv.STALE_CANDLE_SECONDS,
  DATA_DIR: rawEnv.DATA_DIR,
} as const;

export type AppConfig = typeof config;

export function assertLiveTradingAllowed(cfg: AppConfig): void {
  if (!cfg.LIVE_TRADING) {
    throw new Error(
      "Live trading is disabled. Set LIVE_TRADING=true explicitly.",
    );
  }

  if (!cfg.ROBINHOOD_API_KEY || !cfg.ROBINHOOD_API_SECRET) {
    throw new Error(
      "Live trading blocked: Robinhood API credentials are missing.",
    );
  }

  if (!cfg.APPROVED_STRATEGY_VERSION) {
    throw new Error(
      "Live trading blocked: APPROVED_STRATEGY_VERSION is required.",
    );
  }
}
