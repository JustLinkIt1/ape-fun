# ApeStation — Implementation Plan

## What We're Building
ApeStation is a Solana memecoin launchpad with a Clanker-inspired fee model, rich
social metadata (Twitter/Telegram), and a first-class API for AI agents to deploy
tokens programmatically. Tokens graduate to Raydium when they hit the market-cap
threshold, after which creators and requestors earn a perpetual share of LP fees.

---

## Tech Stack
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS
- **State**: TanStack Query, Zustand
- **Wallet**: @solana/wallet-adapter-react
- **Real-time**: Socket.io
- **Charts**: Lightweight Charts
- **UI**: Radix UI + Framer Motion
- **Blockchain**: Solana (@solana/web3.js, @solana/spl-token, Metaplex UMI)
- **DEX graduation**: Raydium AMM

---

## Fee Model (Clanker-Style)

### Fee Tiers
| Event | Fee | Who Pays |
|---|---|---|
| Token creation (flat) | 0.02 SOL | Creator |
| Buy/Sell (bonding curve) | 1% of trade | Buyer/Seller |
| Raydium LP fee (post-graduation) | 0.25% per swap | Swapper |

### Fee Distribution
**On every bonding-curve trade (1% total):**
- 0.5% → ApeStation treasury
- 0.3% → Token creator (claimable)
- 0.2% → Requestor wallet (the agent/referrer that initiated the launch; defaults to creator if self-launched)

**After Raydium graduation (0.25% LP fee):**
- 0.15% → ApeStation treasury
- 0.07% → Token creator (streaming via fee vault)
- 0.03% → Original requestor

**Creation fee (0.02 SOL):**
- 100% → ApeStation treasury (anti-spam + sustainability)

### Fee Vault Contract (Python / on-chain logic)
- `FeeVault` PDA per token stores claimable balances
- Creator and requestor call `claimFees(tokenMint)` at any time
- Treasury withdrawals restricted to ApeStation authority key
- Fees accumulate in SOL (wrapped via wsol swap for simplicity)

---

## Task Tracking
- [ ] Not Started
- [🔄] In Progress
- [✅] Completed
- [❌] Blocked

---

## Phase 1: Rename & Rebrand (Day 1) ✅ scaffold done

- [ ] **1.1** Rename all UI copy from "Ape Fun" / "Launch.fun" → "ApeStation"
- [ ] **1.2** Update `README.md`, `AGENTS.md`, and `package.json` names
- [ ] **1.3** New color theme: deep space dark (#0A0A0F) + electric blue accent (#4F7FFF)
- [ ] **1.4** Update favicon and OG image to ApeStation brand
- [ ] **1.5** Update `tailwind.config.js` with new design tokens

---

## Phase 2: Social Metadata on Tokens (Day 2-3)

### Token Schema Additions
Every token now carries optional social links and is indexed by them.

**TypeScript type update (`types/index.ts`):**
```ts
export interface Token {
  address: string
  name: string
  symbol: string
  description: string
  imageUrl: string
  // social
  twitter?: string    // handle without @, e.g. "elonmusk"
  telegram?: string   // t.me slug, e.g. "apestationofficial"
  website?: string
  // launch metadata
  requestorWallet: string   // agent or creator that launched
  requestorTag?: string     // human-readable label, e.g. "aixbt_agent"
  launchSource: 'web' | 'api' | 'agent'
  // financials
  price: number
  priceChange24h: number
  marketCap: number
  volume24h: number
  holders: number
  bondingCurveProgress: number  // 0–100
  graduated: boolean
  creatorFeesClaimed: number
  requestorFeesClaimed: number
}
```

- [ ] **2.1** Update `types/index.ts` with schema above
- [ ] **2.2** Add social fields to token creation form (`app/create/page.tsx`)
  - Twitter handle input with validation (no @, alphanumeric+underscore)
  - Telegram slug input with validation
  - Optional website URL
- [ ] **2.3** Store social fields in on-chain token metadata (Metaplex `additionalMetadata`)
- [ ] **2.4** Display social icons on `TokenCard` and token detail page
- [ ] **2.5** Add social links to `QuickBuyModal` header
- [ ] **2.6** Create `SocialBadge` reusable component (Twitter bird / Telegram plane icons)

---

## Phase 3: Clanker-Style Fee Model (Day 3-5)

### Backend (Python)
- [ ] **3.1** Create `fee_model.py` with constants and fee math
  ```python
  CREATION_FEE_LAMPORTS = 20_000_000       # 0.02 SOL
  TRADE_FEE_BPS = 100                       # 1%
  TREASURY_SHARE = 0.50
  CREATOR_SHARE  = 0.30
  REQUESTOR_SHARE = 0.20
  RAYDIUM_LP_FEE_BPS = 25                   # 0.25%
  RAYDIUM_TREASURY_SHARE = 0.60
  RAYDIUM_CREATOR_SHARE  = 0.28
  RAYDIUM_REQUESTOR_SHARE = 0.12
  ```
- [ ] **3.2** Implement `FeeVault` PDA derivation: `["fee_vault", token_mint]`
- [ ] **3.3** Add `collect_trade_fee(mint, amount_lamports, buyer_wallet)` function
- [ ] **3.4** Add `distribute_fees(mint)` to split vault balance per tier
- [ ] **3.5** Add `claim_fees(mint, claimant_wallet)` with authority check
- [ ] **3.6** Wire fee collection into `memecoin_launchpad_with_fees.py` buy/sell paths

### Frontend
- [ ] **3.7** Show creator's claimable fees on token detail page
- [ ] **3.8** Add "Claim Fees" button (visible only to creator/requestor wallet)
- [ ] **3.9** Display fee breakdown tooltip on trading UI ("1% fee: 0.3% to creator, etc.")
- [ ] **3.10** Add requestor wallet + tag field to create page (auto-filled from API key for agent launches)

---

## Phase 4: AI Agent Launch API (Day 5-7)

### Concept
Any AI agent (or script) can POST to `/api/agent/launch` with a signed or
API-keyed request to deploy a new token. The agent receives the `requestorWallet`
fee split and is tagged on the token page as the launcher.

### API Design

**Auth**: Bearer API key in `Authorization` header. Keys are generated
per-agent in the ApeStation dashboard and stored server-side (env / KV store).

```
POST /api/agent/launch
Authorization: Bearer <api_key>

{
  "name": "Degen Ape",
  "symbol": "DAPE",
  "description": "Launched by aixbt_agent",
  "imageUrl": "https://...",
  "twitter": "degenape",
  "telegram": "degenape_portal",
  "website": "https://degenape.xyz",
  "initialBuyLamports": 500000000,   // optional: agent buys first bag
  "creatorWallet": "ABC...xyz",      // token creator (gets creator fee share)
  "requestorTag": "aixbt_agent"
}

Response 201:
{
  "mint": "...",
  "txSignature": "...",
  "bondingCurveAddress": "...",
  "feeVaultAddress": "...",
  "creatorShare": 0.30,
  "requestorShare": 0.20,
  "explorerUrl": "https://solscan.io/token/..."
}
```

**Error responses**: 400 (validation), 401 (bad key), 429 (rate limit: 10 launches/hour/key), 500 (chain error)

- [ ] **4.1** Create `app/api/agent/launch/route.ts` — validates request, calls Python launchpad
- [ ] **4.2** Create `app/api/agent/keys/route.ts` — generate/revoke API keys (auth-gated)
- [ ] **4.3** Add API key management UI to user dashboard / settings page
- [ ] **4.4** Rate limiting middleware (10 launches/hr per key, stored in memory/Redis)
- [ ] **4.5** Tag `launchSource: 'agent'` and `requestorTag` on token record
- [ ] **4.6** Display "Launched by [requestorTag]" badge on token cards from agent launches
- [ ] **4.7** Create `/api/agent/status/[mint]` — poll launch status and fee accrual
- [ ] **4.8** Webhook support: `webhookUrl` field in launch request; POST progress events back
  - `{ event: 'launched' | 'graduated' | 'fees_accrued', mint, data }`
- [ ] **4.9** Document the agent API in `AGENT_API.md` with curl examples

---

## Phase 5: Core Trading Features (Day 7-9) [carry-forward from Phase 3 original]

- [ ] **5.1** Complete `TokenFeed` with infinite scroll + filter tabs (Trending / New / Graduating)
- [ ] **5.2** Implement real transaction flow in `QuickBuyModal` (sign + submit)
- [ ] **5.3** Transaction simulation before submission
- [ ] **5.4** Success/error animations post-trade
- [ ] **5.5** Transaction history in portfolio view
- [ ] **5.6** "Graduating soon" indicator (bonding curve > 80%)

---

## Phase 6: Social Features (Day 9-11)

- [ ] **6.1** Comment thread on token detail page
- [ ] **6.2** Nested replies
- [ ] **6.3** Like / bookmark
- [ ] **6.4** Creator profile page (shows all tokens launched + fee earnings)
- [ ] **6.5** Agent profile page (shows all tokens launched via API + total requestor fees earned)

---

## Phase 7: Real-time Updates (Day 11-12)

- [ ] **7.1** WebSocket setup (Socket.io)
- [ ] **7.2** Price + volume updates pushed to token feed
- [ ] **7.3** "Just graduated" toast notification
- [ ] **7.4** Real-time comment stream on token pages
- [ ] **7.5** Notification bell (price targets, graduation, fee claims)

---

## Phase 8: Performance & Launch Polish (Day 13-14)

- [ ] **8.1** Code splitting + lazy loading
- [ ] **8.2** Image optimization (Next Image + CDN)
- [ ] **8.3** Caching strategy (TanStack Query stale times, edge caching)
- [ ] **8.4** Sentry error tracking
- [ ] **8.5** E2E tests: create token, buy, sell, claim fees
- [ ] **8.6** Mobile device testing
- [ ] **8.7** Vercel deploy + env vars

---

## API Endpoints Summary

| Method | Path | Description |
|---|---|---|
| GET | `/api/tokens` | List tokens (trending/new/graduating) |
| GET | `/api/tokens/[mint]` | Token details |
| POST | `/api/tokens/create` | Create token (web UI) |
| POST | `/api/tokens/[mint]/buy` | Buy on bonding curve |
| POST | `/api/tokens/[mint]/sell` | Sell on bonding curve |
| GET | `/api/tokens/[mint]/chart` | OHLCV chart data |
| POST | `/api/tokens/[mint]/claim-fees` | Claim creator/requestor fees |
| **POST** | **`/api/agent/launch`** | **AI agent token launch** |
| GET | `/api/agent/status/[mint]` | Launch + fee status |
| POST | `/api/agent/keys` | Generate API key |
| DELETE | `/api/agent/keys/[id]` | Revoke API key |

---

## Python Module Map

```
ape-fun/
├── base.py                          # RPC helpers, keypair utils
├── memecoin.py                      # SPL token creation, Metaplex metadata
├── fee_model.py                     # NEW: fee constants, FeeVault PDA, distribute/claim
├── bonding_curve.py                 # NEW: price curve math (extracted from launchpad)
├── memecoin_launchpad_with_fees.py  # Main launchpad (buy/sell with fee collection)
├── raydium_integration.py           # Graduation to Raydium AMM
└── simple_mainnet_launchpad.py      # Minimal reference script
```

---

## Success Metrics
- Page load < 2s
- Trade success rate > 95%
- Agent API p95 latency < 3s
- Mobile Lighthouse score > 90

---

## Priority Order
1. Rebrand to ApeStation
2. Social metadata (Twitter/Telegram) on tokens
3. Clanker-style fee model + fee vault
4. AI agent launch API
5. Core trading flow (real transactions)
6. Real-time updates
7. Social/community features
8. Polish & deploy
