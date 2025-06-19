// Server-side token registry using file system
// In production, this would be a database

import fs from 'fs'
import path from 'path'

interface PlatformToken {
  mint: string
  name: string
  symbol: string
  description: string
  imageUrl: string
  creator: string
  totalSupply: number
  decimals: number
  price: number
  marketCap: number
  volume24h: number
  holders: number
  priceChange24h: number
  bondingCurveProgress: number
  createdAt: string
  salesTax: number
}

const TOKENS_FILE = path.join(process.cwd(), 'tokens.json')

// Ensure tokens file exists
function ensureTokensFile() {
  if (!fs.existsSync(TOKENS_FILE)) {
    fs.writeFileSync(TOKENS_FILE, '{}', 'utf8')
  }
}

export function saveServerToken(token: PlatformToken) {
  ensureTokensFile()
  
  try {
    const data = fs.readFileSync(TOKENS_FILE, 'utf8')
    const tokens = JSON.parse(data || '{}')
    tokens[token.mint] = token
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf8')
    console.log(`Token saved: ${token.mint}`)
  } catch (error) {
    console.error('Error saving token:', error)
  }
}

export function getServerTokens(): Record<string, PlatformToken> {
  ensureTokensFile()
  
  try {
    const data = fs.readFileSync(TOKENS_FILE, 'utf8')
    return JSON.parse(data || '{}')
  } catch (error) {
    console.error('Error reading tokens:', error)
    return {}
  }
}

export function getServerToken(mint: string): PlatformToken | null {
  const tokens = getServerTokens()
  return tokens[mint] || null
}

export function getServerTokensByCreator(creator: string): PlatformToken[] {
  const tokens = getServerTokens()
  return Object.values(tokens).filter(token => token.creator === creator)
}