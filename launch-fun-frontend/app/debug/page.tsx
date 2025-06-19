'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { getPlatformTokens } from '@/lib/tokenRegistry'

export default function DebugPage() {
  const [localTokens, setLocalTokens] = useState<any>({})
  const [serverData, setServerData] = useState<any>(null)
  const [mintToCheck, setMintToCheck] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Get tokens from localStorage
    const tokens = getPlatformTokens()
    setLocalTokens(tokens)
  }, [])

  const checkToken = async () => {
    if (!mintToCheck) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/debug/tokens?mint=${mintToCheck}`)
      const data = await response.json()
      setServerData(data)
    } catch (error) {
      console.error('Debug error:', error)
      setServerData({ error: 'Failed to fetch debug data' })
    } finally {
      setLoading(false)
    }
  }

  const checkAllTokens = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/tokens')
      const data = await response.json()
      setServerData(data)
    } catch (error) {
      console.error('Debug error:', error)
      setServerData({ error: 'Failed to fetch debug data' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-yellow-900/20 to-black">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Token Debug Panel</h1>
        
        {/* Check specific token */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Check Specific Token</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={mintToCheck}
              onChange={(e) => setMintToCheck(e.target.value)}
              placeholder="Enter token mint address"
              className="flex-1 px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-lg text-white"
            />
            <button
              onClick={checkToken}
              disabled={loading}
              className="px-6 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 disabled:opacity-50"
            >
              Check Token
            </button>
            <button
              onClick={checkAllTokens}
              disabled={loading}
              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-400 disabled:opacity-50"
            >
              Check All
            </button>
          </div>
        </div>

        {/* Local Storage Tokens */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Local Storage Tokens</h2>
          <pre className="text-xs text-gray-300 overflow-auto max-h-96">
            {JSON.stringify(localTokens, null, 2)}
          </pre>
        </div>

        {/* Server Data */}
        {serverData && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Server & On-Chain Data</h2>
            <pre className="text-xs text-gray-300 overflow-auto max-h-96">
              {JSON.stringify(serverData, null, 2)}
            </pre>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8 text-sm text-gray-400">
          <p>Quick test links:</p>
          <ul className="mt-2 space-y-1">
            {Object.keys(localTokens).map(mint => (
              <li key={mint}>
                <button
                  onClick={() => setMintToCheck(mint)}
                  className="text-yellow-400 hover:text-yellow-300"
                >
                  {mint}
                </button>
                {' - '}
                <a
                  href={`/token/${mint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  View Token Page
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  )
}