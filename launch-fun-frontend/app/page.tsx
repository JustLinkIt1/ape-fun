'use client'

import { useEffect, useState } from 'react'
import { generateTagline } from '@/lib/ai'
import { Header } from '@/components/Header'
import { TokenCard } from '@/components/TokenCard'
import { QuickBuyModal } from '@/components/QuickBuyModal'
import { Token } from '@/types'
import { motion } from 'framer-motion'
import { TrendingUp, Rocket, Zap, Trophy } from 'lucide-react'
import { getAllPlatformTokens } from '@/lib/tokenRegistry'

export default function HomePage() {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [tokens, setTokens] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [tagline, setTagline] = useState(
    'The fastest way to launch and trade memecoins on Solana.'
  )

  useEffect(() => {
    // Load platform tokens
    const platformTokens = getAllPlatformTokens()
    
    // Map platform tokens to Token format
    const mappedPlatformTokens: Token[] = platformTokens.map(pt => ({
      address: pt.mint, // Use mint as address for compatibility
      mint: pt.mint,
      name: pt.name,
      symbol: pt.symbol,
      price: pt.price,
      priceChange24h: pt.priceChange24h,
      marketCap: pt.marketCap,
      volume24h: pt.volume24h,
      holders: pt.holders,
      imageUrl: pt.imageUrl,
      bondingCurveProgress: pt.bondingCurveProgress,
      salesTax: pt.salesTax
    }))
    
    setTokens(mappedPlatformTokens)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    generateTagline().then(setTagline)
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
              Ape Fun
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
              <p className="text-3xl font-bold text-white">$5.2M</p>
              <p className="text-gray-400">Total Volume</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <Zap className="w-8 h-8 text-yellow-400 mb-2 mx-auto" />
              <p className="text-3xl font-bold text-white">12.5K</p>
              <p className="text-gray-400">Active Traders</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <Trophy className="w-8 h-8 text-green-400 mb-2 mx-auto" />
              <p className="text-3xl font-bold text-white">89%</p>
              <p className="text-gray-400">Success Rate</p>
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
            <h2 className="text-3xl font-bold text-white mb-8">🔥 Trending Tokens</h2>
            
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
