import { NextRequest, NextResponse } from 'next/server'
import { getTradesForMint } from '@/lib/tradeRegistry'

export async function GET(request: NextRequest, context: { params: Promise<{ mint: string }> }) {
  try {
    const { mint } = await context.params
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