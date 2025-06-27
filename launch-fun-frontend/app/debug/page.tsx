'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/Header'
import { getAllPlatformTokens } from '@/lib/tokenRegistry'

interface Token {
  mint: string
  name: string
  symbol: string
  creator: string
  createdAt: string
  price: number
  marketCap: number
}

export default function DebugPage() {
  const [clientTokens, setClientTokens] = useState<Token[]>([])
  const [serverTokens, setServerTokens] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchServerTokens = async () => {
    try {
      const response = await fetch('/api/tokens/sync')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setServerTokens(data.tokens)
        }
      }
    } catch (error) {
      console.error('Error fetching server tokens:', error)
    }
  }

  useEffect(() => {
    const loadTokens = async () => {
      setIsLoading(true)
      
      // Get client-side tokens
      const clientTokensList = getAllPlatformTokens()
      setClientTokens(clientTokensList)
      
      // Get server-side tokens
      await fetchServerTokens()
      
      setIsLoading(false)
    }

    loadTokens()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-yellow-900/20 to-black">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="animate-spin h-12 w-12 border-4 border-yellow-500 border-t-transparent rounded-full"></div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-yellow-900/20 to-black">
      <Header />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-8">
            <span className="bg-gradient-to-r from-yellow-500 to-white bg-clip-text text-transparent">Debug</span> Token Storage
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Client-side Storage */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Client-side Storage (localStorage)</h2>
              <p className="text-sm text-gray-400 mt-1">{clientTokens.length} tokens</p>
            </div>
            
            <div className="p-6">
              {clientTokens.length === 0 ? (
                <p className="text-gray-400 text-center">No tokens in client storage</p>
              ) : (
                <div className="space-y-4">
                  {clientTokens.map((token) => (
                    <div key={token.mint} className="bg-gray-700/30 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-white">{token.symbol}</h3>
                        <span className="text-sm text-gray-400">{token.mint.slice(0, 8)}...</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{token.name}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                        <div>Creator: {token.creator.slice(0, 8)}...</div>
                        <div>Price: {token.price.toFixed(8)} SOL</div>
                        <div>Market Cap: ${formatNumber(token.marketCap)}</div>
                        <div>Created: {formatDate(token.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Server-side Storage */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Server-side Storage (tokens.json)</h2>
              <p className="text-sm text-gray-400 mt-1">{serverTokens.length} tokens</p>
            </div>
            
            <div className="p-6">
              {serverTokens.length === 0 ? (
                <p className="text-gray-400 text-center">No tokens in server storage</p>
              ) : (
                <div className="space-y-4">
                  {serverTokens.map((token) => (
                    <div key={token.mint} className="bg-gray-700/30 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-white">{token.symbol}</h3>
                        <span className="text-sm text-gray-400">{token.mint.slice(0, 8)}...</span>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{token.name}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                        <div>Creator: {token.creator.slice(0, 8)}...</div>
                        <div>Price: {token.price.toFixed(8)} SOL</div>
                        <div>Market Cap: ${formatNumber(token.marketCap)}</div>
                        <div>Created: {formatDate(token.createdAt)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sync Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6"
        >
          <h3 className="text-lg font-bold text-white mb-4">Storage Sync Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{clientTokens.length}</div>
              <div className="text-sm text-gray-400">Client Tokens</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{serverTokens.length}</div>
              <div className="text-sm text-gray-400">Server Tokens</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${clientTokens.length === serverTokens.length ? 'text-green-400' : 'text-yellow-400'}`}>
                {clientTokens.length === serverTokens.length ? '✓' : '⚠'}
              </div>
              <div className="text-sm text-gray-400">Sync Status</div>
            </div>
          </div>
          
          {clientTokens.length !== serverTokens.length && (
            <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm">
                Client and server storage are out of sync. This may happen if tokens were created in different sessions.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
}