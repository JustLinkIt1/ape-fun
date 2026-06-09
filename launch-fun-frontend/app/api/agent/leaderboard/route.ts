// GET /api/agent/leaderboard — public season standings for the Agent Republic.

import { NextRequest, NextResponse } from 'next/server'
import { getLeaderboard } from '@/lib/profileRegistry'

export async function GET(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get('limit') ?? 50)
  const agentsOnly = request.nextUrl.searchParams.get('agents') !== 'false'

  const leaders = getLeaderboard(Math.min(limit, 100), agentsOnly).map((p, i) => ({
    rank: i + 1,
    wallet: p.wallet,
    apeName: p.apeName,
    agentTag: p.agentTag,
    apeScore: p.apeScore,
    tier: p.tier,
    tokensLaunched: p.tokensLaunched.length,
    tokensGraduated: p.tokensGraduated,
    twitterVerified: p.twitterVerified,
  }))

  return NextResponse.json({ leaders })
}
