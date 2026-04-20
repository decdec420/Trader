# crypto-bot

Safety-first TypeScript Node.js crypto learning system for **BTC-USD only**.

## Core posture

- paper-first by default
- live mode is explicitly gated
- no hype behavior, no HFT, no leverage
- capital preservation over trade frequency
- explainable decisions with typed reasons and journals

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
- `pnpm bot:summary`
- `pnpm bot:promote`

## Phase 2 (v2.5 foundation)

### 1) Approval layer

- `src/approval/ApprovalPolicy.ts` defines approval interfaces and typed reasons.
- `PaperAutoApprovalPolicy` auto-approves paper trades.
- `ManualApprovalPolicy` requires explicit token for live mode.
- Run scan flow logs approval decisions before any entry/exit order.

### 2) Strategy release lifecycle

Strategy stages now behave like releases:
- `seeded -> candidate -> approved -> live -> retired`
- retired strategies cannot be reused by default
- invalid transitions fail loudly
- live selection is explicit (`setLive`) and cannot auto-promote from candidate

### 3) Slow brain / postmortem engine

- Deterministic postmortem payloads in `src/analysis/postmortem-builder.ts`
- LLM-ready wrapper payload in `src/analysis/llm-payloads.ts`
- Journal-derived recent summary parser in `src/metrics/recent-summary.ts`

### 4) Capital scaling policy

- `src/risk/CapitalScalingPolicy.ts` recommends `hold`, `scale_up_small`, or `scale_down`
- conservative by default
- drawdown-aware downscaling
- minimum sample-size gates
- never exceeds hard caps

### 5) Capital preservation doctrine

- `src/doctrine/capital-preservation.ts` encodes hard principles and invariants
- doctrine invariant check runs at CLI startup

### 6) Dashboard-ready summaries

`pnpm bot:summary` emits structured payload with:
- live approval requirement
- active live strategy and stage
- candidate strategy queue
- recent trade summary + skip reasons
- regime/time-bucket distributions
- lifecycle transition counts
- scaling recommendation
- doctrine-based capital preservation status

## Safety rules (high level)

- BTC-USD only
- max order USD hard cap
- daily trade and daily loss caps
- spread/staleness guards
- no shorting / no market orders
- no overnight positions in lifecycle engine
- no live auto-approval by default

## Future LLM integration note

Current postmortem + summary payloads are deterministic and typed. They are prepared for future LLM analyst/copilot integration, but the system has no autonomous live trading authority.
