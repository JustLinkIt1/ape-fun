// Ape Score — the platform-wide reputation metagame.
// Score events map on-chain/platform actions to points; tiers gate perks.

import { ProfileTier, ScoreEvent, ScoreEventType } from '@/types'

export const SCORE_TABLE: Record<ScoreEventType, number> = {
  token_launched: 50,
  token_graduated: 500,
  early_buyer_graduated: 200,
  milestone_vote_correct: 25,
  agent_referral: 100,
  diamond_hold_week: 50,
}

// Tier thresholds — cumulative Ape Score
export const TIER_THRESHOLDS: { tier: ProfileTier; min: number }[] = [
  { tier: 'diamond_kong', min: 25000 },
  { tier: 'kong', min: 10000 },
  { tier: 'gorilla', min: 2500 },
  { tier: 'ape', min: 500 },
  { tier: 'shrimp', min: 0 },
]

export function tierForScore(score: number): ProfileTier {
  for (const { tier, min } of TIER_THRESHOLDS) {
    if (score >= min) return tier
  }
  return 'shrimp'
}

export function buildScoreEvent(
  wallet: string,
  type: ScoreEventType,
  tokenMint?: string
): ScoreEvent {
  return {
    wallet,
    type,
    points: SCORE_TABLE[type],
    tokenMint,
    timestamp: new Date().toISOString(),
  }
}

// Early-access window: top 5% of Ape Score holders see launches 60s early.
export const EARLY_ACCESS_PERCENTILE = 0.05
export const EARLY_ACCESS_WINDOW_SECONDS = 60

// Seasonal treasury split
export const SEASON_TREASURY_SPLIT = {
  topAgents: 0.6,       // top 10 agents by season score
  topApeScore: 0.3,     // top 1% Ape Score holders
  protocol: 0.1,
}
