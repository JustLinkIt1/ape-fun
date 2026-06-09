// Social Bonding Curves — real community metrics accelerate curve progress.
// Multiplier is computed server-side from verified Twitter/Telegram data;
// never from self-reported numbers.

import { SocialMetrics } from '@/types'

// Weights from the implementation plan
const W_TWITTER_GROWTH = 0.3
const W_TELEGRAM = 0.4
const W_ENGAGEMENT = 0.3

// Normalization caps — metric values at/above these earn the full weight
const TWITTER_GROWTH_CAP = 5000   // followers gained in 24h
const TELEGRAM_MEMBERS_CAP = 10000
const ENGAGEMENT_RATE_CAP = 0.1   // 10% engagement is exceptional

// Multiplier bounds: 1.0 (no community) to 2.0 (max boost).
// Capped so social signal accelerates but never dominates capital.
export const MIN_MULTIPLIER = 1.0
export const MAX_MULTIPLIER = 2.0

export function computeSocialMultiplier(metrics: SocialMetrics): number {
  const growth = Math.min(metrics.twitterFollowersGained24h / TWITTER_GROWTH_CAP, 1)
  const telegram = Math.min(metrics.telegramMembers / TELEGRAM_MEMBERS_CAP, 1)
  const engagement = Math.min(metrics.twitterEngagementRate / ENGAGEMENT_RATE_CAP, 1)

  const signal =
    growth * W_TWITTER_GROWTH +
    telegram * W_TELEGRAM +
    engagement * W_ENGAGEMENT

  return MIN_MULTIPLIER + signal * (MAX_MULTIPLIER - MIN_MULTIPLIER)
}

// Effective graduation progress: social multiplier lowers the market cap
// needed to graduate, so strong communities reach Raydium sooner.
export function effectiveGraduationTarget(
  baseTargetMarketCap: number,
  multiplier: number
): number {
  return baseTargetMarketCap / multiplier
}

// TODO(phase 2.3): fetch real metrics on a 30-minute cron
//  - Twitter API v2: followers_count, recent tweet engagement
//  - Telegram Bot API: getChatMemberCount
export async function fetchSocialMetrics(tokenMint: string): Promise<SocialMetrics> {
  return {
    tokenMint,
    twitterFollowers: 0,
    twitterFollowersGained24h: 0,
    twitterEngagementRate: 0,
    telegramMembers: 0,
    fetchedAt: new Date().toISOString(),
  }
}
