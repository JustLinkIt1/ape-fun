'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/Header'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import * as Toast from '@radix-ui/react-toast'
import { Upload, X } from 'lucide-react'

export default function CreateToken() {
  const { publicKey, signTransaction } = useWallet()
  const { setVisible } = useWalletModal()
  
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    description: '',
    totalSupply: 1000000000,
    decimals: 9,
    initialBuy: 0
  })
  
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    setFormData(prev => ({
      ...prev,
      [name]: ['totalSupply', 'decimals', 'initialBuy'].includes(name) ? Number(value) : value
    }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        showNotification('Image size must be less than 2MB', 'error')
        return
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showNotification('Please upload an image file', 'error')
        return
      }
      
      setImageFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview('')
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    setToastMessage(message)
    setToastType(type)
    setShowToast(true)
  }

  const handleCreateToken = async () => {
    if (!publicKey) {
      setVisible(true)
      return
    }

    if (!formData.name || !formData.symbol) {
      showNotification('Please fill in all required fields', 'error')
      return
    }

    setIsCreating(true)

    try {
      let imageUrl = ''
      
      // Upload image if provided
      if (imageFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', imageFile)
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        })
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image')
        }
        
        const uploadData = await uploadResponse.json()
        imageUrl = uploadData.url
      }
      
      // Call the backend API to create the token
      const response = await fetch('/api/tokens/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          imageUrl,
          creator: publicKey.toBase58()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create token')
      }

      const data = await response.json()
      
      // Sign and send the transaction
      if (data.transaction && signTransaction) {
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
          throw new Error('Failed to connect to Solana network. Please try again.')
        }
        
        const transaction = Transaction.from(Buffer.from(data.transaction, 'base64'))
        
        // Get the blockhash from the transaction (it was set by the API)
        const blockhash = transaction.recentBlockhash
        
        // Sign the transaction
        const signedTx = await signTransaction(transaction)
        
        // Send the raw transaction with proper options
        console.log('Sending transaction...')
        const signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: true, // Skip preflight to avoid simulation errors
          preflightCommitment: 'confirmed',
          maxRetries: 5
        })
        
        console.log('Transaction sent! Signature:', signature)
        console.log('View on Solscan: https://solscan.io/tx/' + signature)
        
        // Wait for confirmation with timeout handling
        let confirmed = false
        const maxAttempts = 60 // 60 seconds total
        
        for (let i = 0; i < maxAttempts; i++) {
          try {
            const status = await connection.getSignatureStatus(signature)
            console.log(`Attempt ${i + 1}: Status =`, status.value?.confirmationStatus)
            
            if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
              confirmed = true
              console.log('Transaction confirmed!')
              break
            }
            
            if (status.value?.err) {
              throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`)
            }
            
            // Wait 1 second before next check
            await new Promise(resolve => setTimeout(resolve, 1000))
          } catch (error) {
            console.error('Error checking status:', error)
            // Continue checking
          }
        }
        
        if (!confirmed) {
          console.warn('Transaction confirmation timeout - please check Solscan')
          showNotification('Transaction sent but confirmation timed out. Check Solscan for status.', 'error')
        }
        
        const mintAddress = data.mint

        showNotification(
          `Token launched successfully! Mint: ${mintAddress.slice(0, 8)}...`,
          'success'
        )
        
        // Open token page in new tab
        window.open(`/token/${mintAddress}`, '_blank')
        
        // Also open Solscan transaction
        window.open(`https://solscan.io/tx/${signature}`, '_blank')
        
        // Reset form
        setFormData({
          name: '',
          symbol: '',
          description: '',
          totalSupply: 1000000000,
          decimals: 9
        })
        removeImage()
      }
    } catch (error: any) {
      console.error('Error creating token:', error)
      
      // Provide more specific error messages
      let errorMessage = 'Failed to create token. '
      
      if (error.message?.includes('insufficient funds')) {
        errorMessage += 'Insufficient SOL balance for transaction fees.'
      } else if (error.message?.includes('User rejected')) {
        errorMessage += 'Transaction was cancelled.'
      } else if (error.message?.includes('blockhash not found')) {
        errorMessage += 'Network congestion detected. Please try again.'
      } else if (error.message) {
        errorMessage += error.message
      } else {
        errorMessage += 'Please try again.'
      }
      
      showNotification(errorMessage, 'error')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Toast.Provider swipeDirection="right">
      <main className="min-h-screen bg-gradient-to-br from-black via-yellow-900/20 to-black">
        {/* Animated Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <Header />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">
              Launch Your <span className="bg-gradient-to-r from-yellow-500 to-white bg-clip-text text-transparent">Memecoin</span>
            </h1>
            <p className="text-xl text-gray-400">Create and launch your token on Solana in seconds</p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700"
          >
            <form onSubmit={(e) => { e.preventDefault(); handleCreateToken(); }} className="space-y-6">
              {/* Token Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Doge Killer"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                  required
                />
              </div>

              {/* Token Symbol */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Symbol *
                </label>
                <input
                  type="text"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  placeholder="DOGEKILL"
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                  required
                  maxLength={10}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="The ultimate memecoin that will flip Doge..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Image
                </label>
                {!imagePreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-xl cursor-pointer bg-gray-900/50 hover:bg-gray-900/70 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 2MB</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Token preview"
                      className="w-32 h-32 object-cover rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                )}
              </div>

              {/* Total Supply */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Total Supply
                </label>
                <input
                  type="number"
                  name="totalSupply"
                  value={formData.totalSupply}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                  min="1"
                />
              </div>

              {/* Buy initial amount */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Buy initial amount (SOL)
                </label>
                <input
                  type="number"
                  name="initialBuy"
                  value={formData.initialBuy}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                  min="0"
                />
              </div>


              {/* Fee Notice */}
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <p className="text-sm text-yellow-400">
                  <strong>Launch Fee:</strong> FREE (Testing Mode)
                </p>
                <p className="text-sm text-yellow-400 mt-2">
                  <strong>Platform Allocation:</strong> 3% of total supply
                </p>
                <p className="text-sm text-yellow-400 mt-2">
                  <strong>Bonding:</strong> Automatic Raydium listing at 69k market cap
                </p>
                <p className="text-xs text-yellow-400/80 mt-2">
                  Platform allocation supports development and liquidity provision
                </p>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isCreating || !publicKey}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-400 text-black rounded-xl font-bold text-lg shadow-lg hover:shadow-yellow-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {'Creating Token...'}
                  </span>
                ) : !publicKey ? (
                  'Connect Wallet to Continue'
                ) : (
                  'Launch Token 🚀'
                )}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>

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