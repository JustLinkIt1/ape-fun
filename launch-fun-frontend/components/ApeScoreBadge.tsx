'use client'

// Ape Score + tier badge for profiles, comments, and leaderboards.

import { ProfileTier } from '@/types'

const TIER_META: Record<ProfileTier, { label: string; icon: string; classes: string }> = {
  shrimp: { label: 'Shrimp', icon: '🦐', classes: 'text-gray-400' },
  ape: { label: 'Ape', icon: '🦍', classes: 'text-emerald-400' },
  gorilla: { label: 'Gorilla', icon: '🦾', classes: 'text-blue-400' },
  kong: { label: 'Kong', icon: '👑', classes: 'text-purple-400' },
  diamond_kong: { label: 'Diamond Kong', icon: '💎👑', classes: 'text-cyan-300' },
}

export default function ApeScoreBadge({
  score,
  tier,
  compact = false,
}: {
  score: number
  tier: ProfileTier
  compact?: boolean
}) {
  const meta = TIER_META[tier]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${meta.classes}`}>
      <span>{meta.icon}</span>
      {!compact && <span>{meta.label}</span>}
      <span className="font-mono">{score.toLocaleString()}</span>
    </span>
  )
}
