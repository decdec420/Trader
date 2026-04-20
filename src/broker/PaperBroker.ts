import { join } from "node:path";
import type { Broker } from "./Broker.js";
import type { AccountSnapshot, Candle, Order, OrderRequest, Position, Quote, SymbolPair } from "../types.js";
import { nowIso, utcDateKey } from "../utils/time.js";
import { readJsonFile, writeJsonFile } from "../utils/fs.js";

interface PaperState {
  balanceUsd: number;
  equityUsd: number;
  dailyRealizedPnlByDate: Record<string, number>;
  dailyTradesByDate: Record<string, number>;
  openOrder: Order | null;
  position: Position | null;
}

export class PaperBroker implements Broker {
  readonly name = "paper" as const;
  private state: PaperState;
  private readonly feeBps: number;
  private readonly slippageBps: number;
  private readonly statePath: string;

  constructor(initialBalance = 10, feeBps = 10, slippageBps = 10, dataDir = "./data") {
    this.feeBps = feeBps;
    this.slippageBps = slippageBps;
    this.statePath = join(dataDir, "paper-portfolio.json");

    this.state = readJsonFile<PaperState>(this.statePath, {
      balanceUsd: initialBalance,
      equityUsd: initialBalance,
      dailyRealizedPnlByDate: {},
      dailyTradesByDate: {},
      openOrder: null,
      position: null
    });
  }

  private persist(): void {
    writeJsonFile(this.statePath, this.state);
  }

  async getAccount(): Promise<AccountSnapshot> {
    const k = utcDateKey();
    return {
      balanceUsd: this.state.balanceUsd,
      equityUsd: this.state.equityUsd,
      dailyRealizedPnlUsd: this.state.dailyRealizedPnlByDate[k] ?? 0,
      dailyTrades: this.state.dailyTradesByDate[k] ?? 0
    };
  }

  async getQuote(symbol: SymbolPair): Promise<Quote> {
    if (symbol !== "BTC-USD") throw new Error("PaperBroker supports BTC-USD only.");
    const mid = 65000;
    const spread = 10;
    return { symbol, bid: mid - spread / 2, ask: mid + spread / 2, timestamp: nowIso() };
  }

  async getCandles(symbol: SymbolPair, _interval: "5m", limit: number): Promise<Candle[]> {
    if (symbol !== "BTC-USD") throw new Error("PaperBroker supports BTC-USD only.");
    const candles: Candle[] = [];
    let px = 65000;
    for (let i = limit; i > 0; i--) {
      const t = new Date(Date.now() - i * 5 * 60 * 1000);
      const n = Math.sin(i / 5) * 25;
      const open = px;
      const close = px + n;
      const high = Math.max(open, close) + 8;
      const low = Math.min(open, close) - 8;
      candles.push({
        symbol,
        open,
        high,
        low,
        close,
        volume: 1,
        startedAt: t.toISOString(),
        endedAt: new Date(t.getTime() + 5 * 60 * 1000).toISOString()
      });
      px = close;
    }
    return candles;
  }

  async getOpenOrder(): Promise<Order | null> {
    return this.state.openOrder;
  }

  async getOpenPosition(symbol: SymbolPair): Promise<Position | null> {
    if (symbol !== "BTC-USD") return null;
    return this.state.position;
  }

  async placeLimitOrder(req: OrderRequest): Promise<Order> {
    if (req.type !== "limit") throw new Error("PaperBroker supports limit orders only.");

    const order: Order = {
      id: `paper-${Date.now()}`,
      status: "filled",
      request: req,
      createdAt: nowIso(),
      filledPrice:
        req.side === "buy"
          ? req.limitPrice * (1 + this.slippageBps / 10000)
          : req.limitPrice * (1 - this.slippageBps / 10000)
    };

    const fee = req.notionalUsd * (this.feeBps / 10000);
    const k = utcDateKey();
    this.state.dailyTradesByDate[k] = (this.state.dailyTradesByDate[k] ?? 0) + 1;

    if (req.side === "buy") {
      const qty = req.notionalUsd / (order.filledPrice ?? req.limitPrice);
      this.state.position = {
        symbol: req.symbol,
        qty,
        entryPrice: order.filledPrice ?? req.limitPrice,
        openedAt: nowIso()
      };
      this.state.balanceUsd -= req.notionalUsd + fee;
    } else {
      const pos = this.state.position;
      if (!pos) throw new Error("No open position to sell.");
      const proceeds = pos.qty * (order.filledPrice ?? req.limitPrice);
      const costBasis = pos.qty * pos.entryPrice;
      const pnl = proceeds - costBasis;
      this.state.balanceUsd += proceeds - fee;
      this.state.dailyRealizedPnlByDate[k] = (this.state.dailyRealizedPnlByDate[k] ?? 0) + pnl - fee;
      this.state.position = null;
    }

    this.state.equityUsd = this.state.balanceUsd;
    this.persist();
    return order;
  }

  async cancelOrder(_orderId: string): Promise<void> {
    this.state.openOrder = null;
    this.persist();
  }
}
