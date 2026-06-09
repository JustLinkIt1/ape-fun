'use client'

// Token Intelligence Card — Claude's scores rendered as colored bars + AI take.
// Shown on token detail pages and (compact) on feed cards.

import { TokenIntelligence } from '@/types'

function ScoreBar({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  // invert: high value is bad (rug risk)
  const good = invert ? 100 - value : value
  const color =
    good >= 70 ? 'bg-emerald-400' : good >= 40 ? 'bg-yellow-400' : 'bg-red-500'

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-28 text-gray-400">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-8 text-right font-mono text-gray-300">{value}</span>
    </div>
  )
}

export default function TokenIntelligenceCard({ analysis }: { analysis: TokenIntelligence }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200">🧠 Token Intelligence</h3>
        <span className="text-lg font-bold text-[#4F7FFF]">{analysis.compositeScore}</span>
      </div>

      <div className="space-y-2">
        <ScoreBar label="Narrative" value={analysis.narrativeScore} />
        <ScoreBar label="Social Signal" value={analysis.socialScore} />
        <ScoreBar label="Dev Credibility" value={analysis.devCredibility} />
        <ScoreBar label="Rug Risk" value={analysis.rugRisk} invert />
      </div>

      <p className="text-xs text-gray-400 italic border-t border-gray-800 pt-3">
        “{analysis.summary}”
      </p>
      <p className="text-[10px] text-gray-600">
        AI analysis · updated {new Date(analysis.analyzedAt).toLocaleTimeString()}
      </p>
    </div>
  )
}
