import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createTransferInstruction,
} from '@solana/spl-token'
import { getServerToken, updateTokenBondingCurve } from '@/lib/serverTokenRegistry'
import {
  estimateSellReturnWithState,
  applySell,
} from '@/lib/bondingCurve'
import { logTrade } from '@/lib/tradeRegistry'
import { FEE_SPLIT } from '@/lib/constants'

const TAX_BPS = 100
const PLATFORM_WALLET = process.env.NEXT_PUBLIC_PLATFORM_WALLET || '3tAQBPnSxMZ7CAvgib29hWFiebRFqupEHLZQENSogewi'

function getConnection() {
  const endpoint = process.env.NEXT_PUBLIC_HELIUS_API_KEY
    ? `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`
    : 'https://api.mainnet-beta.solana.com'
  return new Connection(endpoint, 'confirmed')
}

export async function POST(request: NextRequest, context: { params: Promise<{ mint: string }> }) {
  const params = await context.params
  try {
    const body = await request.json()
    const { amount, slippage = 100, seller } = body  // amount in tokens

    if (!amount || !seller) {
      return NextResponse.json({ error: 'amount and seller are required' }, { status: 400 })
    }

    const token = getServerToken(params.mint)
    if (!token) return NextResponse.json({ error: 'Token not found' }, { status: 404 })

    const decimals = token.decimals ?? 6
    const state = {
      solReserve: token.solReserve,
      tokenReserve: token.tokenReserve,
      totalSupply: token.totalSupply * Math.pow(10, decimals),
    }

    const tokenAmountRaw = amount * Math.pow(10, decimals)
    const sellResult = estimateSellReturnWithState(state, tokenAmountRaw, slippage)
    if (sellResult.solOut <= 0) {
      return NextResponse.json({ error: 'Insufficient liquidity' }, { status: 400 })
    }

    const feeLamports = Math.round(sellResult.solOut * TAX_BPS / 10000)
    const solAfterFee = sellResult.solOut - feeLamports

    const connection = getConnection()
    const mintPubkey = new PublicKey(params.mint)
    const sellerPubkey = new PublicKey(seller)
    const platformPubkey = new PublicKey(PLATFORM_WALLET)

    const transaction = new Transaction()

    const sellerTokenAccount = await getAssociatedTokenAddress(mintPubkey, sellerPubkey)
    const poolTokenAccount = await getAssociatedTokenAddress(mintPubkey, platformPubkey)

    // Create pool token account if needed
    const poolAccountInfo = await connection.getAccountInfo(poolTokenAccount).catch(() => null)
    if (!poolAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(sellerPubkey, poolTokenAccount, platformPubkey, mintPubkey)
      )
    }

    // Transfer tokens from seller to pool
    transaction.add(
      createTransferInstruction(sellerTokenAccount, poolTokenAccount, sellerPubkey, BigInt(tokenAmountRaw))
    )

    // Fee split
    const treasuryFee = Math.round(feeLamports * FEE_SPLIT.treasury)
    const creatorFee = Math.round(feeLamports * FEE_SPLIT.creator)

    if (treasuryFee > 0) {
      transaction.add(SystemProgram.transfer({ fromPubkey: platformPubkey, toPubkey: platformPubkey, lamports: treasuryFee }))
    }
    if (creatorFee > 0 && token.creator) {
      try {
        transaction.add(SystemProgram.transfer({
          fromPubkey: platformPubkey,
          toPubkey: new PublicKey(token.creator),
          lamports: creatorFee,
        }))
      } catch {}
    }

    // Return SOL to seller from pool (demo: pool = platform wallet)
    if (solAfterFee > 0) {
      transaction.add(SystemProgram.transfer({ fromPubkey: platformPubkey, toPubkey: sellerPubkey, lamports: solAfterFee }))
    }

    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = sellerPubkey

    // Update bonding curve state
    const newState = applySell(state, tokenAmountRaw, sellResult.solOut)
    updateTokenBondingCurve(params.mint, newState.solReserve, newState.tokenReserve, solAfterFee / LAMPORTS_PER_SOL)

    // Record trade
    logTrade({
      mint: params.mint,
      type: 'sell',
      user: seller,
      amount,
      tokens: amount,
      price: sellResult.finalPrice,
      timestamp: Date.now(),
    })

    return NextResponse.json({
      success: true,
      transaction: transaction.serialize({ requireAllSignatures: false }).toString('base64'),
      estimatedSol: solAfterFee / LAMPORTS_PER_SOL,
      priceImpact: sellResult.priceImpact,
      finalPrice: sellResult.finalPrice,
      platformFee: feeLamports / LAMPORTS_PER_SOL,
      message: `Selling ${amount} ${token.symbol} for ~${(solAfterFee / LAMPORTS_PER_SOL).toFixed(4)} SOL`,
    })
  } catch (error: any) {
    console.error('Sell error:', error)
    return NextResponse.json({ error: error.message || 'Sell failed' }, { status: 500 })
  }
}
