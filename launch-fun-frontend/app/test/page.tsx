'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/Header'
import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { RPC_ENDPOINTS, DEVNET_RPC_ENDPOINTS } from '@/lib/constants'

export default function TestPage() {
  const [results, setResults] = useState<{endpoint: string, status: string, latency?: number}[]>([])
  const [testing, setTesting] = useState(false)
  const [network, setNetwork] = useState<'mainnet' | 'devnet'>('mainnet')

  const testEndpoints = async () => {
    setTesting(true)
    setResults([])
    
    const endpoints = network === 'mainnet' ? RPC_ENDPOINTS : DEVNET_RPC_ENDPOINTS
    
    for (const endpoint of endpoints) {
      const startTime = Date.now()
      try {
        const connection = new Connection(endpoint, 'confirmed')
        const { blockhash } = await connection.getLatestBlockhash()
        const latency = Date.now() - startTime
        
        setResults(prev => [...prev, {
          endpoint,
          status: `✅ Connected (${latency}ms)`,
          latency
        }])
      } catch (error: any) {
        setResults(prev => [...prev, {
          endpoint,
          status: `❌ Failed: ${error.message}`
        }])
      }
    }
    
    setTesting(false)
  }

  const testAirdrop = async () => {
    if (network !== 'devnet') {
      alert('Airdrop only works on devnet!')
      return
    }
    
    try {
      const connection = new Connection(DEVNET_RPC_ENDPOINTS[0])
      const testWallet = '3tAQBPnSxMZ7CAvgib29hWFiebRFqupEHLZQENSogewi'
      const signature = await connection.requestAirdrop(
        new (await import('@solana/web3.js')).PublicKey(testWallet),
        2 * LAMPORTS_PER_SOL
      )
      await connection.confirmTransaction(signature)
      alert('Airdrop successful! Check wallet on devnet.')
    } catch (error: any) {
      alert(`Airdrop failed: ${error.message}`)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-yellow-900/20 to-black">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700"
        >
          <h1 className="text-3xl font-bold text-white mb-8">RPC Endpoint Test</h1>
          
          <div className="mb-6 flex gap-4">
            <button
              onClick={() => setNetwork('mainnet')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                network === 'mainnet' 
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Mainnet
            </button>
            <button
              onClick={() => setNetwork('devnet')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                network === 'devnet' 
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Devnet
            </button>
          </div>
          
          <div className="space-y-4 mb-6">
            <button
              onClick={testEndpoints}
              disabled={testing}
              className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black rounded-xl font-bold hover:shadow-lg hover:shadow-yellow-500/25 transition-all disabled:opacity-50"
            >
              {testing ? 'Testing...' : 'Test RPC Endpoints'}
            </button>
            
            {network === 'devnet' && (
              <button
                onClick={testAirdrop}
                className="ml-4 px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
              >
                Request Airdrop (2 SOL)
              </button>
            )}
          </div>
          
          {results.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white mb-4">Results:</h2>
              {results.map((result, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-700/50 rounded-lg text-sm font-mono"
                >
                  <div className="text-gray-300">{result.endpoint}</div>
                  <div className={result.status.includes('✅') ? 'text-green-400' : 'text-red-400'}>
                    {result.status}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <h3 className="text-sm font-semibold text-blue-400 mb-2">Testing Tips:</h3>
            <ul className="text-xs text-blue-400/80 space-y-1">
              <li>• Use Devnet for testing token creation without real SOL</li>
              <li>• Some RPC endpoints may have rate limits</li>
              <li>• If all endpoints fail, check your internet connection</li>
              <li>• For production, consider using a paid RPC service</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
