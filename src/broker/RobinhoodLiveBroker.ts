import type { Broker } from "./Broker.js";
import type { AccountSnapshot, Candle, Order, OrderRequest, Position, Quote, SymbolPair } from "../types.js";
import { nowIso } from "../utils/time.js";

/**
 * Assumption note:
 * Robinhood Crypto Trading endpoint paths/headers may evolve.
 * Keep all uncertainties isolated in this adapter.
 * Replace `buildUrl(...)` paths with exact official documented endpoints in your environment.
 */
export class RobinhoodLiveBroker implements Broker {
  readonly name = "robinhood-live" as const;

  constructor(
    private readonly apiKey: string,
    private readonly apiSecret: string,
    private readonly baseUrl = "https://trading.robinhood.com"
  ) {}

  private buildUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(this.buildUrl(path), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": this.apiKey,
        "X-API-SECRET": this.apiSecret,
        ...(init?.headers ?? {})
      }
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Robinhood API error: ${res.status} ${body}`.slice(0, 500));
    }
    return (await res.json()) as T;
  }

  async getAccount(): Promise<AccountSnapshot> {
    const raw = await this.request<{ balance_usd: number; equity_usd: number }>("/api/v1/account");
    return {
      balanceUsd: raw.balance_usd,
      equityUsd: raw.equity_usd,
      dailyRealizedPnlUsd: 0,
      dailyTrades: 0
    };
  }

  async getQuote(symbol: SymbolPair): Promise<Quote> {
    const raw = await this.request<{ bid: number; ask: number }>(`/api/v1/market/quote?symbol=${symbol}`);
    return { symbol, bid: raw.bid, ask: raw.ask, timestamp: nowIso() };
  }

  async getCandles(symbol: SymbolPair, _interval: "5m", limit: number): Promise<Candle[]> {
    const raw = await this.request<Array<{ o: number; h: number; l: number; c: number; v: number; t: string }>>(
      `/api/v1/market/candles?symbol=${symbol}&interval=5m&limit=${limit}`
    );
    return raw.map((r) => ({
      symbol,
      open: r.o,
      high: r.h,
      low: r.l,
      close: r.c,
      volume: r.v,
      startedAt: r.t,
      endedAt: new Date(new Date(r.t).getTime() + 5 * 60 * 1000).toISOString()
    }));
  }

  async getOpenOrder(): Promise<Order | null> {
    const raw = await this.request<any[]>("/api/v1/orders?status=open&symbol=BTC-USD");
    const o = raw[0];
    if (!o) return null;
    return {
      id: String(o.id),
      status: "open",
      request: {
        symbol: "BTC-USD",
        side: o.side,
        type: "limit",
        limitPrice: Number(o.limit_price),
        notionalUsd: Number(o.notional_usd),
        clientOrderId: String(o.client_order_id ?? o.id)
      },
      createdAt: o.created_at
    };
  }

  async getOpenPosition(symbol: SymbolPair): Promise<Position | null> {
    const raw = await this.request<any[]>(`/api/v1/positions?symbol=${symbol}`);
    const p = raw[0];
    if (!p || Number(p.qty) <= 0) return null;
    return {
      symbol,
      qty: Number(p.qty),
      entryPrice: Number(p.entry_price),
      openedAt: p.opened_at
    };
  }

  async placeLimitOrder(req: OrderRequest): Promise<Order> {
    const raw = await this.request<any>("/api/v1/orders", {
      method: "POST",
      body: JSON.stringify(req)
    });

    return {
      id: String(raw.id),
      status: raw.status ?? "open",
      request: req,
      filledPrice: raw.filled_price ? Number(raw.filled_price) : undefined,
      createdAt: raw.created_at ?? nowIso()
    };
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.request(`/api/v1/orders/${orderId}/cancel`, { method: "POST" });
  }
}
