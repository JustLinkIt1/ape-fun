import { NextRequest, NextResponse } from 'next/server'
import { getChartDataForMint } from '@/lib/tradeRegistry'

export async function GET(request: NextRequest, context: { params: { mint: string } }) {
  try {
    const { params } = context
    const mint = typeof params.mint === 'string' ? params.mint : await params.mint
    const chartData = getChartDataForMint(mint)
    return NextResponse.json({ success: true, chartData })
  } catch (error: any) {
    console.error('Error fetching chart data:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chart data' },
      { status: 500 }
    )
  }
} 