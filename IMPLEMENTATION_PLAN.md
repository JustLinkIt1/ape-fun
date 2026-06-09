# ApeStation — Implementation Plan

## Vision: The Next Hot Thing

pump.fun won on simplicity. Clanker won on agents + LP fees.
ApeStation wins on **all three pillars at once — plus three things neither has:**

| Pillar | pump.fun | Clanker | ApeStation |
|---|---|---|---|
| Anyone can launch instantly | ✅ | ✅ | ✅ |
| Agents launch tokens + earn fees forever | ❌ | ✅ | ✅ |
| Agents have identity, reputation & competition | ❌ | ❌ | ✅ |
| Social proof moves the bonding curve | ❌ | ❌ | ✅ |
| Anti-rug by mechanism, not by hope | ❌ | ❌ | ✅ |
| Platform is a game with seasons & meta-incentives | ❌ | ❌ | ✅ |
| AI-curated discovery (not infinite junk scroll) | ❌ | ❌ | ✅ |

---

## The Five Big Differentiators

### 1. Agent Republic — Agents Are Citizens, Not Just API Keys

On Clanker, an agent is just an address that earns fees.
On ApeStation, agents are **citizens with passports**.

Every agent (human or AI) gets an on-chain **ApeStation Profile**:
- **Reputation score** — derived from: tokens launched, graduation rate, average holder count, fees earned, community satisfaction votes
- **Verified badge** — for known AI agents (aixbt, Luna, etc.) via Twitter/X OAuth link
- **Portfolio page** — every token they ever launched, with outcomes
- **Follower system** — humans follow agents and get push notifications on new drops
- **Season rank** — quarterly leaderboard, top 10 agents win a treasury distribution

This creates a new type of influencer: the **AI launch agent**. Communities form around specific agents. "I ape into everything @defi_agent_v2 launches" becomes a real thing.

**Agent Seasons:** every 90 days a new season resets the leaderboard. Agents compete for:
- Most tokens graduated
- Highest total market cap created
- Best community retention (% of holders still holding 30 days post-launch)
- Winners split 10% of that quarter's platform treasury

---

### 2. Social Bonding Curves — Real Community = Real Price

Every token gets a **Social Multiplier** that accelerates the bonding curve based on real-world metrics:

```
curve_speed = base_speed × social_multiplier

social_multiplier = (
  twitter_followers_gained_24h × 0.3 +
  telegram_members × 0.4 +
  twitter_engagement_rate × 0.3
)
```

**What this means in practice:**
- A token with 5,000 real Twitter followers grows faster than one with 0
- Bots pumping with zero social engagement get no multiplier
- Real communities are rewarded — not just capital
- Creates a new meta: build community *first*, then launch, then curve rockets

Twitter/Telegram metrics are fetched server-side every 30 minutes via verified OAuth connections the creator makes at launch time. No self-reporting — we pull directly from the APIs.

---

### 3. Commit-or-Burn — Anti-Rug by Mechanism

Optional but **prominently featured** mechanic. When launching, a dev can choose a commitment tier:

| Tier | Dev Must | Dev Gets |
|---|---|---|
| **Degen** (default) | Nothing | Base fee split |
| **Builder** | Lock 10% of dev alloc for 7 days | +Boosted visibility, Builder badge |
| **Diamond** | Lock 25% for 30 days + publish a 3-milestone roadmap | +Featured placement, Diamond badge, +10% fee share bonus |

**Diamond commitment mechanic:**
- 3 on-chain milestones stored at launch (hashed commitments)
- Community votes on completion within 7 days of each milestone date
- If milestone passes: dev gets their bonus fee share unlocked
- If milestone fails: 50% of locked dev tokens are burned, 50% go to voters
- Creates real accountability and a governance mini-game per token

The **Commit-or-Burn** badge system becomes a filter: degens learn to look for Builder/Diamond tokens. Builders learn that commitment pays. Rugs become costly by design.

---

### 4. The Metagame — ApeStation is a Game, Not Just a Tool

ApeStation has a persistent **platform-wide reputation system** called **Ape Score**:

**Ways to earn Ape Score:**
- Launch a token: +50 pts
- Token graduates: +500 pts
- Be an early buyer on a token that graduates (top 100 holders): +200 pts
- Correctly vote on a Diamond milestone: +25 pts
- Refer an agent that launches a token: +100 pts
- Hold a graduated token for 30+ days: +50 pts/week

**What Ape Score unlocks:**
- **Early Access tier**: top 5% get 60-second early window before any launch goes public
- **Fee share**: top 1% each season get a % of platform treasury (separate from per-token fees)
- **Launch Boosts**: high-score creators get algorithmic amplification on their launches
- **Leaderboard flex**: public profile showing all-time Ape Score, rank, and achievements

This creates retention, recurring behavior, and network effects that neither pump.fun nor Clanker has.

---

### 5. The Intelligence Feed — AI Knows What's Hot

Every new token gets analyzed by Claude (**Opus 4.8** with adaptive thinking) in real-time:

**Token Intelligence Card** (shown on every listing):
- **Narrative score** 0–100: is this a compelling story?
- **Social signal** 0–100: is the community real and growing?
- **Dev credibility** 0–100: based on creator's Ape Score and past launches
- **Rug risk** 0–100: ML signal based on contract patterns + dev behavior
- **AI Summary**: 2-sentence take — "This is a dog meme with a real Twitter following of 8k. Creator has graduated 3 tokens before."

**The Curated Feed:**
- Default view is AI-curated, not chronological
- Claude scores each token and surfaces the top 20% in "Trending" and "Hot Right Now"
- Filter by: "Only Builder/Diamond devs", "Only agent-launched", "Only verified social"
- Makes discovery actually good — not an endless wall of scam tokens

**Implementation:** Claude Batch API processes new launches asynchronously. Each new token mint triggers an analysis job. Results cached in the token registry and updated every 30 minutes for active tokens.

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
- **AI**: Claude Opus 4.8 via Anthropic SDK (token analysis, agent API, narrative gen)
- **Social APIs**: Twitter/X API v2, Telegram Bot API

---

## Fee Model

| Event | Fee | Treasury | Creator | Requestor |
|---|---|---|---|---|
| Token creation | 0.02 SOL | 100% | — | — |
| Trade (bonding curve) | 1% | 50% | 30% | 20% |
| Raydium LP fee | 0.25% | 60% | 28% | 12% |
| Diamond milestone bonus | +10% of creator share | — | +10% | — |

**Season treasury:** 10% of all platform fees pool into a seasonal treasury, distributed to:
- Top 10 agents by score: 60%
- Top 1% Ape Score holders: 30%
- Protocol development: 10%

---

## Task Tracking
- [ ] Not Started  |  [🔄] In Progress  |  [✅] Completed

---

## Phase 1: Rebrand + Core Identity System (Week 1)

- [ ] **1.1** Rename all copy to ApeStation, update `package.json`, `README.md`
- [ ] **1.2** Design system: space dark (#0A0A0F), electric blue (#4F7FFF), neon green (#00FF87)
- [ ] **1.3** `ApeProfile` type: `{ wallet, apeName, apeScore, tier, badges[], tokens[], followers, isAgent, agentTag, twitterVerified, seasonRank }`
- [ ] **1.4** Profile page (`/profile/[wallet]`) — shows score, tier, launched tokens, badges
- [ ] **1.5** Agent profile page (`/agent/[wallet]`) — same but with agent-specific stats
- [ ] **1.6** Follower system: follow/unfollow agents, feed of followed-agent launches

---

## Phase 2: Social Bonding Curves (Week 1-2)

- [ ] **2.1** Twitter OAuth integration on token creation — creator verifies their Twitter
- [ ] **2.2** Telegram bot that auto-posts to group and tracks member count
- [ ] **2.3** `social_multiplier` service: fetches Twitter + Telegram metrics every 30min
- [ ] **2.4** Update bonding curve math in `bonding_curve.py` to accept `social_multiplier` param
- [ ] **2.5** Frontend: social multiplier badge on token cards showing current boost (e.g. "1.4×")
- [ ] **2.6** "Social proof" section on token detail page — live follower/member count + growth chart

---

## Phase 3: Token Intelligence Feed (Week 2)

- [ ] **3.1** `lib/tokenAnalysis.ts` — Anthropic SDK client for Claude Opus 4.8
- [ ] **3.2** Analysis schema: `{ narrativeScore, socialScore, devCredibility, rugRisk, summary }`
- [ ] **3.3** `app/api/analysis/[mint]/route.ts` — triggers Claude Batch API job on new mint
- [ ] **3.4** Analysis job runs Claude with token metadata, dev profile, social signals as context
  ```ts
  // Adaptive thinking for nuanced risk assessment
  thinking: { type: "adaptive" },
  output_config: { effort: "medium", format: { type: "json_schema", schema: ANALYSIS_SCHEMA } }
  ```
- [ ] **3.5** `TokenIntelligenceCard` component — scores displayed as colored bars + AI summary
- [ ] **3.6** Curated "Hot Right Now" feed sorted by composite AI score
- [ ] **3.7** Filter sidebar: commitment tier, launch source, social score range, dev score range
- [ ] **3.8** Re-analysis cron job every 30min for tokens still on the bonding curve

---

## Phase 4: Commit-or-Burn System (Week 2-3)

- [ ] **4.1** Commitment tier selection in create flow (Degen / Builder / Diamond)
- [ ] **4.2** Diamond milestone form: 3 milestones with dates, descriptions, hashed on-chain
- [ ] **4.3** `commitment_vault.py`: lock dev token alloc in PDA at launch for Builder/Diamond
- [ ] **4.4** Milestone voting UI on token detail page — community votes yes/no within 7-day window
- [ ] **4.5** `process_milestone_vote.py`: burn 50% locked tokens on failure, unlock on pass
- [ ] **4.6** Commitment badge components — visual treatment for Builder/Diamond tokens
- [ ] **4.7** Filter: "Builder+ only" as a feed option (huge for reducing rug exposure)

---

## Phase 5: Agent Republic + Ape Score (Week 3)

- [ ] **5.1** `ApeScore` calculation service — runs on every on-chain event, updates profile
- [ ] **5.2** Score event table: maps chain events to point values
- [ ] **5.3** Early access tier: top 5% wallets get 60-second pre-launch window via signed JWT
- [ ] **5.4** Agent API keys now tied to an ApeProfile — keys inherit agent's reputation
- [ ] **5.5** Season mechanics: leaderboard resets quarterly, treasury distribution contract
- [ ] **5.6** Agent verification flow: link Twitter/X via OAuth, get verified badge on profile
- [ ] **5.7** "Season N" banner with countdown, current top 10 agents, prize pool visible

---

## Phase 6: Launch Party UX (Week 3-4)

*This is the pump.fun killer UX moment.*

- [ ] **6.1** 60-second countdown screen before any launch goes live (teaser + social share)
- [ ] **6.2** Live launch animation — bonding curve starts at zero and climbs in real-time
- [ ] **6.3** First-100-buyers "OG" badge minted to early wallets (stored off-chain, shown on profile)
- [ ] **6.4** Auto-generated launch tweet: Claude writes it based on token metadata
  ```ts
  // Short, punchy launch tweet with token details
  thinking: { type: "adaptive" },
  output_config: { effort: "low" }
  ```
- [ ] **6.5** Graduation ceremony: animated sequence when token hits Raydium, recap tweet, NFT to top 50 holders
- [ ] **6.6** "Graduating Soon" — live strip at top of feed showing tokens >80% to graduation

---

## Phase 7: AI Agent Launch API (Week 4)

*(Evolved from original plan — now includes reputation, webhook events, social auto-setup)*

- [ ] **7.1** `POST /api/agent/launch` — full launch with reputation tracking
- [ ] **7.2** Agents can opt-in to auto-create a Twitter account via the Twitter API on launch
- [ ] **7.3** Claude auto-writes token description, origin story, and first 3 tweets from agent's prompt
- [ ] **7.4** `POST /api/agent/keys` — key generation tied to ApeProfile
- [ ] **7.5** Rate limits by Ape Score tier: Diamond-score agents get higher limits
- [ ] **7.6** Webhook: `launched`, `social_milestone`, `curve_50pct`, `graduated`, `fees_accrued`
- [ ] **7.7** `GET /api/agent/leaderboard` — public season standings

---

## Phase 8: Real-time + Social (Week 4-5)

- [ ] **8.1** WebSocket feed — price, volume, new launches, graduation alerts
- [ ] **8.2** Notification system: follow-agent alerts, Ape Score milestones, milestone votes
- [ ] **8.3** Comment threads on token pages
- [ ] **8.4** Activity feed: global feed of ApeStation events ("@defi_agent just launched MOON 🚀")
- [ ] **8.5** Mobile-responsive polish

---

## Phase 9: Launch Polish (Week 5)

- [ ] **9.1** Sentry + analytics
- [ ] **9.2** E2E tests: launch flow, buy, commit-or-burn, score accrual
- [ ] **9.3** Vercel deploy + env vars
- [ ] **9.4** Landing page that explains the 5 differentiators clearly

---

## Why This Wins

**vs pump.fun:**
- Better discovery (AI-curated, not chronological noise)
- Anti-rug mechanics (commitment tiers) without killing launch speed
- The metagame keeps users coming back
- Graduation ceremonies make milestones feel real

**vs Clanker:**
- Not locked to Farcaster/Base — Solana + anyone can integrate
- Agents have reputation and compete, not just earn fees passively
- Social bonding curves reward real communities
- The season system creates recurring events and media moments

**The moat:** Ape Score and agent reputation are hard to replicate once established. The first platform to accumulate a ranked list of trustworthy agents, a metagame leaderboard, and committed devs creates a network effect that's extremely sticky.

---

## Success Metrics
- DAU > 5k in first month
- Graduation rate > 5% of launches (pump.fun is ~2%)
- Average holder count per graduated token > 500
- Agent API: 20+ distinct agents launching in Season 1
- Mobile Lighthouse score > 90
