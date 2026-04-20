import type { Broker } from "../broker/Broker.js";
import type { Order, SymbolPair } from "../types.js";

export class OrderManager {
  constructor(private readonly broker: Broker) {}

  async placeEntry(symbol: SymbolPair, price: number, notionalUsd: number): Promise<Order> {
    if (symbol !== "BTC-USD") throw new Error("Only BTC-USD supported.");
    if (notionalUsd > 1) throw new Error("Order notional exceeds hard cap of $1.");
    return this.broker.placeLimitOrder({
      symbol,
      side: "buy",
      type: "limit",
      limitPrice: price,
      notionalUsd,
      clientOrderId: `entry-${Date.now()}`
    });
  }

  async placeExit(symbol: SymbolPair, price: number, notionalUsd: number): Promise<Order> {
    return this.broker.placeLimitOrder({
      symbol,
      side: "sell",
      type: "limit",
      limitPrice: price,
      notionalUsd,
      clientOrderId: `exit-${Date.now()}`
    });
  }
}
