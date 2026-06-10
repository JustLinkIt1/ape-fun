import { NextRequest, NextResponse } from 'next/server'
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
} from '@solana/spl-token'
import { getServerToken, updateTokenBondingCurve } from '@/lib/serverTokenRegistry'
import {
  estimateBuyTokensWithState,
  applyBuy,
  getCurrentPrice,
} from '@/lib/bondingCurve'
import { logTrade } from '@/lib/tradeRegistry'
import { awardScore } from '@/lib/profileRegistry'
import { buildScoreEvent } from '@/lib/apeScore'
import { FEE_SPLIT } from '@/lib/constants'

const TAX_BPS = 100  // 1%
const PLATFORM_WALLET = process.env.NEXT_PUBLIC_PLATFORM_WALLET || '3tAQBPnSxMZ7CAvgib29hWFiebRFqupEHLZQENSogewi'

function getConnection() {
  const endpoints = [
    process.env.NEXT_PUBLIC_HELIUS_API_KEY
      ? `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`
      : null,
    'https://api.mainnet-beta.solana.com',
    'https://rpc.ankr.com/solana',
  ].filter(Boolean) as string[]
  // Return first endpoint — connection errors bubble up to caller
  return new Connection(endpoints[0], 'confirmed')
}

export async function POST(request: NextRequest, context: { params: Promise<{ mint: string }> }) {
  const params = await context.params
  try {
    const body = await request.json()
    const { amount, slippage = 100, buyer } = body  // amount in SOL, slippage bps

    if (!amount || !buyer) {
      return NextResponse.json({ error: 'amount and buyer are required' }, { status: 400 })
    }

    const token = getServerToken(params.mint)
    if (!token) return NextResponse.json({ error: 'Token not found' }, { status: 404 })

    const decimals = token.decimals ?? 6
    const state = {
      solReserve: token.solReserve,
      tokenReserve: token.tokenReserve,
      totalSupply: token.totalSupply * Math.pow(10, decimals),
    }

    const solLamports = Math.round(amount * LAMPORTS_PER_SOL)
    const feeLamports = Math.round(solLamports * TAX_BPS / 10000)
    const solAfterFee = solLamports - feeLamports

    const buyResult = estimateBuyTokensWithState(state, solAfterFee, slippage)
    if (buyResult.tokensOut <= 0) {
      return NextResponse.json({ error: 'Insufficient liquidity' }, { status: 400 })
    }

    const connection = getConnection()
    const mintPubkey = new PublicKey(params.mint)
    const buyerPubkey = new PublicKey(buyer)
    const platformPubkey = new PublicKey(PLATFORM_WALLET)

    const transaction = new Transaction()

    // Create buyer token account if needed
    const buyerTokenAccount = await getAssociatedTokenAddress(mintPubkey, buyerPubkey)
    const accountInfo = await connection.getAccountInfo(buyerTokenAccount).catch(() => null)
    if (!accountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(buyerPubkey, buyerTokenAccount, buyerPubkey, mintPubkey)
      )
    }

    // Fee split: 50% treasury / 30% creator / 20% requestor
    const treasuryFee = Math.round(feeLamports * FEE_SPLIT.treasury)
    const creatorFee = Math.round(feeLamports * FEE_SPLIT.creator)

    if (treasuryFee > 0) {
      transaction.add(SystemProgram.transfer({ fromPubkey: buyerPubkey, toPubkey: platformPubkey, lamports: treasuryFee }))
    }
    if (creatorFee > 0 && token.creator) {
      try {
        const creatorPubkey = new PublicKey(token.creator)
        transaction.add(SystemProgram.transfer({ fromPubkey: buyerPubkey, toPubkey: creatorPubkey, lamports: creatorFee }))
      } catch {}
    }

    // SOL into pool (platform wallet acts as pool for demo)
    transaction.add(SystemProgram.transfer({ fromPubkey: buyerPubkey, toPubkey: platformPubkey, lamports: solAfterFee }))

    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = buyerPubkey

    // Update bonding curve state
    const newState = applyBuy(state, solAfterFee, buyResult.tokensOut)
    updateTokenBondingCurve(params.mint, newState.solReserve, newState.tokenReserve, amount)

    const tokensOut = buyResult.tokensOut / Math.pow(10, decimals)

    // Record trade
    logTrade({
      mint: params.mint,
      type: 'buy',
      user: buyer,
      amount,
      tokens: tokensOut,
      price: buyResult.finalPrice,
      timestamp: Date.now(),
    })

    // Award Ape Score for buying early (<20% bonding progress)
    if (token.bondingCurveProgress < 20) {
      try { awardScore(buildScoreEvent(buyer, 'early_buyer_graduated' as any, params.mint)) } catch {}
    }

    return NextResponse.json({
      success: true,
      transaction: transaction.serialize({ requireAllSignatures: false }).toString('base64'),
      estimatedTokens: tokensOut,
      priceImpact: buyResult.priceImpact,
      finalPrice: buyResult.finalPrice,
      platformFee: feeLamports / LAMPORTS_PER_SOL,
      message: `Buying ~${tokensOut.toFixed(2)} ${token.symbol} for ${amount} SOL`,
    })
  } catch (error: any) {
    console.error('Buy error:', error)
    return NextResponse.json({ error: error.message || 'Buy failed' }, { status: 500 })
  }
}
