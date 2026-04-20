import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envBooleanSchema = z.union([z.boolean(), z.string()]).transform((value, ctx) => {
  if (typeof value === "boolean") return value;

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;

  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: "Expected boolean string 'true' or 'false'."
  });
  return z.NEVER;
});

export function parseEnvBoolean(value: unknown): boolean {
  return envBooleanSchema.parse(value);
}

export const envSchema = z.object({
  ROBINHOOD_API_KEY: z.string().optional().default(""),
  ROBINHOOD_API_SECRET: z.string().optional().default(""),
  PAPER_TRADING: envBooleanSchema.default(true),
  LIVE_TRADING: envBooleanSchema.default(false),
  MAX_ORDER_USD: z.coerce.number().positive().max(1).default(1),
  MAX_DAILY_TRADES: z.coerce.number().int().positive().max(2).default(2),
  MAX_DAILY_LOSS_USD: z.coerce.number().positive().max(1).default(1),
  MIN_BALANCE_USD: z.coerce.number().positive().default(8),
  APPROVED_STRATEGY_VERSION: z.string().optional().default(""),
  FEE_BPS: z.coerce.number().min(0).max(1000).default(10),
  SLIPPAGE_BPS: z.coerce.number().min(0).max(1000).default(10),
  MAX_SPREAD_BPS: z.coerce.number().min(1).max(500).default(30),
  STALE_CANDLE_SECONDS: z.coerce.number().int().positive().default(180),
  DATA_DIR: z.string().default("./data"),
  LIVE_APPROVAL_TOKEN: z.string().optional().default("")
});

export type AppConfig = z.infer<typeof envSchema>;

export function parseAppConfig(input: Record<string, unknown>): AppConfig {
  return envSchema.parse(input);
}

export const config: AppConfig = parseAppConfig(process.env);

export function assertLiveTradingAllowed(cfg: AppConfig): void {
  if (!cfg.LIVE_TRADING) {
    throw new Error("Live trading is disabled. Set LIVE_TRADING=true explicitly.");
  }
  if (!cfg.ROBINHOOD_API_KEY || !cfg.ROBINHOOD_API_SECRET) {
    throw new Error("Live trading blocked: Robinhood API credentials are missing.");
  }
  if (!cfg.APPROVED_STRATEGY_VERSION) {
    throw new Error("Live trading blocked: APPROVED_STRATEGY_VERSION is required.");
  }
}
