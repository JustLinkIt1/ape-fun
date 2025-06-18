# Ape Fun 🦍🚀

A Solana-based memecoin launchpad platform that allows users to create, trade, and manage memecoins with ease.

## Features

- **Token Creation**: Launch your own memecoin on Solana with custom metadata
- **Trading Interface**: Buy and sell tokens with real-time price updates
- **Portfolio Management**: Track your token holdings and performance
- **Raydium Integration**: Automatic liquidity pool creation when tokens reach market cap threshold
- **Fee System**: Platform fees for sustainability and development

## Tech Stack

### Backend
- Python-based Solana integration
- SPL Token program interaction
- Raydium AMM integration
- Fee management system

### Frontend
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Solana Wallet Adapter
- Real-time price updates

## Project Structure

```
ape-fun/
├── base.py                    # Base Solana interaction utilities
├── memecoin.py               # Core memecoin functionality
├── raydium_integration.py    # Raydium AMM integration
├── simple_mainnet_launchpad.py              # Minimal mainnet launch script
├── solana_memecoin_launchpad_production.py  # Production launchpad implementation
├── launch-fun-frontend/      # Next.js frontend application
│   ├── app/                  # App router pages
│   ├── components/           # React components
│   ├── lib/                  # Utility functions and constants
│   └── public/               # Static assets
└── requirements.txt          # Python dependencies
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Solana CLI tools
- A Solana wallet

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ape-fun.git
cd ape-fun
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Install frontend dependencies:
```bash
cd launch-fun-frontend
npm install
```

4. Set up environment variables:
```bash
cp launch-fun-frontend/.env.local.example launch-fun-frontend/.env.local
# Edit .env.local with your configuration
# NFT_STORAGE_API_KEY is required for image uploads via the /api/upload endpoint
# To enable AI tagline generation, provide NEXT_PUBLIC_OPENAI_API_KEY. Optionally set NEXT_PUBLIC_HELIUS_API_KEY for a dedicated RPC endpoint
```

### Running the Application

1. Start the frontend development server:
```bash
cd launch-fun-frontend
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Simple Mainnet Launcher

The `simple_mainnet_launchpad.py` script provides a minimal example of creating
an SPL token on Solana mainnet. It uses `solana-py` and the Metaplex token
metadata instructions. Example usage:

```bash
python simple_mainnet_launchpad.py
```

The script will prompt you to fund a temporary keypair before creating the
token.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Disclaimer

This is experimental software. Use at your own risk. Always verify smart contract interactions and never invest more than you can afford to lose in memecoins.

The Ape Fun website is under active development. It may contain bugs or security vulnerabilities. Use it at your own risk, and Ape Fun takes no responsibility for any lost funds or tokens.
