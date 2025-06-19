import { NextRequest, NextResponse } from 'next/server'
import { getServerTokens } from '@/lib/serverTokenRegistry'
import { Connection, PublicKey } from '@solana/web3.js'
import { Metadata } from '@metaplex-foundation/mpl-token-metadata'

export async function GET(request: NextRequest) {
  try {
    // Get mint from query params
    const searchParams = request.nextUrl.searchParams
    const mint = searchParams.get('mint')
    
    const result: any = {
      serverTokens: {},
      onChainData: null,
      metadata: null
    }
    
    // Get server-stored tokens
    try {
      result.serverTokens = getServerTokens()
    } catch (error) {
      result.serverTokens = { error: 'Failed to read server tokens' }
    }
    
    // If mint provided, fetch on-chain data
    if (mint) {
      try {
        const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')
        const mintPubkey = new PublicKey(mint)
        
        // Get mint info
        const mintInfo = await connection.getParsedAccountInfo(mintPubkey)
        result.onChainData = {
          exists: mintInfo.value !== null,
          data: mintInfo.value?.data
        }
        
        // Get metadata PDA
        const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
        const [metadataPDA] = PublicKey.findProgramAddressSync(
          [
            Buffer.from('metadata'),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mintPubkey.toBuffer(),
          ],
          TOKEN_METADATA_PROGRAM_ID
        )
        
        // Check if metadata exists and decode it
        const metadataAccount = await connection.getAccountInfo(metadataPDA)
        result.metadata = {
          pda: metadataPDA.toBase58(),
          exists: metadataAccount !== null,
          size: metadataAccount?.data.length || 0,
          decoded: null
        }
        
        if (metadataAccount && metadataAccount.data) {
          try {
            // Decode metadata
            const data = metadataAccount.data
            let offset = 1 + 1 // Skip discriminator and key
            
            // Read update authority
            const updateAuthority = new PublicKey(data.slice(offset, offset + 32))
            offset += 32
            
            // Read mint
            const mintFromData = new PublicKey(data.slice(offset, offset + 32))
            offset += 32
            
            // Read name (fixed 32 bytes)
            const nameBytes = data.slice(offset, offset + 32)
            const name = nameBytes.toString('utf8').replace(/\0/g, '').trim()
            offset += 32
            
            // Read symbol (fixed 10 bytes)
            const symbolBytes = data.slice(offset, offset + 10)
            const symbol = symbolBytes.toString('utf8').replace(/\0/g, '').trim()
            offset += 10
            
            // Read URI (fixed 200 bytes)
            const uriBytes = data.slice(offset, offset + 200)
            const uri = uriBytes.toString('utf8').replace(/\0/g, '').trim()
            
            result.metadata.decoded = {
              updateAuthority: updateAuthority.toBase58(),
              mint: mintFromData.toBase58(),
              name: name || 'No name found',
              symbol: symbol || 'No symbol found',
              uri: uri || 'No URI found'
            }
            
            // Try to fetch URI content if it exists
            if (uri && uri.startsWith('http')) {
              try {
                const metadataResponse = await fetch(uri)
                if (metadataResponse.ok) {
                  result.metadata.uriContent = await metadataResponse.json()
                }
              } catch (e) {
                result.metadata.uriContent = { error: 'Failed to fetch URI content' }
              }
            }
          } catch (decodeError: any) {
            result.metadata.decoded = { error: `Failed to decode: ${decodeError.message}` }
          }
        }
        
      } catch (error: any) {
        result.onChainData = { error: error.message }
      }
    }
    
    return NextResponse.json({
      success: true,
      mint: mint || 'No mint provided',
      data: result,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Debug endpoint error'
    }, { status: 500 })
  }
}