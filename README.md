# crypto-bot

A cautious, auditable TypeScript Node.js crypto learning bot for **BTC-USD** using:
- research mode
- paper trading mode
- controlled learning mode
- optional live mode (explicitly gated)

## Paper mode first

Default mode is paper trading. Live mode is blocked unless:
1. `LIVE_TRADING=true`
2. API credentials are present
3. `APPROVED_STRATEGY_VERSION` is set

## Setup

```bash
pnpm install
cp .env.example .env
pnpm typecheck
pnpm test
```

## Commands

- `pnpm bot:status`
- `pnpm bot:scan`
- `pnpm bot:research`
- `pnpm bot:paper`
- `pnpm bot:learn`
- `pnpm bot:live`
- `pnpm bot:journal`
- `pnpm bot:promote`

## How it works

1. Candle loader gets 5m candles.
2. Indicator library computes MA20 + basic volatility.
3. Regime classifier labels market (trend/chop/high-vol/no-trade).
4. Signal engine triggers long-only entry on pullback-recovery above prior high.
5. Risk + portfolio guard enforces limits:
   - max order $1
   - max 2 trades/day
   - max daily loss $1
   - max open positions 1
   - spread and staleness checks
   - no market orders, no shorting, no averaging down, no martingale
6. Paper broker simulates fills with fee/slippage assumptions.
7. Learning manager evaluates paper results and proposes **small** parameter changes.
8. Strategy registry tracks candidate/approved/live versions.
9. Live mode uses locked approved strategy only.

## Research + paper + learning workflow

1. Run research:
   - `pnpm bot:research`
2. Run paper simulation:
   - `pnpm bot:paper`
3. Run controlled learning:
   - `pnpm bot:learn`
4. Promote vetted version:
   - `pnpm bot:promote`
5. Optional live:
   - `pnpm bot:live`

Live strategy does **not** auto-mutate from learning output.

## Risks and limitations

- Educational system, not financial advice.
- Single asset (BTC-USD), single strategy.
- Robinhood endpoint specifics are isolated in typed adapter methods with documented assumptions.
- No aggressive retries; API failures fail safe.
- Backtest quality depends on data fidelity and fee/slippage assumptions.

## Sample logs

```json
{"level":30,"time":1710000000000,"mode":"paper","msg":"scan.start"}
{"level":30,"time":1710000000010,"symbol":"BTC-USD","regime":"trend","msg":"research.observation"}
{"level":30,"time":1710000000020,"decision":"skip","reason":"spread_too_wide","msg":"trade.decision"}
{"level":30,"time":1710000000030,"strategyVersion":"v1","msg":"learning.recommendation.none"}
```
