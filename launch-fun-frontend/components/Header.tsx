'use client'

import { FC } from 'react'
import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { motion } from 'framer-motion'

export const Header: FC = () => {
  const { publicKey, disconnect } = useWallet()
  const { setVisible } = useWalletModal()

  const handleWalletClick = () => {
    if (publicKey) {
      disconnect()
    } else {
      setVisible(true)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="relative backdrop-blur-xl bg-gray-900/50 border-b border-gray-800 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/">
            <motion.div
              className="flex items-center cursor-pointer"
              whileHover={{ scale: 1.05 }}
            >
              <img
                src="/launchlogo.png"
                alt="Ape Fun Logo"
                className="w-20 h-20 mr-3"
              />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-500 via-yellow-400 to-white bg-clip-text text-transparent">
                Ape Fun
              </h1>
              <span className="ml-2 px-2 py-1 text-xs bg-gradient-to-r from-yellow-600 to-yellow-400 text-black rounded-full">
                BETA
              </span>
            </motion.div>
          </Link>

          <nav className="flex items-center space-x-4">
            {/* Additional nav items */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Docs
            </motion.button>
            <motion.a
              href="/portfolio"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Portfolio
            </motion.a>
            <motion.a
              href="/create"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gradient-to-r from-yellow-600/20 to-yellow-400/20 border border-yellow-500/50 text-yellow-400 rounded-xl font-medium hover:border-yellow-400 transition-all"
            >
              🚀 Create Token
            </motion.a>

            {/* Wallet Button */}
            <motion.button 
              onClick={handleWalletClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-xl font-medium shadow-lg transition-all duration-200 ${
                publicKey 
                  ? 'bg-gray-800 text-white hover:bg-gray-700'
                  : 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black hover:shadow-yellow-500/25'
              }`}
            >
              {publicKey ? formatAddress(publicKey.toBase58()) : 'Connect Wallet'}
            </motion.button>
          </nav>
        </div>
      </div>
    </motion.header>
  )
}