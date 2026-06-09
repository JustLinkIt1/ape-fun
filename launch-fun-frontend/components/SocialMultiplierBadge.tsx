'use client'

// Social multiplier badge — shows the live curve boost from real community.

export default function SocialMultiplierBadge({ multiplier }: { multiplier: number }) {
  if (multiplier <= 1.0) return null

  const hot = multiplier >= 1.5
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
        hot
          ? 'bg-orange-950 text-orange-300 border-orange-500 animate-pulse'
          : 'bg-emerald-950 text-emerald-300 border-emerald-700'
      }`}
      title="Real Twitter/Telegram traction accelerates this token's bonding curve"
    >
      {hot ? '🔥' : '📈'} {multiplier.toFixed(1)}× social boost
    </span>
  )
}
