// In-memory token registry for platform tokens
// In production, this would be a database

interface PlatformToken {
  mint: string
  name: string
  symbol: string
  description: string
  imageUrl: string
  creator: string
  totalSupply: number
  decimals: number
  price: number // in SOL
  marketCap: number
  volume24h: number
  holders: number
  priceChange24h: number
  bondingCurveProgress: number
  createdAt: string
  salesTax: number
}

// Store tokens in localStorage for persistence
const STORAGE_KEY = 'launch_fun_tokens'

export function savePlatformToken(token: PlatformToken) {
  const tokens = getPlatformTokens()
  tokens[token.mint] = token
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
  }
}

export function getPlatformTokens(): Record<string, PlatformToken> {
  if (typeof window === 'undefined') return {}
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return {}
  
  try {
    return JSON.parse(stored)
  } catch {
    return {}
  }
}

export function getPlatformToken(mint: string): PlatformToken | null {
  const tokens = getPlatformTokens()
  return tokens[mint] || null
}

export function getAllPlatformTokens(): PlatformToken[] {
  const tokens = getPlatformTokens()
  return Object.values(tokens)
}

// Update token price (called when trades happen)
export function updateTokenPrice(mint: string, newPrice: number, volume: number = 0) {
  const token = getPlatformToken(mint)
  if (!token) return
  
  const oldPrice = token.price
  token.price = newPrice
  token.marketCap = newPrice * token.totalSupply
  token.volume24h += volume
  token.priceChange24h = ((newPrice - oldPrice) / oldPrice) * 100
  
  savePlatformToken(token)
}

// Get tokens created by a specific wallet
export function getTokensByCreator(creator: string): PlatformToken[] {
  const allTokens = getAllPlatformTokens()
  return allTokens.filter(token => token.creator === creator)
}

// Get tokens held by a wallet (would need on-chain data in production)
export function getTokensByHolder(holder: string): PlatformToken[] {
  // For now, return all platform tokens
  // In production, this would check actual on-chain balances
  return getAllPlatformTokens()
}