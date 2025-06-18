'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Header } from '@/components/Header'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getPlatformToken, updateTokenPrice } from '@/lib/tokenRegistry'
import { calculateTokensForSol, calculateSolForTokens, DEFAULT_SOL_RESERVE } from '@/lib/bondingCurve'
import * as Toast from '@radix-ui/react-toast'
import { ArrowUpRight, ArrowDownRight, TrendingUp, Users, DollarSign, Activity } from 'lucide-react'

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

  // Fetch token data
  useEffect(() => {
    // First check platform tokens
    const tokenData = getPlatformToken(mint)
    if (tokenData) {
      setToken(tokenData)
    } else {
      // Check mock tokens as fallback
      const mockToken = mockTokens.find(t => t.mint === mint)
      if (mockToken) {
        setToken(mockToken)
      }
    }
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

  // Calculate estimated output based on bonding curve
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

    const tokenReserve = token.totalSupply
    const solReserve = DEFAULT_SOL_RESERVE

    if (tradeType === 'buy') {
      const tokensOut = calculateTokensForSol(inputAmount, tokenReserve, solReserve)
      setEstimatedOutput(tokensOut)
    } else {
      const solOut = calculateSolForTokens(inputAmount, tokenReserve, solReserve)
      setEstimatedOutput(solOut)
    }
  }, [amount, token, tradeType])

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
      // In production, this would create actual swap transactions
      // For now, we'll simulate the trade
      const inputAmount = parseFloat(amount)
      
      if (tradeType === 'buy') {
        // Simulate buying tokens
        const newPrice = token.price * 1.01 // Price goes up on buy
        
        // Only update price for platform tokens
        const isPlatformToken = getPlatformToken(mint) !== null
        if (isPlatformToken) {
          updateTokenPrice(mint, newPrice, inputAmount)
        }
        
        showNotification(`Bought ${estimatedOutput.toFixed(2)} ${token.symbol}!`, 'success')
      } else {
        // Simulate selling tokens
        const newPrice = token.price * 0.99 // Price goes down on sell
        
        // Only update price for platform tokens
        const isPlatformToken = getPlatformToken(mint) !== null
        if (isPlatformToken) {
          updateTokenPrice(mint, newPrice, inputAmount * token.price)
        }
        
        showNotification(`Sold ${amount} ${token.symbol} for ${estimatedOutput.toFixed(4)} SOL!`, 'success')
      }

      // Reset form
      setAmount('')
      
      // Refresh token data
      const updatedToken = getPlatformToken(mint)
      if (updatedToken) {
        setToken(updatedToken)
      } else {
        // For mock tokens, simulate price change
        const mockToken = mockTokens.find(t => t.mint === mint)
        if (mockToken) {
          mockToken.price = tradeType === 'buy' ? mockToken.price * 1.01 : mockToken.price * 0.99
          setToken({...mockToken})
        }
      }
    } catch (error) {
      console.error('Trade error:', error)
      showNotification('Trade failed. Please try again.', 'error')
    } finally {
      setIsTrading(false)
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-yellow-900/20 to-black">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <p className="text-gray-400">Token not found</p>
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
                <div>
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
                  <input
                    type="number"
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
                    Platform fee: {token.salesTax}% (included in price)
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
