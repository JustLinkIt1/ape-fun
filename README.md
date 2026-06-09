# ApeStation

A Solana memecoin launchpad with a Clanker-inspired fee model. Creators and
requestors earn perpetual fee splits. AI agents can deploy tokens via a REST
API. Tokens graduate to Raydium when they hit the market-cap threshold.

## Key Features

- **Token Creation** — Launch a memecoin with custom image, Twitter, Telegram, and website
- **Clanker-style fees** — 1% trade fee split between treasury, creator, and requestor
- **Raydium graduation** — Auto LP creation at market-cap threshold; fee splits continue on LP
- **AI Agent API** — POST to `/api/agent/launch` with an API key to deploy tokens programmatically
- **Requestor fees** — Whoever initiates a launch (agent or referrer) earns 20% of all trade fees
- **Fee claim UI** — Creator and requestor can claim accrued fees at any time

## Fee Model

| Event | Fee | Treasury | Creator | Requestor |
|---|---|---|---|---|
| Trade (bonding curve) | 1% | 50% | 30% | 20% |
| Raydium LP fee | 0.25% | 60% | 28% | 12% |
| Token creation | 0.02 SOL | 100% | — | — |

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Radix UI, Framer Motion
- **Wallet**: @solana/wallet-adapter-react
- **Blockchain**: Solana — @solana/web3.js, @solana/spl-token, Metaplex UMI
- **DEX**: Raydium AMM
- **Real-time**: Socket.io, TanStack Query

## Project Structure

```
ape-fun/
├── base.py                          # RPC helpers
├── memecoin.py                      # SPL token + Metaplex metadata
├── fee_model.py                     # FeeVault PDA, fee distribution, claims
├── bonding_curve.py                 # Price curve math
├── memecoin_launchpad_with_fees.py  # Main launchpad (buy/sell + fees)
├── raydium_integration.py           # Raydium AMM graduation
├── launch-fun-frontend/             # Next.js app
│   ├── app/api/agent/               # AI agent launch API
│   ├── app/api/tokens/              # Token CRUD + trade routes
│   ├── components/                  # TokenCard, QuickBuyModal, etc.
│   └── types/index.ts               # Shared TypeScript interfaces
└── AGENT_API.md                     # Agent API docs + curl examples
```

## Getting Started

```bash
# Frontend
cd launch-fun-frontend
npm install
cp .env.local.example .env.local   # fill in RPC URL + API keys
npm run dev

# Python backend (optional, for local chain interaction)
pip install -r requirements.txt
```

## AI Agent API (Quick Start)

```bash
# Generate an API key from the ApeStation dashboard, then:
curl -X POST https://apestation.xyz/api/agent/launch \
  -H "Authorization: Bearer <your_api_key>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Moon Ape",
    "symbol": "MAPE",
    "description": "Launched by my agent",
    "imageUrl": "https://...",
    "twitter": "moonape",
    "telegram": "moonape_portal",
    "initialBuyLamports": 500000000,
    "creatorWallet": "YOUR_WALLET",
    "requestorTag": "my_agent_v1"
  }'
```

See `AGENT_API.md` for full docs, webhook setup, and rate limits.

## Disclaimer

Experimental software. Use at your own risk. Never invest more than you can
afford to lose in memecoins.
