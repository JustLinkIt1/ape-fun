// Server-side token registry using file system.
// Swap for a database in production.

import fs from 'fs'
import path from 'path'
import { getInitialBondingCurveState, getCurrentPrice, getMarketCap, shouldGraduate } from './bondingCurve'

export interface ServerToken {
  mint: string
  name: string
  symbol: string
  description: string
  imageUrl: string
  creator: string
  totalSupply: number
  decimals: number
  // Bonding curve state — persisted so each trade picks up where the last left off
  solReserve: number
  tokenReserve: number
  // Derived metrics (updated on every trade)
  price: number
  marketCap: number
  volume24h: number
  holders: number
  priceChange24h: number
  bondingCurveProgress: number
  graduated: boolean
  createdAt: string
  salesTax: number
  // Social metadata
  twitter?: string
  telegram?: string
  website?: string
  commitmentTier?: string
  launchSource?: string
  requestorWallet?: string
}

const TOKENS_FILE = path.join(process.cwd(), 'tokens.json')

function ensureTokensFile() {
  if (!fs.existsSync(TOKENS_FILE)) {
    fs.writeFileSync(TOKENS_FILE, '{}', 'utf8')
  }
}

export function saveServerToken(token: ServerToken) {
  ensureTokensFile()
  try {
    const data = fs.readFileSync(TOKENS_FILE, 'utf8')
    const tokens = JSON.parse(data || '{}')
    tokens[token.mint] = token
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf8')
  } catch (error) {
    console.error('Error saving token:', error)
  }
}

export function getServerTokens(): Record<string, ServerToken> {
  ensureTokensFile()
  try {
    const data = fs.readFileSync(TOKENS_FILE, 'utf8')
    return JSON.parse(data || '{}')
  } catch (error) {
    console.error('Error reading tokens:', error)
    return {}
  }
}

export function getServerToken(mint: string): ServerToken | null {
  return getServerTokens()[mint] || null
}

export function getServerTokensByCreator(creator: string): ServerToken[] {
  return Object.values(getServerTokens()).filter(t => t.creator === creator)
}

// Called after every buy or sell to persist new bonding curve state and
// recompute derived metrics (price, marketCap, bondingCurveProgress).
export function updateTokenBondingCurve(
  mint: string,
  solReserve: number,
  tokenReserve: number,
  volumeDelta: number, // SOL traded this trade
) {
  const token = getServerToken(mint)
  if (!token) return

  const state = { solReserve, tokenReserve, totalSupply: token.totalSupply * Math.pow(10, token.decimals) }
  const price = getCurrentPrice(state)
  const marketCap = price * token.totalSupply  // in SOL
  const graduated = shouldGraduate(state, 69000 / (/* SOL price rough */ 150))  // ~460 SOL market cap ≈ $69k

  const updated: ServerToken = {
    ...token,
    solReserve,
    tokenReserve,
    price,
    marketCap,
    volume24h: (token.volume24h || 0) + volumeDelta,
    bondingCurveProgress: Math.min(100, (marketCap / (69000 / 150)) * 100),
    graduated,
  }
  saveServerToken(updated)
  return updated
}

// Build initial bonding curve state for a freshly-created token
export function initialBondingCurveFields(totalSupply: number, decimals: number) {
  const totalSupplyRaw = totalSupply * Math.pow(10, decimals)
  const state = getInitialBondingCurveState(totalSupplyRaw)
  return {
    solReserve: state.solReserve,
    tokenReserve: state.tokenReserve,
    price: getCurrentPrice(state),
    marketCap: getCurrentPrice(state) * totalSupply,
    volume24h: 0,
    holders: 1,
    priceChange24h: 0,
    bondingCurveProgress: 0,
    graduated: false,
  }
}
