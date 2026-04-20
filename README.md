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

## v2 architecture pass (current)

This pass adds six disciplined upgrades:
1. persistent paper portfolio state (`data/paper-portfolio.json`)
2. trade lifecycle engine for stop-loss / take-profit / no-overnight exits
3. typed reason taxonomy for signal/risk/lifecycle decisions
4. setup scoring system with auditable score breakdown
5. time-of-day + volatility risk filters
6. metrics aggregation with LLM-ready summary payloads

## How it works

1. Candle loader gets 5m candles.
2. Indicator library computes MA20 + realized volatility.
3. Regime classifier labels market (trend/chop/high-vol/no-trade).
4. Signal engine detects pullback-recovery entries above MA.
5. Lifecycle engine manages exits from open positions:
   - stop loss hit
   - take profit hit
   - end-of-day exit (no overnight v1)
6. Risk manager enforces strict filters:
   - max order $1
   - max 2 trades/day
   - max daily loss $1
   - max open positions/order
   - spread + staleness checks
   - trading window (UTC)
   - volatility guard
7. Setup score gates entries so low-quality setups are skipped.
8. Journals track decisions/orders and metrics aggregator emits dashboard + LLM-ready summaries.

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
- Paper market model is simplistic and intended for guarded learning, not production alpha claims.
