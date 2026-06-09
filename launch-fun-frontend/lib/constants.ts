// RPC Endpoints with fallbacks
export const RPC_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com', 
  'https://rpc.ankr.com/solana',
  'https://solana-mainnet.g.alchemy.com/v2/demo'
]

// For development/testing, you can switch to devnet
export const DEVNET_RPC_ENDPOINTS = [
  'https://api.devnet.solana.com',
  'https://rpc.ankr.com/solana_devnet'
]

// Platform configuration
export const PLATFORM_CONFIG = {
  taxWallet: '3tAQBPnSxMZ7CAvgib29hWFiebRFqupEHLZQENSogewi',
  salesTax: 1, // 1% trading fee, split per FEE_SPLIT below
  launchFee: 0.02, // SOL — flat creation fee, 100% to treasury
  bondingTarget: 69000, // Bond to Raydium at 69k market cap (before social multiplier)
  network: 'mainnet-beta' // 'mainnet-beta' or 'devnet'
}

// Trade fee distribution (bonding curve phase)
export const FEE_SPLIT = {
  treasury: 0.5,
  creator: 0.3,
  requestor: 0.2, // agent/referrer that initiated the launch; creator if self-launched
}

// Raydium LP fee distribution (post-graduation, of the 0.25% LP fee)
export const LP_FEE_SPLIT = {
  treasury: 0.6,
  creator: 0.28,
  requestor: 0.12,
}

// Share of all platform fees pooled into the seasonal treasury
export const SEASON_TREASURY_RATIO = 0.1

// Helper function to get working RPC connection
import { Connection } from '@solana/web3.js'

export async function getConnection(): Promise<Connection> {
  const endpoints = PLATFORM_CONFIG.network === 'devnet' ? DEVNET_RPC_ENDPOINTS : RPC_ENDPOINTS
  
  for (const endpoint of endpoints) {
    try {
      const connection = new Connection(endpoint, 'confirmed')
      await connection.getLatestBlockhash()
      console.log(`Connected to RPC: ${endpoint}`)
      return connection
    } catch (error) {
      console.error(`Failed to connect to ${endpoint}:`, error)
    }
  }
  
  throw new Error('Failed to connect to any RPC endpoint')
}