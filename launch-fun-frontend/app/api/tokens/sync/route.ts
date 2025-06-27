import { NextRequest, NextResponse } from 'next/server'
import { getServerTokens } from '@/lib/serverTokenRegistry'

export async function GET(request: NextRequest) {
  try {
    // Get all tokens from server registry
    const serverTokens = getServerTokens()
    
    return NextResponse.json({
      success: true,
      tokens: Object.values(serverTokens),
      count: Object.keys(serverTokens).length
    })
  } catch (error: any) {
    console.error('Error syncing tokens:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync tokens' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tokens } = body
    
    if (!tokens || !Array.isArray(tokens)) {
      return NextResponse.json(
        { error: 'Tokens array is required' },
        { status: 400 }
      )
    }
    
    // Import the save function
    const { saveServerToken } = await import('@/lib/serverTokenRegistry')
    
    // Save each token to server registry
    for (const token of tokens) {
      saveServerToken(token)
    }
    
    return NextResponse.json({
      success: true,
      message: `Synced ${tokens.length} tokens to server registry`
    })
  } catch (error: any) {
    console.error('Error syncing tokens:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync tokens' },
      { status: 500 }
    )
  }
} 