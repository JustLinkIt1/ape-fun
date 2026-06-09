'use client'

// ApeProfile page — score, tier, badges, launched tokens, follower system.

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useWallet } from '@solana/wallet-adapter-react'
import ApeScoreBadge from '@/components/ApeScoreBadge'
import { ApeProfile } from '@/types'

export default function ProfilePage() {
  const params = useParams<{ wallet: string }>()
  const { publicKey } = useWallet()
  const [profile, setProfile] = useState<ApeProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const wallet = params.wallet

  useEffect(() => {
    fetch(`/api/profile/${wallet}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => setProfile(d?.profile ?? null))
      .finally(() => setLoading(false))
  }, [wallet])

  const isFollowing =
    profile && publicKey ? profile.followers.includes(publicKey.toBase58()) : false

  async function toggleFollow() {
    if (!publicKey || !profile) return
    const action = isFollowing ? 'unfollow' : 'follow'
    await fetch(`/api/profile/${wallet}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ follower: publicKey.toBase58(), action }),
    })
    const refreshed = await fetch(`/api/profile/${wallet}`).then(r => r.json())
    setProfile(refreshed.profile)
  }

  if (loading) {
    return <main className="max-w-3xl mx-auto px-4 py-12 text-gray-500 text-center">Loading profile…</main>
  }

  if (!profile) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-400">No ApeStation profile for this wallet yet.</p>
      </main>
    )
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">
                {profile.agentTag || profile.apeName || `${wallet.slice(0, 4)}…${wallet.slice(-4)}`}
              </h1>
              {profile.isAgent && (
                <span className="px-2 py-0.5 rounded-full bg-purple-950 border border-purple-700 text-purple-300 text-[10px] font-semibold">
                  🤖 AGENT
                </span>
              )}
              {profile.twitterVerified && <span title="Twitter verified">✅</span>}
            </div>
            <p className="text-xs text-gray-500 font-mono mt-1">{wallet}</p>
          </div>
          {publicKey && publicKey.toBase58() !== wallet && (
            <button
              onClick={toggleFollow}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${
                isFollowing ? 'bg-gray-800 text-gray-300' : 'bg-[#4F7FFF] text-white'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <Stat label="Ape Score">
            <ApeScoreBadge score={profile.apeScore} tier={profile.tier} />
          </Stat>
          <Stat label="Launched">{profile.tokensLaunched.length}</Stat>
          <Stat label="Graduated">{profile.tokensGraduated}</Stat>
          <Stat label="Followers">{profile.followers.length}</Stat>
        </div>

        {profile.badges.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-gray-300 mb-2">Badges</h2>
            <div className="flex flex-wrap gap-2">
              {profile.badges.map(b => (
                <span
                  key={b.id}
                  className="px-2 py-1 rounded-full bg-gray-800 border border-gray-700 text-xs text-gray-300"
                >
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TODO(phase 1.4): launched-tokens grid with outcomes + fee earnings */}
    </main>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-500">{label}</p>
      <div className="text-lg font-bold text-gray-200 mt-0.5">{children}</div>
    </div>
  )
}
