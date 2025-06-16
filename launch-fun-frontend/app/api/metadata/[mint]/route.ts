import { NextRequest, NextResponse } from 'next/server'
import { getPlatformToken } from '@/lib/tokenRegistry'

export async function GET(
  request: NextRequest,
  { params }: { params: { mint: string } }
) {
  try {
    const mint = params.mint
    
    // Get token from registry
    const token = getPlatformToken(mint)
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      )
    }
    
    // Return standard Metaplex metadata format
    const metadata = {
      name: token.name,
      symbol: token.symbol,
      description: token.description || '',
      image: token.imageUrl || '',
      external_url: `https://launch.fun/token/${mint}`,
      attributes: [
        {
          trait_type: 'Total Supply',
          value: token.totalSupply
        },
        {
          trait_type: 'Decimals',
          value: token.decimals
        },
        {
          trait_type: 'Creator',
          value: token.creator
        },
        {
          trait_type: 'Created At',
          value: token.createdAt
        }
      ],
      properties: {
        files: token.imageUrl ? [{
          uri: token.imageUrl,
          type: 'image/png'
        }] : [],
        category: 'image',
        creators: [{
          address: token.creator,
          share: 100
        }]
      },
      seller_fee_basis_points: 0
    }
    
    // Set proper headers for JSON
    return NextResponse.json(metadata, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error: any) {
    console.error('Error fetching metadata:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch metadata' },
      { status: 500 }
    )
  }
}