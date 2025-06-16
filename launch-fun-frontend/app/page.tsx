'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/Header'
import { TokenCard } from '@/components/TokenCard'
import { QuickBuyModal } from '@/components/QuickBuyModal'
import { Token } from '@/types'
import { motion } from 'framer-motion'
import { TrendingUp, Rocket, Zap, Trophy } from 'lucide-react'
import { getAllPlatformTokens } from '@/lib/tokenRegistry'

// Mock tokens for display
const mockTokens: Token[] = [
  {
    address: 'DogK1111111111111111111111111111111111111111',
    mint: 'DogK1111111111111111111111111111111111111111',
    name: 'Doge Killer',
    symbol: 'DOGK',
    price: 0.00234,
    priceChange24h: 45.2,
    marketCap: 1200000,
    volume24h: 450000,
    holders: 1234,
    imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=DOGK',
    bondingCurveProgress: 75
  },
  {
    address: 'PEPE2222222222222222222222222222222222222222',
    mint: 'PEPE2222222222222222222222222222222222222222',
    name: 'Pepe Classic',
    symbol: 'PEPEC',
    price: 0.00089,
    priceChange24h: -12.3,
    marketCap: 890000,
    volume24h: 234000,
    holders: 987,
    imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=PEPEC',
    bondingCurveProgress: 45
  },
  {
    address: 'MOON3333333333333333333333333333333333333333',
    mint: 'MOON3333333333333333333333333333333333333333',
    name: 'Moon Shot',
    symbol: 'MOON',
    price: 0.00567,
    priceChange24h: 89.7,
    marketCap: 2300000,
    volume24h: 780000,
    holders: 2345,
    imageUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=MOON',
    bondingCurveProgress: 92
  }
]

export default function HomePage() {
  const [selectedToken, setSelectedToken] = useState<Token | null>(null)
  const [tokens, setTokens] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
      bondingCurveProgress: pt.bondingCurveProgress
    }))
    
    // Combine platform tokens with mock tokens
    const allTokens = [...mappedPlatformTokens, ...mockTokens]
    
    // Remove duplicates based on mint address
    const uniqueTokens = allTokens.filter((token, index, self) =>
      index === self.findIndex((t) => t.mint === token.mint)
    )
    
    setTokens(uniqueTokens)
    setIsLoading(false)
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
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
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
              Ape Fun
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              The fastest way to launch and trade memecoins on Solana.
              Fair launches, instant liquidity, and moon potential! 🚀
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
              <TrendingUp className="w-8 h-8 text-purple-400 mb-2 mx-auto" />
              <p className="text-3xl font-bold text-white">{tokens.length}</p>
              <p className="text-gray-400">Tokens Launched</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
              <Rocket className="w-8 h-8 text-pink-400 mb-2 mx-auto" />
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