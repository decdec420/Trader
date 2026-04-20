import type { Broker } from "../broker/Broker.js";
import type { Candle, SymbolPair } from "../types.js";
import { secondsSince } from "../utils/time.js";

export class CandleLoader {
  constructor(private readonly broker: Broker, private readonly staleSeconds: number) {}

  async load5m(symbol: SymbolPair, limit = 50): Promise<Candle[]> {
    const candles = await this.broker.getCandles(symbol, "5m", limit);
    if (candles.length === 0) throw new Error("No candles returned.");
    const newest = candles[candles.length - 1];
    if (secondsSince(newest.endedAt) > this.staleSeconds) {
      throw new Error(`Candle data is stale (${Math.round(secondsSince(newest.endedAt))}s).`);
    }
    return candles;
  }
}
