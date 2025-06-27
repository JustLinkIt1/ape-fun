import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createTransferInstruction
} from '@solana/spl-token'
import { updateTokenPrice } from '@/lib/tokenRegistry'
import { getServerToken } from '@/lib/serverTokenRegistry'
import { logTrade } from '@/lib/tradeRegistry'
import { 
  getInitialBondingCurveState, 
  estimateSellReturnWithState,
  applySell,
  getCurrentPrice
} from '@/lib/bondingCurve'

// Platform configuration
const PLATFORM_CONFIG = {
  taxWallet: process.env.NEXT_PUBLIC_PLATFORM_WALLET || '3tAQBPnSxMZ7CAvgib29hWFiebRFqupEHLZQENSogewi',
  salesTax: 3, // 3% sales tax
}

export async function POST(request: NextRequest, context: any) {
  const { params } = context as { params: { mint: string } }
  
  try {
    const body = await request.json()
    const { amount, slippage = 100, seller } = body // amount in tokens, slippage in bps
    
    if (!amount || !seller) {
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
    const sellerPubkey = new PublicKey(seller)
    const platformWallet = new PublicKey(PLATFORM_CONFIG.taxWallet)
    
    // Calculate sell amounts using bonding curve
    const bondingState = getInitialBondingCurveState(token.totalSupply * Math.pow(10, token.decimals))
    
    // Apply any previous trades to the state
    if (token.price > 0.000001) {
      const priceRatio = token.price / 0.000001
      bondingState.solReserve = bondingState.solReserve * priceRatio
    }
    
    const tokenAmountRaw = amount * Math.pow(10, token.decimals)
    const sellResult = estimateSellReturnWithState(bondingState, tokenAmountRaw, slippage)
    
    if (sellResult.solOut === 0) {
      return NextResponse.json(
        { error: 'Insufficient liquidity' },
        { status: 400 }
      )
    }
    
    const platformFee = Math.floor(sellResult.solOut * PLATFORM_CONFIG.salesTax / 100)
    const solAfterFee = sellResult.solOut - platformFee
    
    // Create transaction
    const transaction = new Transaction()
    
    // Get seller's token account
    const sellerTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      sellerPubkey
    )
    
    // In a real implementation, this would:
    // 1. Transfer tokens from seller to the bonding curve pool
    // 2. Transfer SOL from the pool to the seller
    // 3. Update the bonding curve state
    
    // For now, we'll create placeholder instructions
    // In production, this would interact with a program that manages the bonding curve
    
    // Placeholder: Transfer tokens from seller (would go to pool)
    const poolTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      platformWallet // Placeholder - would be pool address
    )
    
    // Check if pool token account exists
    const poolTokenAccountInfo = await connection.getAccountInfo(poolTokenAccount)
    if (!poolTokenAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          sellerPubkey,
          poolTokenAccount,
          platformWallet,
          mintPubkey
        )
      )
    }
    
    // Transfer tokens from seller to pool
    transaction.add(
      createTransferInstruction(
        sellerTokenAccount,
        poolTokenAccount,
        sellerPubkey,
        BigInt(tokenAmountRaw)
      )
    )
    
    // Transfer SOL from pool to seller (minus fees)
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: platformWallet, // Placeholder - would be pool address
        toPubkey: sellerPubkey,
        lamports: solAfterFee
      })
    )
    
    // Transfer platform fee
    if (platformFee > 0) {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: platformWallet, // Placeholder - would be pool address
          toPubkey: platformWallet,
          lamports: platformFee
        })
      )
    }
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = sellerPubkey
    
    // Update token price in registry (in production, this would be done after confirmation)
    const newState = applySell(bondingState, tokenAmountRaw, sellResult.solOut)
    const newPrice = getCurrentPrice(newState)
    updateTokenPrice(params.mint, newPrice, sellResult.solOut / LAMPORTS_PER_SOL)
    
    // Log the trade
    logTrade({
      mint: params.mint,
      type: 'sell',
      user: seller,
      amount: amount, // in tokens
      tokens: amount, // tokens sold
      price: sellResult.finalPrice,
      timestamp: Date.now()
    })
    
    // Return transaction for user to sign
    return NextResponse.json({
      success: true,
      transaction: transaction.serialize({ requireAllSignatures: false }).toString('base64'),
      estimatedSol: solAfterFee / LAMPORTS_PER_SOL,
      priceImpact: sellResult.priceImpact,
      finalPrice: sellResult.finalPrice,
      platformFee: platformFee / LAMPORTS_PER_SOL,
      message: `Selling ${amount} ${token.symbol} for ~${(solAfterFee / LAMPORTS_PER_SOL).toFixed(4)} SOL`
    })
    
  } catch (error: any) {
    console.error('Sell API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create sell transaction' },
      { status: 500 }
    )
  }
}