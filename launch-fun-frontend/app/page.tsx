'use client'

import { useEffect, useState } from 'react'
import { generateTagline } from '@/lib/ai'
import { Header } from '@/components/Header'
import { TokenCard } from '@/components/TokenCard'
import { QuickBuyModal } from '@/components/QuickBuyModal'
import { Token } from '@/types'
import { motion } from 'framer-motion'
import { TrendingUp, Rocket, Zap, Trophy } from 'lucide-react'

export default function HomePage() {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [tokens, setTokens] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [tagline, setTagline] = useState(
    'The fastest way to launch and trade memecoins on Solana.'
  )
  const [stats, setStats] = useState({ totalVolume: '0', creators: '0', gradRate: '0%' })

  useEffect(() => {
    async function loadTokens() {
      try {
        const res = await fetch('/api/tokens')
        const data = await res.json()
        if (data.success && Array.isArray(data.tokens)) {
          const mapped: Token[] = data.tokens.map((t: any) => ({
            address: t.mint,
            mint: t.mint,
            name: t.name,
            symbol: t.symbol,
            description: t.description,
            price: t.price,
            priceChange24h: t.priceChange24h ?? 0,
            marketCap: t.marketCap ?? 0,
            volume24h: t.volume24h ?? 0,
            holders: t.holders ?? 0,
            imageUrl: t.imageUrl,
            bondingCurveProgress: t.bondingCurveProgress ?? 0,
            salesTax: t.salesTax ?? 1,
            creator: t.creator,
            twitter: t.twitter,
            telegram: t.telegram,
            website: t.website,
            commitmentTier: t.commitmentTier,
            graduated: t.graduated ?? false,
          }))
          setTokens(mapped)
          const vol = mapped.reduce((s, t) => s + (t.volume24h || 0), 0)
          const creators = new Set(mapped.map(t => t.creator)).size
          const graduated = mapped.filter((t: any) => t.graduated).length
          setStats({
            totalVolume: vol > 1000 ? `$${(vol / 1000).toFixed(1)}K` : `$${vol.toFixed(0)}`,
            creators: creators.toString(),
            gradRate: mapped.length ? `${Math.round((graduated / mapped.length) * 100)}%` : '0%',
          })
        }
      } catch (err) {
        console.error('Failed to load tokens:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadTokens()
  }, [])

  useEffect(() => {
    generateTagline().then(setTagline).catch(() => {})
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-yellow-900/20 to-black">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-yellow-500 via-yellow-400 to-white bg-clip-text text-transparent animate-gradient">
              ApeStation
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              {tagline}
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-12"
          >
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <TrendingUp className="w-8 h-8 text-yellow-400 mb-2 mx-auto" />
              <p className="text-3xl font-bold text-white">{tokens.length}</p>
              <p className="text-gray-400">Tokens Launched</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <Rocket className="w-8 h-8 text-yellow-400 mb-2 mx-auto" />
              <p className="text-3xl font-bold text-white">{stats.totalVolume}</p>
              <p className="text-gray-400">Total Volume</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <Zap className="w-8 h-8 text-yellow-400 mb-2 mx-auto" />
              <p className="text-3xl font-bold text-white">{stats.creators}</p>
              <p className="text-gray-400">Creators</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <Trophy className="w-8 h-8 text-green-400 mb-2 mx-auto" />
              <p className="text-3xl font-bold text-white">{stats.gradRate}</p>
              <p className="text-gray-400">Grad Rate</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tokens Grid */}
      <section className="relative px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">🔥 Trending Tokens</h2>
              <a href="/create" className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded-xl text-sm hover:border-yellow-400 transition-all">
                + Launch Token
              </a>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-gray-800/50 rounded-2xl p-6 animate-pulse">
                    <div className="flex items-center mb-4">
                      <div className="w-14 h-14 bg-gray-700 rounded-full"></div>
                      <div className="ml-4 flex-1">
                        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-700 rounded"></div>
                      <div className="h-3 bg-gray-700 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-6xl mb-4">🦍</p>
                <p className="text-2xl text-gray-400 mb-2">No tokens yet</p>
                <p className="text-gray-500 mb-8">Be the first to launch on ApeStation</p>
                <a href="/create" className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black font-bold rounded-xl hover:scale-105 transition-transform">
                  Launch First Token
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tokens.map((token, index) => (
                  <TokenCard
                    key={token.mint}
                    token={token}
                    index={index}
                    onQuickBuy={setSelectedToken}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Quick Buy Modal */}
      {selectedToken && (
        <QuickBuyModal
          token={selectedToken}
          isOpen={!!selectedToken}
          onClose={() => setSelectedToken(null)}
        />
      )}
    </main>
  )
}
