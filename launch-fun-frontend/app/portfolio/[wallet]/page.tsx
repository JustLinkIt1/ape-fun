'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Header } from '@/components/Header'
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { getAllPlatformTokens, getTokensByCreator } from '@/lib/tokenRegistry'
import Link from 'next/link'
import { ArrowLeft, Copy, ExternalLink } from 'lucide-react'

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

export default function WalletPortfolio() {
  const params = useParams()
  const walletAddress = params.wallet as string
  
  const [holdings, setHoldings] = useState<TokenHolding[]>([])
  const [solBalance, setSolBalance] = useState(0)
  const [solPrice, setSolPrice] = useState(0)
  const [totalValueSOL, setTotalValueSOL] = useState(0)
  const [totalValueUSD, setTotalValueUSD] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [createdTokens, setCreatedTokens] = useState<any[]>([])
  const [copied, setCopied] = useState(false)

  // Format number with commas and decimals
  const formatNumber = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num)
  }

  // Format USD
  const formatUSD = (amount: number) => {
    return `$${formatNumber(amount, 2)}`
  }

  // Copy wallet address
  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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

  // Fetch wallet's token holdings
  const fetchHoldings = async () => {
    if (!walletAddress) return

    setIsLoading(true)
    try {
      const walletPubkey = new PublicKey(walletAddress)
      
      // Try multiple RPC endpoints
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
          break
        } catch (error) {
          console.error(`Failed to connect to ${endpoint}:`, error)
        }
      }
      
      if (!connection) {
        console.error('Failed to connect to any RPC endpoint')
        setIsLoading(false)
        return
      }
      
      // Get SOL balance
      const balance = await connection.getBalance(walletPubkey)
      const solBal = balance / LAMPORTS_PER_SOL
      setSolBalance(solBal)

      // Get all token accounts
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        walletPubkey,
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
      
      // Get tokens created by this wallet
      const created = getTokensByCreator(walletAddress)
      setCreatedTokens(created)
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

  // Fetch holdings when wallet or SOL price updates
  useEffect(() => {
    if (walletAddress && solPrice > 0) {
      fetchHoldings()
    }
  }, [walletAddress, solPrice])

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-yellow-900/20 to-black">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <Header />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Wallet Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            Wallet <span className="bg-gradient-to-r from-yellow-500 to-white bg-clip-text text-transparent">Portfolio</span>
          </h1>
          
          <div className="flex items-center gap-4 mb-8">
            <code className="text-lg text-gray-300 font-mono">
              {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
            </code>
            <button
              onClick={copyAddress}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Copy address"
            >
              <Copy className="w-4 h-4" />
            </button>
            <a
              href={`https://solscan.io/account/${walletAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="View on Solscan"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            {copied && (
              <span className="text-sm text-green-400">Copied!</span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            {/* Tokens Created Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700"
            >
              <p className="text-gray-400 text-sm mb-2">Tokens Created</p>
              <p className="text-3xl font-bold text-white">{createdTokens.length}</p>
              <p className="text-lg text-gray-300">on Launch.fun</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Holdings Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden mb-8"
        >
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">Token Holdings</h2>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin h-12 w-12 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Loading holdings...</p>
            </div>
          ) : holdings.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400">No token holdings found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Token</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Value (SOL)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Value (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {holdings.map((holding) => (
                    <tr key={holding.mint} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/token/${holding.mint}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                          {holding.imageUrl && (
                            <img src={holding.imageUrl} alt={holding.symbol} className="w-8 h-8 rounded-full" />
                          )}
                          <div>
                            <p className="text-white font-medium">{holding.name}</p>
                            <p className="text-sm text-gray-400">${holding.symbol}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-right text-white">
                        {formatNumber(holding.balance, 2)}
                      </td>
                      <td className="px-6 py-4 text-right text-white">
                        {formatNumber(holding.price, 8)} SOL
                      </td>
                      <td className="px-6 py-4 text-right text-white">
                        {formatNumber(holding.value, 4)}
                      </td>
                      <td className="px-6 py-4 text-right text-white">
                        {formatUSD(holding.valueUSD)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Created Tokens Section */}
        {createdTokens.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Tokens Created</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {createdTokens.map((token) => (
                  <Link
                    key={token.mint}
                    href={`/token/${token.mint}`}
                    className="bg-gray-700/30 rounded-xl p-4 hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {token.imageUrl && (
                        <img
                          src={token.imageUrl}
                          alt={token.symbol}
                          className="w-10 h-10 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-white">{token.name}</p>
                        <p className="text-sm text-gray-400">${token.symbol}</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Price:</span>
                        <span className="text-white">{formatNumber(token.price, 8)} SOL</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Market Cap:</span>
                        <span className="text-white">{formatUSD(token.marketCap * solPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Progress:</span>
                        <span className="text-white">{token.bondingCurveProgress}%</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  )
}