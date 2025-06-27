import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createSyncNativeInstruction,
  NATIVE_MINT
} from '@solana/spl-token'
import { updateTokenPrice } from '@/lib/tokenRegistry'
import { getServerToken } from '@/lib/serverTokenRegistry'
import {
  getInitialBondingCurveState,
  estimateBuyTokensWithState,
  applyBuy,
  getCurrentPrice
} from '@/lib/bondingCurve'
import { logTrade } from '@/lib/tradeRegistry'

// Platform configuration
const PLATFORM_CONFIG = {
  taxWallet: process.env.NEXT_PUBLIC_PLATFORM_WALLET || '3tAQBPnSxMZ7CAvgib29hWFiebRFqupEHLZQENSogewi',
  salesTax: 3, // 3% sales tax
  bondingTarget: 69000, // Bond to Raydium at 69k market cap
}

// Raydium AMM Program (for future integration)
const RAYDIUM_AMM_PROGRAM = new PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8")

export async function POST(request: NextRequest, context: any) {
  const { params } = context as { params: { mint: string } }
  
  try {
    const body = await request.json()
    const { amount, slippage = 100, buyer } = body // amount in SOL, slippage in bps (100 = 1%)
    
    if (!amount || !buyer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Get token info from server registry
    const token = getServerToken(params.mint)
    if (!token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      )
    }
    
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
    
    const mintPubkey = new PublicKey(params.mint)
    const buyerPubkey = new PublicKey(buyer)
    const platformWallet = new PublicKey(PLATFORM_CONFIG.taxWallet)
    
    // Calculate buy amounts using bonding curve
    const bondingState = getInitialBondingCurveState(token.totalSupply * Math.pow(10, token.decimals))
    
    // Apply any previous trades to the state (in production, this would come from a database)
    // For now, we'll use the current price to estimate the state
    if (token.price > 0.000001) {
      const priceRatio = token.price / 0.000001
      bondingState.solReserve = bondingState.solReserve * priceRatio
    }
    
    const solAmountLamports = amount * LAMPORTS_PER_SOL
    const platformFee = Math.floor(solAmountLamports * PLATFORM_CONFIG.salesTax / 100)
    const solAfterFee = solAmountLamports - platformFee
    
    const buyResult = estimateBuyTokensWithState(bondingState, solAfterFee, slippage)
    
    if (buyResult.tokensOut === 0) {
      return NextResponse.json(
        { error: 'Insufficient liquidity' },
        { status: 400 }
      )
    }
    
    // Create transaction
    const transaction = new Transaction()
    
    // Get buyer's token account
    const buyerTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      buyerPubkey
    )
    
    // Check if buyer's token account exists
    const buyerTokenAccountInfo = await connection.getAccountInfo(buyerTokenAccount)
    if (!buyerTokenAccountInfo) {
      // Create associated token account for buyer
      transaction.add(
        createAssociatedTokenAccountInstruction(
          buyerPubkey,
          buyerTokenAccount,
          buyerPubkey,
          mintPubkey
        )
      )
    }
    
    // Transfer SOL to platform (for fees)
    if (platformFee > 0) {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: buyerPubkey,
          toPubkey: platformWallet,
          lamports: platformFee
        })
      )
    }
    
    // In a real implementation, this would:
    // 1. Transfer SOL to the bonding curve pool
    // 2. Transfer tokens from the pool to the buyer
    // 3. Update the bonding curve state
    
    // For now, we'll create a simple transfer instruction as a placeholder
    // In production, this would interact with a program that manages the bonding curve
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: buyerPubkey,
        toPubkey: platformWallet, // Placeholder - would be pool address
        lamports: solAfterFee
      })
    )
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = buyerPubkey
    
    // Update token price in registry (in production, this would be done after confirmation)
    const newState = applyBuy(bondingState, solAfterFee, buyResult.tokensOut)
    const newPrice = getCurrentPrice(newState)
    updateTokenPrice(params.mint, newPrice, solAmountLamports / LAMPORTS_PER_SOL)
    
    // Log the trade
    logTrade({
      mint: params.mint,
      type: 'buy',
      user: buyer,
      amount: amount, // in SOL
      tokens: buyResult.tokensOut / Math.pow(10, token.decimals),
      price: buyResult.finalPrice,
      timestamp: Date.now()
    })
    
    // Return transaction for user to sign
    return NextResponse.json({
      success: true,
      transaction: transaction.serialize({ requireAllSignatures: false }).toString('base64'),
      estimatedTokens: buyResult.tokensOut / Math.pow(10, token.decimals),
      priceImpact: buyResult.priceImpact,
      finalPrice: buyResult.finalPrice,
      platformFee: platformFee / LAMPORTS_PER_SOL,
      message: `Buying ~${(buyResult.tokensOut / Math.pow(10, token.decimals)).toFixed(2)} ${token.symbol} for ${amount} SOL`
    })
    
  } catch (error: any) {
    console.error('Buy API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create buy transaction' },
      { status: 500 }
    )
  }
}
