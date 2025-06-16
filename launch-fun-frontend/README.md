# Ape Fun - Solana Memecoin Launchpad

A high-performance Solana memecoin trading interface with token creation, portfolio tracking, and automatic Raydium bonding.

## Features

- 🚀 **Token Creation**: Launch SPL tokens on Solana mainnet/devnet
- 💼 **Portfolio Tracking**: Real-time portfolio value in SOL and USD
- 💰 **Platform Revenue**: 3% initial token allocation
- 🔄 **Auto-Bonding**: Automatic Raydium listing at 69k market cap
- 📊 **Price Tracking**: Real-time SOL/USD price updates
- 🎨 **Modern UI**: Gradient-heavy design with animations

## Quick Start

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment** (optional):
```bash
cp .env.local.example .env.local
# Edit .env.local to set network (devnet/mainnet-beta)
```

3. **Run development server**:
```bash
npm run dev
```

4. **Open browser**:
```
http://localhost:3000
```

## Testing Token Creation

### Option 1: Devnet (Recommended for Testing)

1. Visit `/test` page to check RPC connectivity
2. Switch to Devnet network
3. Request airdrop for test SOL
4. Create tokens without real cost

### Option 2: Mainnet

1. Connect wallet with SOL balance
2. Fill token details on `/create`
3. Launch token (minimal gas fees ~0.01 SOL)
4. 3% of supply goes to platform wallet

## Handling RPC Errors

If you encounter 403 errors or connection issues:

1. **Use the test page**: Visit `/test` to check RPC endpoint status
2. **Try different endpoints**: The app automatically tries multiple RPC providers
3. **Use a paid RPC service** for production:
   - Alchemy: https://www.alchemy.com/solana
   - QuickNode: https://www.quicknode.com/chains/sol
   - Helius: https://helius.xyz/

## Pages

- `/` - Homepage with trending tokens
- `/create` - Token creation form
- `/portfolio` - View holdings and values
- `/test` - RPC endpoint testing
- `/admin` - Platform settings (restricted)

## Platform Configuration

- **Tax Wallet**: `3tAQBPnSxMZ7CAvgib29hWFiebRFqupEHLZQENSogewi`
- **Sales Tax**: 3% initial allocation (adjustable)
- **Launch Fee**: 0 SOL (testing mode)
- **Bonding Target**: 69k market cap

## Development Tips

1. **Start with Devnet**: Test all features without real SOL
2. **Monitor RPC limits**: Public endpoints have rate limits
3. **Check console logs**: Detailed error messages for debugging
4. **Use fallback endpoints**: Multiple RPC providers for reliability

## Production Deployment

1. Set up paid RPC endpoint
2. Configure environment variables
3. Enable launch fees if desired
4. Deploy to Vercel/Netlify
5. Monitor platform wallet for revenue

## Troubleshooting

### "Access forbidden" error
- RPC endpoint is rate-limited
- Try again in a few seconds
- Use `/test` page to find working endpoint

### Transaction fails
- Check wallet SOL balance
- Ensure proper network (mainnet/devnet)
- Verify RPC connectivity

### Portfolio not loading
- Connect wallet first
- Check RPC status on `/test`
- Refresh page after connecting

## Support

For issues or questions:
- Check RPC status: `/test`
- Review console logs
- Ensure wallet is connected
- Verify network selection

---

Built with Next.js, TypeScript, and Solana Web3.js