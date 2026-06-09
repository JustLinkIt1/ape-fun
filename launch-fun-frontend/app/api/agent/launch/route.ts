// POST /api/agent/launch — AI agents deploy tokens programmatically.
// Auth: Bearer API key. The key's ApeProfile becomes the requestor and
// earns the requestor fee share on every trade, forever.

import { NextRequest, NextResponse } from 'next/server'
import { AgentLaunchRequest } from '@/types'
import { validateAgentKey, recordLaunch, RATE_LIMITS } from '@/lib/agentKeys'
import { getOrCreateProfile, awardScore, saveProfile } from '@/lib/profileRegistry'
import { buildScoreEvent } from '@/lib/apeScore'
import { buildCommitment } from '@/lib/commitment'
import { saveServerToken, initialBondingCurveFields } from '@/lib/serverTokenRegistry'

// In-memory rate limit window (per key id) — swap for Redis in production
const launchWindows: Record<string, number[]> = {}

function checkRateLimit(keyId: string, tier: string): boolean {
  const limit = RATE_LIMITS[tier] ?? RATE_LIMITS.shrimp
  const now = Date.now()
  const window = (launchWindows[keyId] || []).filter(t => now - t < 3600_000)
  if (window.length >= limit) return false
  window.push(now)
  launchWindows[keyId] = window
  return true
}

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization')
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing Bearer token' }, { status: 401 })
    }

    const key = validateAgentKey(auth.slice(7))
    if (!key) {
      return NextResponse.json({ error: 'Invalid or revoked API key' }, { status: 401 })
    }

    const agentProfile = getOrCreateProfile(key.wallet)
    if (!checkRateLimit(key.id, agentProfile.tier)) {
      return NextResponse.json(
        { error: `Rate limit exceeded (${RATE_LIMITS[agentProfile.tier]} launches/hour for ${agentProfile.tier} tier)` },
        { status: 429 }
      )
    }

    const body: AgentLaunchRequest = await request.json()

    // Validation
    if (!body.name || !body.symbol || !body.creatorWallet) {
      return NextResponse.json(
        { error: 'name, symbol, and creatorWallet are required' },
        { status: 400 }
      )
    }
    if (body.twitter && !/^[A-Za-z0-9_]{1,15}$/.test(body.twitter)) {
      return NextResponse.json({ error: 'Invalid twitter handle (no @, 1-15 chars)' }, { status: 400 })
    }
    if (body.telegram && !/^[A-Za-z0-9_]{5,32}$/.test(body.telegram)) {
      return NextResponse.json({ error: 'Invalid telegram slug' }, { status: 400 })
    }

    // Optional commitment tier (Diamond requires milestones via web flow for now)
    const tier = body.commitmentTier ?? 'degen'
    if (tier === 'diamond') {
      return NextResponse.json(
        { error: 'Diamond tier requires milestone setup — use the web create flow' },
        { status: 400 }
      )
    }

    // Agent-launched tokens get a simulated mint address for now.
    // Real on-chain integration requires deploying the Anchor program.
    const mint = `AGENT_${Date.now()}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const totalSupply = body.totalSupply ?? 1_000_000_000
    const decimals = 6

    // Save token to registry so it appears on the platform
    const bcFields = initialBondingCurveFields(totalSupply, decimals)
    saveServerToken({
      mint,
      name: body.name,
      symbol: body.symbol.toUpperCase(),
      description: body.description ?? '',
      imageUrl: body.imageUrl ?? '',
      creator: body.creatorWallet,
      requestorWallet: key.wallet,
      totalSupply,
      decimals,
      salesTax: 1,
      twitter: body.twitter,
      telegram: body.telegram,
      website: body.website,
      commitmentTier: tier,
      launchSource: 'agent',
      createdAt: new Date().toISOString(),
      ...bcFields,
    })

    if (tier !== 'degen') {
      await buildCommitment(mint, tier, 0)
    }

    // Reputation: launch is recorded against the agent's profile
    recordLaunch(key.id)
    agentProfile.isAgent = true
    agentProfile.agentTag = body.requestorTag ?? key.agentTag
    agentProfile.tokensLaunched.push(mint)
    saveProfile(agentProfile)
    awardScore(buildScoreEvent(key.wallet, 'token_launched', mint))

    return NextResponse.json(
      {
        mint,
        txSignature: 'SIMULATED_ON_CHAIN_INTEGRATION',
        bondingCurveAddress: 'PENDING',
        feeVaultAddress: 'PENDING',
        creatorShare: 0.3,
        requestorShare: 0.2,
        explorerUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/token/${mint}`,
        platformUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/token/${mint}`,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Agent launch failed:', error)
    return NextResponse.json({ error: error.message || 'Launch failed' }, { status: 500 })
  }
}
