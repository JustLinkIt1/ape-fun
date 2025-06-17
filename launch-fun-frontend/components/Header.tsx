'use client'

import { FC, useState } from 'react'
import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { motion } from 'framer-motion'

export const Header: FC = () => {
  const { publicKey, disconnect } = useWallet()
  const { setVisible } = useWalletModal()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleWalletClick = () => {
    if (publicKey) {
      setMenuOpen((prev) => !prev)
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
        <div className="flex flex-col sm:flex-row sm:justify-between items-center h-auto sm:h-20 space-y-2 sm:space-y-0">
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
              <span className="ml-2 px-2 py-1 text-xs bg-gradient-to-r from-yellow-600 to-yellow-400 text-black rounded-full">
                BETA
              </span>
            </motion.div>
          </Link>

          <nav className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 relative">
            <motion.a
              href="/create"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-yellow-600/20 to-yellow-400/20 border border-yellow-500/50 text-yellow-400 rounded-xl font-medium hover:border-yellow-400 transition-all"
            >
              🚀 Create Token
            </motion.a>

            {/* Wallet Button */}
            <div className="relative">
              <motion.button
                onClick={handleWalletClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-medium shadow-lg transition-all duration-200 ${
                  publicKey
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
                    : 'bg-gradient-to-r from-yellow-600 to-yellow-400 text-black hover:shadow-yellow-500/25'
                }`}
              >
                {publicKey ? formatAddress(publicKey.toBase58()) : 'Connect Wallet'}
              </motion.button>
              {menuOpen && publicKey && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden z-50"
                >
                  <Link
                    href="/portfolio"
                    className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                    onClick={() => setMenuOpen(false)}
                  >
                    Portfolio
                  </Link>
                  <button
                    onClick={() => {
                      disconnect()
                      setMenuOpen(false)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700"
                  >
                    Disconnect
                  </button>
                </motion.div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </motion.header>
  )
}
