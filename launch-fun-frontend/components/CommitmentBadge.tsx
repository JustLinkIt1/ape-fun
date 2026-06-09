'use client'

// Commit-or-Burn tier badge — visual trust signal on token cards.

import { CommitmentTier } from '@/types'

const TIER_STYLES: Record<CommitmentTier, { label: string; icon: string; classes: string }> = {
  degen: {
    label: 'Degen',
    icon: '🎲',
    classes: 'bg-gray-800 text-gray-400 border-gray-700',
  },
  builder: {
    label: 'Builder',
    icon: '🔨',
    classes: 'bg-blue-950 text-blue-300 border-blue-700',
  },
  diamond: {
    label: 'Diamond',
    icon: '💎',
    classes: 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.3)]',
  },
}

export default function CommitmentBadge({ tier }: { tier: CommitmentTier }) {
  const style = TIER_STYLES[tier]
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${style.classes}`}
      title={
        tier === 'diamond'
          ? '25% dev tokens locked 30 days + 3 public milestones'
          : tier === 'builder'
          ? '10% dev tokens locked 7 days'
          : 'No commitment'
      }
    >
      {style.icon} {style.label}
    </span>
  )
}
