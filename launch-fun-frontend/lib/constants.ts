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
  salesTax: 3, // 3% trading fee in SOL
  launchFee: 0, // 0 SOL launch fee for testing
  bondingTarget: 69000, // Bond to Raydium at 69k market cap
  network: 'mainnet-beta' // 'mainnet-beta' or 'devnet'
}

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