import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, context: any) {
  const { params } = context as { params: { mint: string } }
  try {
    const body = await request.json()
    const { amount, slippage, buyer, liquidityAccount } = body
    console.log('Buy request', { mint: params.mint, amount, slippage, buyer, liquidityAccount })
    // TODO: Integrate with backend/Raydium to create real transaction
    // For now, return a placeholder base64 transaction string
    const dummyTx = Buffer.from('dummy transaction').toString('base64')
    return NextResponse.json({ transaction: dummyTx })
  } catch (error) {
    console.error('Buy API error:', error)
    return NextResponse.json(
      { error: 'Failed to create buy transaction' },
      { status: 500 }
    )
  }
}
