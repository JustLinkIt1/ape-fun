import { NextRequest, NextResponse } from 'next/server'

const NFT_STORAGE_API_KEY = process.env.NFT_STORAGE_API_KEY

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // If NFT.Storage API key is configured, upload to IPFS
    if (NFT_STORAGE_API_KEY && NFT_STORAGE_API_KEY !== 'YOUR_API_KEY_HERE') {
      try {
        const response = await fetch('https://api.nft.storage/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NFT_STORAGE_API_KEY}`,
          },
          body: file
        })
        
        if (!response.ok) {
          throw new Error(`NFT.Storage upload failed: ${response.statusText}`)
        }
        
        const data = await response.json()
        const ipfsUrl = `https://ipfs.io/ipfs/${data.value.cid}`
        
        return NextResponse.json({
          success: true,
          url: ipfsUrl,
          cid: data.value.cid
        })
      } catch (error) {
        console.error('NFT.Storage upload error:', error)
        // Fall back to base64 if IPFS upload fails
      }
    }
    
    // Fallback: convert to base64 data URL for testing
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const mimeType = file.type || 'image/png'
    const dataUrl = `data:${mimeType};base64,${base64}`
    
    return NextResponse.json({
      success: true,
      url: dataUrl,
      isDataUrl: true
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}