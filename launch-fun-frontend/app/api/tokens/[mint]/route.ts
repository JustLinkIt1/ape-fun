import { NextRequest, NextResponse } from 'next/server'
import { getPlatformToken } from '@/lib/tokenRegistry'

const mockTokens: any[] = [
  {
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

export async function GET(request: NextRequest, context: any) {
  const { params } = context as { params: { mint: string } }
  try {
    const mint = params.mint
    let token = getPlatformToken(mint)
    if (!token) {
      token = mockTokens.find(t => t.mint === mint) || null
    }
    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    // placeholder chart data
    const chartData = Array.from({ length: 24 }, (_, i) => ({
      time: i,
      value: token.price * (1 + (Math.sin(i / 3) * 0.05))
    }))

    return NextResponse.json({ success: true, token, chart: chartData })
  } catch (error: any) {
    console.error('Token detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch token' }, { status: 500 })
  }
}
