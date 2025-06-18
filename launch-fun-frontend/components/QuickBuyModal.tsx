'use client'

import { FC, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import { Token } from '@/types'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Connection, Transaction } from '@solana/web3.js'

interface QuickBuyModalProps {
  token: Token | null
  isOpen: boolean
  onClose: () => void
}

export const QuickBuyModal: FC<QuickBuyModalProps> = ({ token, isOpen, onClose }) => {
  const { publicKey, signTransaction } = useWallet()
  const { setVisible } = useWalletModal()
  const [amount, setAmount] = useState(50)
  const [slippage, setSlippage] = useState(0.5)
  const [isLoading, setIsLoading] = useState(false)

  const presetAmounts = [10, 25, 50, 100, 250, 500]
  const presetSlippages = [0.1, 0.5, 1.0, 5.0]

  const handleBuy = async () => {
    if (!publicKey) {
      setVisible(true)
      return
    }

    if (!token) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/tokens/${token.mint}/buy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          slippage,
          buyer: publicKey.toBase58()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create buy transaction')
      }

      const data = await response.json()

      if (data.transaction && signTransaction) {
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
          } catch (err) {
            console.error(`Failed to connect to ${endpoint}:`, err)
          }
        }

        if (!connection) {
          throw new Error('Failed to connect to Solana network.')
        }

        const transaction = Transaction.from(Buffer.from(data.transaction, 'base64'))
        const signedTx = await signTransaction(transaction)
        const signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: true,
          preflightCommitment: 'confirmed',
          maxRetries: 5
        })

        console.log('Transaction sent! Signature:', signature)

        let confirmed = false

        for (let i = 0; i < 60; i++) {
          const status = await connection.getSignatureStatus(signature)

          if (
            status.value?.confirmationStatus === 'confirmed' ||
            status.value?.confirmationStatus === 'finalized'
          ) {
            confirmed = true
            console.log('Transaction confirmed!')
            break
          }

          if (status.value?.err) {
            throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`)
          }

          await new Promise((res) => setTimeout(res, 1000))
        }

        if (!confirmed) {
          console.warn('Transaction confirmation timeout - please check Solscan')
        }
      }

      onClose()
    } catch (error) {
      console.error('Buy error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) return null

  const afterTax = amount * (1 - token.salesTax / 100)
  const estimatedTokens = afterTax / token.price
  const totalWithSlippage = amount * (1 + slippage / 100)

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-gray-900 rounded-2xl p-6 shadow-2xl z-50 border border-gray-800"
              >
                <Dialog.Title className="text-2xl font-bold text-white mb-6">
                  Quick Buy {token.symbol}
                </Dialog.Title>

                {/* Token Info */}
                <div className="flex items-center mb-6 p-4 bg-gray-800/50 rounded-xl">
                  <img 
                    src={token.imageUrl} 
                    alt={token.symbol}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{token.name}</h3>
                    <p className="text-sm text-gray-400">${token.price.toFixed(6)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Market Cap</p>
                    <p className="font-semibold text-white">${(token.marketCap / 1000000).toFixed(2)}M</p>
                  </div>
                </div>

                {/* Amount Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Amount (SOL)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-yellow-500 transition-colors"
                      placeholder="0.00"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      SOL
                    </span>
                  </div>
                  <div className="grid grid-cols-6 gap-2 mt-3">
                    {presetAmounts.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setAmount(preset)}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${
                          amount === preset
                            ? 'bg-yellow-500 text-black'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slippage */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Slippage Tolerance
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {presetSlippages.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setSlippage(preset)}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${
                          slippage === preset
                            ? 'bg-yellow-500 text-black'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-2 mb-6 p-4 bg-gray-800/50 rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">You pay</span>
                    <span className="text-white font-medium">{amount} SOL</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">You receive (est.)</span>
                    <span className="text-white font-medium">
                      {estimatedTokens.toLocaleString()} {token.symbol}
                    </span>
                  </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Max total</span>
                  <span className="text-white font-medium">{totalWithSlippage.toFixed(2)} SOL</span>
                </div>
                <p className="text-xs text-blue-400 mt-2">
                  Platform fee: {token.salesTax}% (deducted in SOL)
                </p>
              </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    onClick={handleBuy}
                    disabled={isLoading || amount <= 0}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 py-3 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black rounded-xl font-medium shadow-lg hover:shadow-yellow-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </span>
                    ) : publicKey ? (
                      'Confirm Buy'
                    ) : (
                      'Connect Wallet'
                    )}
                  </motion.button>
                </div>

                <Dialog.Close asChild>
                  <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    aria-label="Close"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </Dialog.Close>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
