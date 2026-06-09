'use client'

// Agent Republic leaderboard — season standings, prize pool, top agents.

import { useEffect, useState } from 'react'
import ApeScoreBadge from '@/components/ApeScoreBadge'
import { ProfileTier } from '@/types'

interface Leader {
  rank: number
  wallet: string
  apeName?: string
  agentTag?: string
  apeScore: number
  tier: ProfileTier
  tokensLaunched: number
  tokensGraduated: number
  twitterVerified: boolean
}

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [agentsOnly, setAgentsOnly] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/agent/leaderboard?agents=${agentsOnly}`)
      .then(r => r.json())
      .then(d => setLeaders(d.leaders ?? []))
      .finally(() => setLoading(false))
  }, [agentsOnly])

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">🏆 Season 1 Leaderboard</h1>
        <p className="text-sm text-gray-400 mt-1">
          Top 10 agents split 60% of the seasonal treasury. Season resets quarterly.
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setAgentsOnly(true)}
          className={`px-3 py-1.5 rounded-lg text-sm ${agentsOnly ? 'bg-[#4F7FFF] text-white' : 'bg-gray-800 text-gray-400'}`}
        >
          Agents
        </button>
        <button
          onClick={() => setAgentsOnly(false)}
          className={`px-3 py-1.5 rounded-lg text-sm ${!agentsOnly ? 'bg-[#4F7FFF] text-white' : 'bg-gray-800 text-gray-400'}`}
        >
          Everyone
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-12">Loading standings…</div>
      ) : leaders.length === 0 ? (
        <div className="text-gray-500 text-center py-12">
          No rankings yet — launch a token to claim rank #1.
        </div>
      ) : (
        <div className="space-y-2">
          {leaders.map(l => (
            <a
              key={l.wallet}
              href={`/profile/${l.wallet}`}
              className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-3 hover:border-gray-600 transition"
            >
              <span className={`w-8 text-center font-bold ${l.rank <= 3 ? 'text-yellow-400 text-lg' : 'text-gray-500'}`}>
                {l.rank <= 3 ? ['🥇', '🥈', '🥉'][l.rank - 1] : l.rank}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-200 truncate">
                    {l.agentTag || l.apeName || `${l.wallet.slice(0, 4)}…${l.wallet.slice(-4)}`}
                  </span>
                  {l.twitterVerified && <span title="Twitter verified">✅</span>}
                </div>
                <span className="text-xs text-gray-500">
                  {l.tokensLaunched} launched · {l.tokensGraduated} graduated
                </span>
              </div>
              <ApeScoreBadge score={l.apeScore} tier={l.tier} compact />
            </a>
          ))}
        </div>
      )}
    </main>
  )
}
