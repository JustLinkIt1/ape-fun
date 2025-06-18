import { NextRequest, NextResponse } from 'next/server'
import { getAllPlatformTokens } from '@/lib/tokenRegistry'

// Basic mock tokens so the UI has data before any are created
const mockTokens = [
  {
    address: 'DogK1111111111111111111111111111111111111111',
    mint: 'DogK1111111111111111111111111111111111111111',
    name: 'Doge Killer',
    symbol: 'DOGK',
    price: 0.00234,
    priceChange24h: 45.2,
    marketCap: 1200000,
    volume24h: 450000,
    holders: 1234,
    imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=DOGK',
    bondingCurveProgress: 75,
    salesTax: 3
  },
  {
    address: 'PEPE2222222222222222222222222222222222222222',
    mint: 'PEPE2222222222222222222222222222222222222222',
    name: 'Pepe Classic',
    symbol: 'PEPEC',
    price: 0.00089,
    priceChange24h: -12.3,
    marketCap: 890000,
    volume24h: 234000,
    holders: 987,
    imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=PEPEC',
    bondingCurveProgress: 45,
    salesTax: 3
  },
  {
    address: 'MOON3333333333333333333333333333333333333333',
    mint: 'MOON3333333333333333333333333333333333333333',
    name: 'Moon Shot',
    symbol: 'MOON',
    price: 0.00567,
    priceChange24h: 89.7,
    marketCap: 2300000,
    volume24h: 780000,
    holders: 2345,
    imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=MOON',
    bondingCurveProgress: 92,
    salesTax: 3
  }
]

export async function GET(request: NextRequest) {
  try {
    const tokens = getAllPlatformTokens()
    const all = [...tokens.map(t => ({
      address: t.mint,
      mint: t.mint,
      name: t.name,
      symbol: t.symbol,
      price: t.price,
      priceChange24h: t.priceChange24h,
      marketCap: t.marketCap,
      volume24h: t.volume24h,
      holders: t.holders,
      imageUrl: t.imageUrl,
      bondingCurveProgress: t.bondingCurveProgress,
      salesTax: t.salesTax
    })), ...mockTokens]

    // remove duplicates by mint
    const unique = all.filter((tok, idx, arr) => idx === arr.findIndex(t => t.mint === tok.mint))

    return NextResponse.json({ success: true, tokens: unique })
  } catch (error:any) {
    console.error('Tokens API error:', error)
    return NextResponse.json({ error: 'Failed to fetch tokens' }, { status: 500 })
  }
}
