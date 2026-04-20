import type { Candle } from "../types.js";

export function sma(values: number[], length: number): number | null {
  if (values.length < length) return null;
  const tail = values.slice(-length);
  const sum = tail.reduce((a, b) => a + b, 0);
  return sum / length;
}

export function maFromCandles(candles: Candle[], length: number): number | null {
  return sma(candles.map((c) => c.close), length);
}

export function realizedVolatilityPct(candles: Candle[], lookback = 20): number {
  const closes = candles.map((c) => c.close);
  if (closes.length < lookback + 1) return 0;
  const returns: number[] = [];
  for (let i = closes.length - lookback; i < closes.length; i++) {
    const prev = closes[i - 1];
    returns.push(Math.abs((closes[i] - prev) / prev));
  }
  return (returns.reduce((a, b) => a + b, 0) / returns.length) * 100;
}
