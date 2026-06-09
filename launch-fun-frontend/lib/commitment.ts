// Commit-or-Burn — anti-rug by mechanism.
// Devs choose a commitment tier at launch; higher tiers lock tokens and
// (for Diamond) publish on-chain milestone commitments the community votes on.

import { Commitment, CommitmentTier, Milestone } from '@/types'

export interface TierRules {
  label: string
  lockRatio: number          // fraction of dev allocation locked
  lockDays: number
  requiresMilestones: boolean
  feeShareBonus: number      // extra fraction of creator fee share when unlocked
  visibilityBoost: number    // feed ranking multiplier
}

export const COMMITMENT_TIERS: Record<CommitmentTier, TierRules> = {
  degen: {
    label: 'Degen',
    lockRatio: 0,
    lockDays: 0,
    requiresMilestones: false,
    feeShareBonus: 0,
    visibilityBoost: 1.0,
  },
  builder: {
    label: 'Builder',
    lockRatio: 0.1,
    lockDays: 7,
    requiresMilestones: false,
    feeShareBonus: 0,
    visibilityBoost: 1.25,
  },
  diamond: {
    label: 'Diamond',
    lockRatio: 0.25,
    lockDays: 30,
    requiresMilestones: true,
    feeShareBonus: 0.1,
    visibilityBoost: 1.5,
  },
}

// On milestone failure: 50% of remaining locked tokens burn, 50% to voters
export const MILESTONE_FAIL_BURN_RATIO = 0.5
export const MILESTONE_VOTE_WINDOW_DAYS = 7

export async function hashMilestone(description: string): Promise<string> {
  const data = new TextEncoder().encode(description)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function buildCommitment(
  tokenMint: string,
  tier: CommitmentTier,
  devAllocation: number,
  milestoneInputs: { description: string; dueDate: string }[] = []
): Promise<Commitment> {
  const rules = COMMITMENT_TIERS[tier]
  if (rules.requiresMilestones && milestoneInputs.length !== 3) {
    throw new Error('Diamond tier requires exactly 3 milestones')
  }

  const milestones: Milestone[] = await Promise.all(
    milestoneInputs.map(async (m, index) => ({
      index,
      description: m.description,
      dueDate: m.dueDate,
      commitmentHash: await hashMilestone(m.description),
      status: 'pending' as const,
      votesYes: 0,
      votesNo: 0,
    }))
  )

  const lockEndsAt = new Date(Date.now() + rules.lockDays * 86400_000).toISOString()

  return {
    tokenMint,
    tier,
    lockedAmount: devAllocation * rules.lockRatio,
    lockEndsAt,
    milestones,
  }
}

export function milestoneVotePassed(m: Milestone): boolean {
  const total = m.votesYes + m.votesNo
  return total > 0 && m.votesYes / total > 0.5
}
