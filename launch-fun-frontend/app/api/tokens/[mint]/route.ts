import { NextRequest, NextResponse } from 'next/server'
import { getServerToken, getServerTokens } from '@/lib/serverTokenRegistry'

export async function GET(
  request: NextRequest,
  { params }: { params: { mint: string } }
) {
  try {
    const mint = params.mint
    
    // Get token from server registry
    const token = getServerToken(mint)
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      token
    })
  } catch (error: any) {
    console.error('Error fetching token:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch token' },
      { status: 500 }
    )
  }
}

// Get all tokens
export async function POST(request: NextRequest) {
  try {
    const tokens = getServerTokens()
    
    return NextResponse.json({
      success: true,
      tokens: Object.values(tokens)
    })
  } catch (error: any) {
    console.error('Error fetching tokens:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tokens' },
      { status: 500 }
    )
  }
}