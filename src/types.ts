export type SymbolPair = "BTC-USD";
export type Mode = "research" | "paper" | "learn" | "live";

export interface Candle {
  symbol: SymbolPair;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  startedAt: string;
  endedAt: string;
}

export interface Quote {
  symbol: SymbolPair;
  bid: number;
  ask: number;
  timestamp: string;
}

export interface Position {
  symbol: SymbolPair;
  qty: number;
  entryPrice: number;
  openedAt: string;
}

export interface OrderRequest {
  symbol: SymbolPair;
  side: "buy" | "sell";
  type: "limit";
  limitPrice: number;
  notionalUsd: number;
  clientOrderId: string;
}

export interface Order {
  id: string;
  status: "open" | "filled" | "canceled" | "rejected";
  request: OrderRequest;
  filledPrice?: number;
  createdAt: string;
}

export interface AccountSnapshot {
  balanceUsd: number;
  equityUsd: number;
  dailyRealizedPnlUsd: number;
  dailyTrades: number;
}

export interface StrategyParams {
  maLength: number;
  stopLossPct: number;
  takeProfitPct: number;
  volatilityMaxPct: number;
  cooldownCandles: number;
}

export interface Signal {
  action: "buy" | "none";
  reason: string;
  stopLoss?: number;
  takeProfit?: number;
}

export type MarketRegime = "trend" | "chop" | "high_volatility" | "no_trade";
