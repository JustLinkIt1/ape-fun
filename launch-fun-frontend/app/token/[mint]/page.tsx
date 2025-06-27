'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Header } from '@/components/Header'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getPlatformToken, getPlatformTokens, updateTokenPrice, savePlatformToken } from '@/lib/tokenRegistry'
import { getMint, getAccount } from '@solana/spl-token'
import { estimateBuyTokens, estimateSellReturn } from '@/lib/bondingCurve'
import * as Toast from '@radix-ui/react-toast'
import { ArrowUpRight, ArrowDownRight, TrendingUp, Users, DollarSign, Activity } from 'lucide-react'
import Link from 'next/link'
import { getAssociatedTokenAddress } from '@solana/spl-token'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'

// Mock tokens for demonstration
const mockTokens: any[] = [
  {
    mint: 'DogK1111111111111111111111111111111111111111',
    name: 'Doge Killer',
    symbol: 'DOGEKILL',
    price: 0.00042,
    priceChange24h: 125.5,
    marketCap: 2400000,
    volume24h: 580000,
    holders: 1234,
    imageUrl: 'https://via.placeholder.com/150',
    bondingCurveProgress: 67
  },
  {
    mint: 'Moon2222222222222222222222222222222222222222',
    name: 'Moon Shot',
    symbol: 'MOON',
    price: 0.00089,
    priceChange24h: 89.2,
    marketCap: 1800000,
    volume24h: 420000,
    holders: 987,
    imageUrl: 'https://via.placeholder.com/150',
    bondingCurveProgress: 45
  },
  {
    mint: 'Pepe3333333333333333333333333333333333333333',
    name: 'Pepe Classic',
    symbol: 'PEPEC',
    price: 0.00156,
    priceChange24h: -12.3,
    marketCap: 3200000,
    volume24h: 890000,
    holders: 2345,
    imageUrl: 'https://via.placeholder.com/150',
    bondingCurveProgress: 92
  },
  {
    mint: 'Woja4444444444444444444444444444444444444444',
    name: 'Wojak Finance',
    symbol: 'WOJAK',
    price: 0.00023,
    priceChange24h: 45.7,
    marketCap: 980000,
    volume24h: 230000,
    holders: 567,
    imageUrl: 'https://via.placeholder.com/150',
    bondingCurveProgress: 23
  },
  {
    mint: 'Chad5555555555555555555555555555555555555555',
    name: 'Chad Token',
    symbol: 'CHAD',
    price: 0.00567,
    priceChange24h: 234.5,
    marketCap: 5600000,
    volume24h: 1200000,
    holders: 3456,
    imageUrl: 'https://via.placeholder.com/150',
    bondingCurveProgress: 78
  },
  {
    mint: 'Rug66666666666666666666666666666666666666666',
    name: 'Rug Pull',
    symbol: 'RUG',
    price: 0.00001,
    priceChange24h: -89.5,
    marketCap: 45000,
    volume24h: 12000,
    holders: 123,
    imageUrl: 'https://via.placeholder.com/150',
    bondingCurveProgress: 5
  },
  {
    mint: 'Diam7777777777777777777777777777777777777777',
    name: 'Diamond Hands',
    symbol: 'DIAMOND',
    price: 0.00789,
    priceChange24h: 56.8,
    marketCap: 8900000,
    volume24h: 2300000,
    holders: 4567,
    imageUrl: 'https://via.placeholder.com/150',
    bondingCurveProgress: 95
  },
  {
    mint: 'TTM88888888888888888888888888888888888888888',
    name: 'To The Moon',
    symbol: 'TTM',
    price: 0.00345,
    priceChange24h: 12.4,
    marketCap: 4500000,
    volume24h: 980000,
    holders: 2890,
    imageUrl: 'https://via.placeholder.com/150',
    bondingCurveProgress: 60
  }
]

export default function TokenPage() {
  const params = useParams()
  const mint = params.mint as string
  const { publicKey, signTransaction } = useWallet()
  const { setVisible } = useWalletModal()
  
  const [token, setToken] = useState<any>(null)
  const [solPrice, setSolPrice] = useState(0)
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [amount, setAmount] = useState('')
  const [estimatedOutput, setEstimatedOutput] = useState(0)
  const [isTrading, setIsTrading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [slippage, setSlippage] = useState(0.01) // 1% default slippage
  const [userTokenBalance, setUserTokenBalance] = useState<number | null>(null)
  const [userSolBalance, setUserSolBalance] = useState<number | null>(null)

  // Fetch token data
  useEffect(() => {
    const fetchToken = async () => {
      // Always try backend API first for all users
      try {
        const response = await fetch(`/api/tokens/${mint}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.token) {
            setToken(data.token)
            // Optionally: savePlatformToken(data.token) // for caching
            return
          }
        }
      } catch (error) {
        console.error('Error fetching token from API:', error)
      }

      // If not found via API, try to fetch on-chain data
      try {
        const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')
        const mintPubkey = new PublicKey(mint)
        // Check if mint exists
        const mintInfo = await connection.getParsedAccountInfo(mintPubkey)
        if (mintInfo.value) {
          const parsedData = mintInfo.value.data as any
          const supply = parsedData.parsed?.info?.supply
          const decimals = parsedData.parsed?.info?.decimals || 9
          // Create a basic token object from on-chain data
          const onChainToken = {
            mint: mint,
            name: 'Unknown Token',
            symbol: 'UNKNOWN',
            price: 0.000001,
            priceChange24h: 0,
            marketCap: 1000,
            volume24h: 0,
            holders: 1,
            imageUrl: '',
            bondingCurveProgress: 0,
            description: 'This token exists on-chain. Metadata is being loaded...',
            creator: '',
            createdAt: new Date().toISOString(),
            totalSupply: parseInt(supply) / Math.pow(10, decimals),
            decimals: decimals,
            salesTax: 3
          }
          setToken(onChainToken)
          // Try to get metadata
          const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
          const [metadataPDA] = PublicKey.findProgramAddressSync(
            [
              Buffer.from('metadata'),
              TOKEN_METADATA_PROGRAM_ID.toBuffer(),
              mintPubkey.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID
          )
          const metadataAccount = await connection.getAccountInfo(metadataPDA)
          if (metadataAccount && metadataAccount.data) {
            // Decode metadata
            const data = metadataAccount.data
            let offset = 1 + 1 + 32 + 32 // Skip to name
            const nameBytes = data.slice(offset, offset + 32)
            const name = nameBytes.toString('utf8').replace(/\0/g, '').trim()
            offset += 32
            const symbolBytes = data.slice(offset, offset + 10)
            const symbol = symbolBytes.toString('utf8').replace(/\0/g, '').trim()
            if (name || symbol) {
              setToken((prev: any) => ({
                ...prev,
                name: name || prev.name,
                symbol: symbol || prev.symbol
              }))
            }
          }
          return
        }
      } catch (error) {
        console.error('Error fetching on-chain data:', error)
      }

      // Check mock tokens as final fallback
      const mockToken = mockTokens.find(t => t.mint === mint)
      if (mockToken) {
        setToken(mockToken)
      }
    }
    fetchToken()
  }, [mint])

  // Fetch SOL price
  useEffect(() => {
    fetch('/api/prices')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSolPrice(data.prices.solana.usd)
        }
      })
  }, [])

  // Calculate estimated output using bonding curve helpers
  useEffect(() => {
    if (!amount || !token) {
      setEstimatedOutput(0)
      return
    }

    const inputAmount = parseFloat(amount)
    if (isNaN(inputAmount) || inputAmount <= 0) {
      setEstimatedOutput(0)
      return
    }

    if (tradeType === 'buy') {
      const afterTax = inputAmount * (1 - token.salesTax / 100)
      const tokensOut = estimateBuyTokens(token.price, afterTax)
      setEstimatedOutput(tokensOut)
    } else {
      const solOut = estimateSellReturn(token.price, inputAmount)
      const afterTax = solOut * (1 - token.salesTax / 100)
      setEstimatedOutput(afterTax)
    }
  }, [amount, token, tradeType])

  // Fetch user's token balance when wallet or token changes
  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (!publicKey || !token) {
        setUserTokenBalance(null)
        return
      }
      try {
        const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          { programId: TOKEN_PROGRAM_ID }
        )
        let found = false
        for (const { account } of tokenAccounts.value) {
          const parsedInfo = account.data.parsed.info
          if (parsedInfo.mint === token.mint) {
            setUserTokenBalance(parsedInfo.tokenAmount.uiAmount)
            found = true
            break
          }
        }
        if (!found) setUserTokenBalance(0)
      } catch (err) {
        setUserTokenBalance(null)
      }
    }
    fetchTokenBalance()
  }, [publicKey, token])

  // Fetch user's SOL balance when wallet changes
  useEffect(() => {
    const fetchSolBalance = async () => {
      if (!publicKey) {
        setUserSolBalance(null)
        return
      }
      try {
        const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')
        const balanceLamports = await connection.getBalance(publicKey)
        setUserSolBalance(balanceLamports / LAMPORTS_PER_SOL)
      } catch (err) {
        setUserSolBalance(null)
      }
    }
    fetchSolBalance()
  }, [publicKey])

  const showNotification = (message: string, type: 'success' | 'error') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  const handleTrade = async () => {
    if (!publicKey) {
      setVisible(true)
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      showNotification('Please enter a valid amount', 'error')
      return
    }

    setIsTrading(true)

    try {
      const inputAmount = parseFloat(amount)
      
      // Call the appropriate API endpoint
      const endpoint = tradeType === 'buy'
        ? `/api/tokens/${mint}/buy`
        : `/api/tokens/${mint}/sell`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: inputAmount,
          slippage: slippage * 100, // Convert to basis points
          [tradeType === 'buy' ? 'buyer' : 'seller']: publicKey.toBase58()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Transaction failed')
      }

      const data = await response.json()
      
      // Sign and send the transaction
      if (data.transaction) {
        // Create connection
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
          throw new Error('Failed to connect to Solana network')
        }
        
        const transaction = Transaction.from(Buffer.from(data.transaction, 'base64'))
        
        // Sign the transaction
        const signedTx = await (window as any).solana.signTransaction(transaction)
        
        // Send the transaction
        const signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: true,
          preflightCommitment: 'confirmed',
          maxRetries: 5
        })
        
        console.log('Transaction sent:', signature)
        
        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(signature, 'confirmed')
        
        if (confirmation.value.err) {
          throw new Error('Transaction failed')
        }
        
        // Show success message
        if (tradeType === 'buy') {
          showNotification(
            `Bought ${data.estimatedTokens?.toFixed(2) || estimatedOutput.toFixed(2)} ${token.symbol}! Fee: ${data.platformFee?.toFixed(4) || '0'} SOL`,
            'success'
          )
        } else {
          showNotification(
            `Sold ${amount} ${token.symbol} for ${data.estimatedSol?.toFixed(4) || estimatedOutput.toFixed(4)} SOL! Fee: ${data.platformFee?.toFixed(4) || '0'} SOL`,
            'success'
          )
        }
        
        // Open transaction on Solscan
        window.open(`https://solscan.io/tx/${signature}`, '_blank')
      }

      // Reset form
      setAmount('')
      
      // Refresh token data
      const updatedToken = getPlatformToken(mint)
      if (updatedToken) {
        setToken(updatedToken)
      }
    } catch (error: any) {
      console.error('Trade error:', error)
      showNotification(error.message || 'Trade failed. Please try again.', 'error')
    } finally {
      setIsTrading(false)
    }
  }

  // Create a loading state while fetching token
  useEffect(() => {
    if (!token) {
      // If no token found, create a temporary token for display
      const tempToken = {
        mint: mint,
        name: 'Loading...',
        symbol: '...',
        price: 0.000001,
        priceChange24h: 0,
        marketCap: 1000,
        volume24h: 0,
        holders: 1,
        imageUrl: '',
        bondingCurveProgress: 0,
        description: 'Token data is loading. If this is a new token, data will be available shortly.',
        creator: '',
        createdAt: new Date().toISOString(),
        totalSupply: 1000000000,
        decimals: 9,
        salesTax: 3
      }
      setToken(tempToken)
    }
  }, [mint, token])

  if (!token) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-yellow-900/20 to-black">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading token data...</p>
          </div>
        </div>
      </main>
    )
  }

  const priceChangeColor = token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
  const priceChangeIcon = token.priceChange24h >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />

  return (
    <Toast.Provider swipeDirection="right">
      <main className="min-h-screen bg-gradient-to-br from-black via-yellow-900/20 to-black">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <Header />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Token Info */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    {token.imageUrl && (
                      <img
                        src={token.imageUrl}
                        alt={token.symbol}
                        className="w-16 h-16 rounded-full"
                      />
                    )}
                    <div>
                      <h1 className="text-3xl font-bold text-white">{token.name}</h1>
                      <p className="text-xl text-gray-400">${token.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">${(token.price * solPrice).toFixed(6)}</p>
                    <p className="text-lg text-gray-400">{token.price.toFixed(8)} SOL</p>
                    <div className={`flex items-center gap-1 justify-end mt-2 ${priceChangeColor}`}>
                      {priceChangeIcon}
                      <span className="font-medium">{Math.abs(token.priceChange24h).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                {/* Creator Info */}
                <div className="mb-6 p-4 bg-gray-700/30 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Created by</span>
                    <Link
                      href={`/portfolio/${token.creator}`}
                      className="text-yellow-400 hover:text-yellow-300 transition-colors font-mono text-sm"
                    >
                      {token.creator ? `${token.creator.slice(0, 4)}...${token.creator.slice(-4)}` : 'Unknown'}
                    </Link>
                  </div>
                  {token.createdAt && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-400">Created</span>
                      <span className="text-sm text-gray-300">
                        {new Date(token.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-700/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">Market Cap</span>
                    </div>
                    <p className="text-xl font-bold text-white">${(token.marketCap * solPrice).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-700/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Activity className="w-4 h-4" />
                      <span className="text-sm">24h Volume</span>
                    </div>
                    <p className="text-xl font-bold text-white">${(token.volume24h * solPrice).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-700/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Holders</span>
                    </div>
                    <p className="text-xl font-bold text-white">{token.holders.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-700/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">Total Supply</span>
                    </div>
                    <p className="text-xl font-bold text-white">{token.totalSupply.toLocaleString()}</p>
                  </div>
                </div>

                {/* Description */}
                {token.description && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-white mb-2">About</h3>
                    <p className="text-gray-400">{token.description}</p>
                  </div>
                )}

                {/* Bonding Curve Progress */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Bonding Curve Progress</span>
                    <span className="text-sm text-white">{token.bondingCurveProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-yellow-600 to-yellow-400 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${token.bondingCurveProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Raydium listing at 69k market cap
                  </p>
                </div>

                {/* Raydium Chart */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Price Chart</h3>
                  <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
                    {token.bondingCurveProgress >= 100 ? (
                      // Token has graduated to Raydium - show Raydium chart
                      <div className="relative w-full h-[400px]">
                        <iframe
                          src={`https://dexscreener.com/solana/${mint}?embed=1&theme=dark&trades=0&info=0`}
                          className="w-full h-full rounded-lg"
                          frameBorder="0"
                          allowFullScreen
                        />
                        <div className="absolute bottom-2 right-2">
                          <a
                            href={`https://raydium.io/swap/?inputCurrency=sol&outputCurrency=${mint}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                          >
                            Trade on Raydium →
                          </a>
                        </div>
                      </div>
                    ) : (
                      // Token is still in bonding curve - show simple price chart
                      <div className="flex items-center justify-center h-[400px] text-gray-500">
                        <div className="text-center">
                          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-sm">Price chart will be available after Raydium listing</p>
                          <p className="text-xs mt-2">Current progress: {token.bondingCurveProgress}% to graduation</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-4 text-sm">
                    <a
                      href={`https://solscan.io/token/${mint}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-yellow-400 hover:text-yellow-300 transition-colors"
                    >
                      View on Solscan →
                    </a>
                    {token.bondingCurveProgress >= 100 && (
                      <a
                        href={`https://dexscreener.com/solana/${mint}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-yellow-400 hover:text-yellow-300 transition-colors"
                      >
                        View on DexScreener →
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Trade History */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mt-8"
              >
                <h3 className="text-lg font-semibold text-white mb-4">Recent Trades</h3>
                <div className="space-y-3">
                  {/* Mock trade history - in production this would come from blockchain events */}
                  {[
                    { type: 'buy', wallet: '8xKp...3nFa', amount: 1250000, price: 0.00045, time: '2 min ago', txn: 'abc123' },
                    { type: 'sell', wallet: '4mNx...9kLp', amount: 500000, price: 0.00044, time: '5 min ago', txn: 'def456' },
                    { type: 'buy', wallet: '7pQr...2mXs', amount: 2000000, price: 0.00043, time: '12 min ago', txn: 'ghi789' },
                    { type: 'buy', wallet: '3tAQ...gewi', amount: 750000, price: 0.00042, time: '18 min ago', txn: 'jkl012' },
                    { type: 'sell', wallet: '9vLm...8nKj', amount: 300000, price: 0.00041, time: '25 min ago', txn: 'mno345' },
                  ].map((trade, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          trade.type === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                          {trade.type === 'buy' ? (
                            <ArrowUpRight className="w-4 h-4 text-green-400" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/portfolio/${trade.wallet}`}
                              className="text-yellow-400 hover:text-yellow-300 transition-colors font-mono text-sm"
                            >
                              {trade.wallet}
                            </Link>
                            <span className={`text-xs font-medium ${
                              trade.type === 'buy' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {trade.type === 'buy' ? 'bought' : 'sold'}
                            </span>
                            <span className="text-white font-medium">
                              {(trade.amount / 1000000).toFixed(2)}M
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{trade.time}</span>
                            <span>•</span>
                            <span>{trade.price.toFixed(8)} SOL</span>
                            <span>•</span>
                            <a
                              href={`https://solscan.io/tx/${trade.txn}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-yellow-400 hover:text-yellow-300"
                            >
                              View TX
                            </a>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white font-medium">
                          ${((trade.amount / 1000000) * trade.price * solPrice).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    Trade history updates in real-time • Click any wallet to view their portfolio
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Trading Panel */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 sticky top-24"
              >
                <h2 className="text-xl font-bold text-white mb-6">Trade {token.symbol}</h2>

                {/* Trade Type Selector */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setTradeType('buy')}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      tradeType === 'buy'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setTradeType('sell')}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      tradeType === 'sell'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Sell
                  </button>
                </div>

                {/* Input */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">
                    {tradeType === 'buy' ? 'SOL Amount' : `${token.symbol} Amount`}
                  </label>
                  {tradeType === 'buy' && (
                    <div className="mb-2">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>SOL Balance:</span>
                        <span className="text-white font-mono">{userSolBalance !== null ? userSolBalance.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '—'}</span>
                        <button
                          type="button"
                          className="ml-4 px-2 py-1 bg-gray-700 rounded text-xs hover:bg-yellow-600/30"
                          onClick={() => userSolBalance !== null && setAmount((userSolBalance * 0.25).toFixed(4))}
                        >25%</button>
                        <button
                          type="button"
                          className="px-2 py-1 bg-gray-700 rounded text-xs hover:bg-yellow-600/30"
                          onClick={() => userSolBalance !== null && setAmount((userSolBalance * 0.5).toFixed(4))}
                        >50%</button>
                        <button
                          type="button"
                          className="px-2 py-1 bg-gray-700 rounded text-xs hover:bg-yellow-600/30"
                          onClick={() => userSolBalance !== null && setAmount(userSolBalance.toFixed(4))}
                        >100%</button>
                      </div>
                    </div>
                  )}
                  {tradeType === 'sell' && (
                    <div className="mb-2">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>{token.symbol} Balance:</span>
                        <span className="text-white font-mono">{userTokenBalance !== null ? userTokenBalance.toLocaleString(undefined, { maximumFractionDigits: token?.decimals || 9 }) : '—'}</span>
                        <button
                          type="button"
                          className="ml-4 px-2 py-1 bg-gray-700 rounded text-xs hover:bg-yellow-600/30"
                          onClick={() => userTokenBalance !== null && setAmount((userTokenBalance * 0.25).toFixed(token?.decimals || 9))}
                        >25%</button>
                        <button
                          type="button"
                          className="px-2 py-1 bg-gray-700 rounded text-xs hover:bg-yellow-600/30"
                          onClick={() => userTokenBalance !== null && setAmount((userTokenBalance * 0.5).toFixed(token?.decimals || 9))}
                        >50%</button>
                        <button
                          type="button"
                          className="px-2 py-1 bg-gray-700 rounded text-xs hover:bg-yellow-600/30"
                          onClick={() => userTokenBalance !== null && setAmount(userTokenBalance.toFixed(token?.decimals || 9))}
                        >100%</button>
                      </div>
                    </div>
                  )}
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                  />
                </div>

                {/* Output */}
                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-2">
                    You will receive (estimated)
                  </label>
                  <div className="px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl">
                    <p className="text-xl font-bold text-white">
                      {estimatedOutput.toFixed(tradeType === 'buy' ? 2 : 6)} {tradeType === 'buy' ? token.symbol : 'SOL'}
                    </p>
                    <p className="text-sm text-gray-400">
                      ≈ ${((estimatedOutput * (tradeType === 'buy' ? token.price : 1)) * solPrice).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Trade Button */}
                <motion.button
                  onClick={handleTrade}
                  disabled={isTrading || !publicKey || !amount}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                    tradeType === 'buy'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-green-500/25'
                      : 'bg-gradient-to-r from-red-500 to-pink-500 hover:shadow-red-500/25'
                  } text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isTrading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : !publicKey ? (
                    'Connect Wallet'
                  ) : (
                    `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${token.symbol}`
                  )}
                </motion.button>

                {/* Info */}
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-xs text-blue-400">
                    Platform fee: {token.salesTax}% (deducted in SOL)
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Toast Notifications */}
        <Toast.Root
          className={`${
            toastType === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white p-4 rounded-xl shadow-lg`}
          open={showToast}
          onOpenChange={setShowToast}
        >
          <Toast.Title className="font-semibold">{toastMessage}</Toast.Title>
        </Toast.Root>
        <Toast.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 w-96 max-w-[100vw] z-50" />
      </main>
    </Toast.Provider>
  )
}
