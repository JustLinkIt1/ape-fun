// GET /api/analysis/[mint] — cached Token Intelligence for a mint.
// POST /api/analysis/[mint] — trigger (re-)analysis via Claude Opus 4.8.

import { NextRequest, NextResponse } from 'next/server'
import { getAnalysis, analyzeToken } from '@/lib/tokenAnalysis'
import { getServerToken } from '@/lib/serverTokenRegistry'
import { getProfile } from '@/lib/profileRegistry'
import { fetchSocialMetrics } from '@/lib/socialMultiplier'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ mint: string }> }
) {
  const { mint } = await context.params
  const analysis = getAnalysis(mint)
  if (!analysis) {
    return NextResponse.json({ error: 'No analysis yet' }, { status: 404 })
  }
  return NextResponse.json({ analysis })
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ mint: string }> }
) {
  try {
    const { mint } = await context.params
    const stored = getServerToken(mint)
    if (!stored) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 })
    }

    const creatorProfile = getProfile(stored.creator)
    const social = await fetchSocialMetrics(mint)

    const analysis = await analyzeToken(
      { ...stored, address: stored.mint, salesTax: stored.salesTax } as any,
      creatorProfile,
      social
    )

    return NextResponse.json({ analysis }, { status: 201 })
  } catch (error: any) {
    console.error('Analysis failed:', error)
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 })
  }
}
