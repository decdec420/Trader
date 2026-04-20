export const SIGNAL_REASONS = {
  INSUFFICIENT_CANDLES: "insufficient_candles",
  MA_UNAVAILABLE: "ma_unavailable",
  NOT_ABOVE_MA: "not_above_ma",
  NO_PULLBACK: "no_pullback",
  NO_RECOVERY_BREAK: "no_recovery_break",
  PULLBACK_RECOVERY_ABOVE_MA: "pullback_recovery_above_ma"
} as const;

export type SignalReason = (typeof SIGNAL_REASONS)[keyof typeof SIGNAL_REASONS];

export const RISK_REASONS = {
  OK: "ok",
  SYMBOL_NOT_ALLOWED: "symbol_not_allowed",
  ORDER_SIZE_TOO_LARGE: "order_size_too_large",
  EXISTING_OPEN_ORDER_OR_POSITION: "existing_open_order_or_position",
  DAILY_TRADE_LIMIT_REACHED: "daily_trade_limit_reached",
  DAILY_LOSS_LIMIT_REACHED: "daily_loss_limit_reached",
  BALANCE_BELOW_KILL_SWITCH: "balance_below_kill_switch",
  SPREAD_TOO_WIDE: "spread_too_wide",
  QUOTE_STALE: "quote_stale",
  CANDLE_STALE: "candle_stale",
  OUTSIDE_TRADING_WINDOW: "outside_trading_window",
  VOLATILITY_TOO_HIGH: "volatility_too_high"
} as const;

export type RiskReason = (typeof RISK_REASONS)[keyof typeof RISK_REASONS];

export const LIFECYCLE_REASONS = {
  HOLD: "hold",
  STOP_LOSS_HIT: "stop_loss_hit",
  TAKE_PROFIT_HIT: "take_profit_hit",
  END_OF_DAY_EXIT: "end_of_day_exit"
} as const;

export type LifecycleReason = (typeof LIFECYCLE_REASONS)[keyof typeof LIFECYCLE_REASONS];

export type DecisionReason = SignalReason | RiskReason | LifecycleReason;
