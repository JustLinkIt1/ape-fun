import { NextRequest, NextResponse } from 'next/server'
import { getChartDataForMint } from '@/lib/tradeRegistry'

export async function GET(request: NextRequest, context: { params: Promise<{ mint: string }> }) {
  try {
    const { mint } = await context.params
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