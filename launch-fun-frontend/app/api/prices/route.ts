import { NextRequest, NextResponse } from 'next/server'

// Cache for price data
let priceCache = {
  solana: {
    usd: 0,
    lastUpdated: 0
  }
}

const CACHE_DURATION = 60 * 1000 // 1 minute

export async function GET(request: NextRequest) {
  try {
    const now = Date.now()
    
    // Check if cache is still valid
    if (priceCache.solana.lastUpdated && (now - priceCache.solana.lastUpdated) < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        prices: {
          solana: {
            usd: priceCache.solana.usd
          }
        }
      })
    }
    
    // Fetch fresh price from CoinGecko API
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
    
    if (!response.ok) {
      throw new Error('Failed to fetch price data')
    }
    
    const data = await response.json()
    
    // Update cache
    priceCache.solana.usd = data.solana.usd
    priceCache.solana.lastUpdated = now
    
    return NextResponse.json({
      success: true,
      prices: {
        solana: {
          usd: data.solana.usd
        }
      }
    })
    
  } catch (error) {
    console.error('Error fetching prices:', error)
    
    // Return cached price if available, even if expired
    if (priceCache.solana.usd > 0) {
      return NextResponse.json({
        success: true,
        prices: {
          solana: {
            usd: priceCache.solana.usd
          }
        },
        cached: true
      })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch price data' },
      { status: 500 }
    )
  }
}