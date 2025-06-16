'use client'

import { FC } from 'react'
import { motion } from 'framer-motion'
import { Token } from '@/types'
import Link from 'next/link'

interface TokenCardProps {
  token: Token
  index: number
  onQuickBuy: (token: Token) => void
}

export const TokenCard: FC<TokenCardProps> = ({ token, index, onQuickBuy }) => {
  const formatPrice = (price: number) => {
    if (price < 0.00001) return price.toExponential(2)
    if (price < 1) return price.toFixed(6)
    return price.toFixed(2)
  }

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1000000) return `$${(marketCap / 1000000).toFixed(1)}M`
    if (marketCap >= 1000) return `$${(marketCap / 1000).toFixed(1)}K`
    return `$${marketCap.toFixed(0)}`
  }

  return (
    <Link href={`/token/${token.address}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -5, scale: 1.02 }}
        className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 hover:border-purple-500/50 transition-all duration-300 cursor-pointer overflow-hidden h-full"
      >
        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="relative z-10">
        <div className="flex items-center mb-4">
          <div className="relative">
            <img 
              src={token.imageUrl || '/placeholder.png'} 
              alt={token.symbol}
              className="w-14 h-14 rounded-full object-cover"
            />
            {token.bondingCurveProgress && token.bondingCurveProgress >= 90 && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
                <span className="text-xs">🔥</span>
              </div>
            )}
          </div>
          <div className="ml-4 flex-1">
            <h3 className="font-bold text-white">{token.symbol}</h3>
            <p className="text-sm text-gray-400 truncate">{token.name}</p>
          </div>
        </div>

        {/* Mini Chart */}
        <div className="h-20 bg-gray-900/50 rounded-lg mb-4 flex items-end px-2 py-1">
          {[...Array(10)].map((_, j) => (
            <div
              key={j}
              className="flex-1 mx-0.5 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t transition-all duration-300"
              style={{ 
                height: `${Math.random() * 100}%`,
                opacity: 0.6 + (j / 10) * 0.4
              }}
            ></div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Price</span>
            <span className="font-mono text-white">${formatPrice(token.price)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">24h</span>
            <span className={`font-medium ${token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Market Cap</span>
            <span className="font-mono text-white">{formatMarketCap(token.marketCap)}</span>
          </div>
          
          {/* Progress Bar */}
          {token.bondingCurveProgress !== undefined && (
            <div className="pt-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Bonding Curve</span>
                <span>{token.bondingCurveProgress}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${token.bondingCurveProgress}%` }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                ></motion.div>
              </div>
            </div>
          )}
        </div>

        <motion.button 
          onClick={(e) => {
            e.stopPropagation()
            onQuickBuy(token)
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full mt-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
        >
          Quick Buy
        </motion.button>
      </div>
    </motion.div>
    </Link>
  )
}