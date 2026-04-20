import type { AccountSnapshot, Candle, Order, OrderRequest, Position, Quote, SymbolPair } from "../types.js";

export interface Broker {
  name: "paper" | "robinhood-live";
  getAccount(): Promise<AccountSnapshot>;
  getQuote(symbol: SymbolPair): Promise<Quote>;
  getCandles(symbol: SymbolPair, interval: "5m", limit: number): Promise<Candle[]>;
  getOpenOrder(): Promise<Order | null>;
  getOpenPosition(symbol: SymbolPair): Promise<Position | null>;
  placeLimitOrder(req: OrderRequest): Promise<Order>;
  cancelOrder(orderId: string): Promise<void>;
}
