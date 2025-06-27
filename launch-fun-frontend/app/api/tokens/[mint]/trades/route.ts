import { NextRequest, NextResponse } from 'next/server'
import { getTradesForMint } from '@/lib/tradeRegistry'

export async function GET(request: NextRequest, context: { params: { mint: string } }) {
  try {
    const { params } = context
    const mint = typeof params.mint === 'string' ? params.mint : await params.mint
    const trades = getTradesForMint(mint)
    return NextResponse.json({ success: true, trades })
  } catch (error: any) {
    console.error('Error fetching trades:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch trades' },
      { status: 500 }
    )
  }
} 