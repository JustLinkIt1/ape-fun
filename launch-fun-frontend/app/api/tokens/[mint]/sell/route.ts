import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest, context: any) {
  const { params } = context as { params: { mint: string } }
  try {
    const body = await request.json()
    const { amount, seller, liquidityAccount } = body
    console.log('Sell request', { mint: params.mint, amount, seller, liquidityAccount })
    const dummyTx = Buffer.from('dummy sell transaction').toString('base64')
    return NextResponse.json({ transaction: dummyTx })
  } catch (error) {
    console.error('Sell API error:', error)
    return NextResponse.json(
      { error: 'Failed to create sell transaction' },
      { status: 500 }
    )
  }
}
