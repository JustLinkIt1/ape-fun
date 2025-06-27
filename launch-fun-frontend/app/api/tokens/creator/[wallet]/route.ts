import { NextRequest, NextResponse } from 'next/server'
import { getServerTokensByCreator } from '@/lib/serverTokenRegistry'

export async function GET(
  request: NextRequest,
  { params }: { params: { wallet: string } }
) {
  try {
    const wallet = params.wallet
    
    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }
    
    // Get tokens created by this wallet from server registry
    const tokens = getServerTokensByCreator(wallet)
    
    return NextResponse.json({
      success: true,
      tokens,
      count: tokens.length
    })
  } catch (error: any) {
    console.error('Error fetching tokens by creator:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tokens by creator' },
      { status: 500 }
    )
  }
} 