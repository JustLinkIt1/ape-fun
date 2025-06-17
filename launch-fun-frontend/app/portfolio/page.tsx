'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/Header'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, getAccount, getMint } from '@solana/spl-token'
import { getAllPlatformTokens } from '@/lib/tokenRegistry'
import Link from 'next/link'

interface TokenHolding {
  mint: string
  symbol: string
  name: string
  balance: number
  decimals: number
  price: number
  value: number
  valueUSD: number
  imageUrl?: string
}

export default function Portfolio() {
  const { publicKey } = useWallet()
  const { setVisible } = useWalletModal()
  
  const [holdings, setHoldings] = useState<TokenHolding[]>([])
  const [solBalance, setSolBalance] = useState(0)
  const [solPrice, setSolPrice] = useState(0)
  const [totalValueSOL, setTotalValueSOL] = useState(0)
  const [totalValueUSD, setTotalValueUSD] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Fetch SOL price
  const fetchSolPrice = async () => {
    try {
      const response = await fetch('/api/prices')
      const data = await response.json()
      if (data.success) {
        setSolPrice(data.prices.solana.usd)
      }
    } catch (error) {
      console.error('Error fetching SOL price:', error)
    }
  }

  // Fetch user's token holdings
  const fetchHoldings = async () => {
    if (!publicKey) return

    setIsLoading(true)
    try {
      // Try multiple RPC endpoints from approved providers
      const rpcEndpoints = [
        `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`,
        'https://api.mainnet-beta.solana.com',
        'https://rpc.ankr.com/solana'
      ]
      
      let connection: Connection | null = null
      
      for (const endpoint of rpcEndpoints) {
        try {
          connection = new Connection(endpoint, 'confirmed')
          await connection.getLatestBlockhash()
          console.log(`Connected to RPC: ${endpoint}`)
          break
        } catch (error) {
          console.error(`Failed to connect to ${endpoint}:`, error)
        }
      }
      
      if (!connection) {
        console.error('Failed to connect to any RPC endpoint')
        // Return empty holdings if we can't connect
        setHoldings([])
        setIsLoading(false)
        return
      }
      
      // Get SOL balance
      const balance = await connection.getBalance(publicKey)
      const solBal = balance / LAMPORTS_PER_SOL
      setSolBalance(solBal)

      // Get all token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      )

      const holdings: TokenHolding[] = []
      const platformTokens = getAllPlatformTokens()
      
      for (const { account } of tokenAccounts.value) {
        const parsedInfo = account.data.parsed.info
        const balance = parsedInfo.tokenAmount.uiAmount
        
        if (balance > 0) {
          // Check if this is a platform token
          const platformToken = platformTokens.find(t => t.mint === parsedInfo.mint)
          
          if (platformToken) {
            const valueInSOL = balance * platformToken.price
            const valueInUSD = valueInSOL * solPrice
            
            holdings.push({
              mint: parsedInfo.mint,
              symbol: platformToken.symbol,
              name: platformToken.name,
              balance: balance,
              decimals: parsedInfo.tokenAmount.decimals,
              price: platformToken.price,
              value: valueInSOL,
              valueUSD: valueInUSD,
              imageUrl: platformToken.imageUrl
            })
          }
        }
      }
      
      setHoldings(holdings)
      
      // Calculate total values
      const totalSOL = holdings.reduce((sum, h) => sum + h.value, 0) + solBal
      setTotalValueSOL(totalSOL)
      setTotalValueUSD(totalSOL * solPrice)
      
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error fetching holdings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchSolPrice()
  }, [])

  // Fetch holdings when wallet connects or SOL price updates
  useEffect(() => {
    if (publicKey && solPrice > 0) {
      fetchHoldings()
    }
  }, [publicKey, solPrice])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (publicKey) {
      const interval = setInterval(() => {
        fetchSolPrice()
        fetchHoldings()
      }, 30000)
      
      return () => clearInterval(interval)
    }
  }, [publicKey])

  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num)
  }

  const formatUSD = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num)
  }

  if (!publicKey) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-yellow-900/20 to-black">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8">View your token holdings and portfolio value</p>
            <button
              onClick={() => setVisible(true)}
              className="px-8 py-3 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black rounded-xl font-bold hover:shadow-lg hover:shadow-yellow-500/25 transition-all"
            >
              Connect Wallet
            </button>
          </motion.div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-yellow-900/20 to-black">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <Header />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Portfolio Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-8">
            Your <span className="bg-gradient-to-r from-yellow-500 to-white bg-clip-text text-transparent">Portfolio</span>
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Value Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
            >
              <p className="text-gray-400 text-sm mb-2">Total Portfolio Value</p>
              <p className="text-3xl font-bold text-white mb-1">{formatUSD(totalValueUSD)}</p>
              <p className="text-lg text-gray-300">{formatNumber(totalValueSOL, 4)} SOL</p>
            </motion.div>

            {/* SOL Balance Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
            >
              <p className="text-gray-400 text-sm mb-2">SOL Balance</p>
              <p className="text-3xl font-bold text-white mb-1">{formatNumber(solBalance, 4)} SOL</p>
              <p className="text-lg text-gray-300">{formatUSD(solBalance * solPrice)}</p>
            </motion.div>

            {/* SOL Price Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
            >
              <p className="text-gray-400 text-sm mb-2">SOL Price</p>
              <p className="text-3xl font-bold text-white">{formatUSD(solPrice)}</p>
              {lastRefresh && (
                <p className="text-sm text-gray-500 mt-2">
                  Updated: {lastRefresh.toLocaleTimeString()}
                </p>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Holdings Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Token Holdings</h2>
            <button
              onClick={() => {
                fetchSolPrice()
                fetchHoldings()
              }}
              disabled={isLoading}
              className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {isLoading && holdings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="animate-spin h-12 w-12 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your holdings...</p>
            </div>
          ) : holdings.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 mb-4">No token holdings found</p>
              <p className="text-sm text-gray-500">Buy some tokens to see them here!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Token</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Price (SOL)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Value (SOL)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Value (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {holdings.map((holding) => (
                    <tr key={holding.mint} className="hover:bg-gray-700/30 transition-colors cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/token/${holding.mint}`} className="flex items-center group">
                          {holding.imageUrl && (
                            <img
                              src={holding.imageUrl}
                              alt={holding.symbol}
                              className="w-8 h-8 rounded-full mr-3"
                            />
                          )}
                          <div>
                            <p className="text-white font-medium group-hover:text-yellow-400 transition-colors">{holding.symbol}</p>
                            <p className="text-sm text-gray-400">{holding.name}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right text-white">
                        <Link href={`/token/${holding.mint}`}>
                          {formatNumber(holding.balance)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300">
                        <Link href={`/token/${holding.mint}`}>
                          {formatNumber(holding.price, 8)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right text-white">
                        <Link href={`/token/${holding.mint}`}>
                          {formatNumber(holding.value, 4)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right text-white font-medium">
                        <Link href={`/token/${holding.mint}`}>
                          {formatUSD(holding.valueUSD)}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
}
