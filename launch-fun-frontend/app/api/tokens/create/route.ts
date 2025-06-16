import { NextRequest, NextResponse } from 'next/server'
import { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import {
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  createSetAuthorityInstruction,
  AuthorityType
} from '@solana/spl-token'
import { savePlatformToken } from '@/lib/tokenRegistry'
import { createCreateMetadataAccountV3Instruction } from '@metaplex-foundation/mpl-token-metadata'

// Platform configuration
const PLATFORM_CONFIG = {
  taxWallet: process.env.NEXT_PUBLIC_PLATFORM_WALLET || '3tAQBPnSxMZ7CAvgib29hWFiebRFqupEHLZQENSogewi',
  salesTax: 3, // 3% sales tax
  launchFee: 0, // 0 SOL launch fee for testing
  bondingTarget: 69000, // Bond to Raydium at 69k market cap
  network: 'mainnet-beta' // Using mainnet for production
}

// Metaplex Token Metadata Program ID
const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')

// Helper function to generate vanity address ending with suffix
function generateVanityKeypair(suffix: string = 'RISE'): { keypair: Keypair, isVanity: boolean, attempts: number } {
  console.log(`Generating vanity address ending with ${suffix}...`)
  let attempts = 0
  const startTime = Date.now()
  
  // For a 4-character suffix, probability is 1 in 58^4 ≈ 1 in 11.3 million
  // We'll try for a reasonable time but have a fallback
  const maxAttempts = suffix.length === 4 ? 200000 : 100000
  
  while (attempts < maxAttempts) {
    attempts++
    const keypair = Keypair.generate()
    const address = keypair.publicKey.toBase58()
    
    // Check if address ends with desired suffix (case sensitive)
    if (address.endsWith(suffix)) {
      const timeElapsed = (Date.now() - startTime) / 1000
      console.log(`✨ Found vanity address after ${attempts} attempts in ${timeElapsed}s: ${address}`)
      return { keypair, isVanity: true, attempts }
    }
    
    // Log progress every 25000 attempts
    if (attempts % 25000 === 0) {
      const timeElapsed = (Date.now() - startTime) / 1000
      console.log(`Vanity address generation: ${attempts} attempts (${timeElapsed.toFixed(1)}s elapsed)...`)
    }
  }
  
  // Fallback to regular address
  const keypair = Keypair.generate()
  const timeElapsed = (Date.now() - startTime) / 1000
  console.log(`⚠️ Using regular address after ${attempts} attempts (${timeElapsed.toFixed(1)}s). Address: ${keypair.publicKey.toBase58()}`)
  return { keypair, isVanity: false, attempts }
}

// Alternative: Try for shorter suffix first
function generateSmartVanityKeypair(): { keypair: Keypair, suffix: string, attempts: number } {
  // Try progressively shorter suffixes
  const suffixes = ['RISE', 'ISE', 'SE']
  
  for (const suffix of suffixes) {
    console.log(`Trying for suffix: ${suffix}`)
    const result = generateVanityKeypair(suffix)
    if (result.isVanity) {
      return { keypair: result.keypair, suffix, attempts: result.attempts }
    }
  }
  
  // Fallback
  return { keypair: Keypair.generate(), suffix: '', attempts: 0 }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, symbol, description, totalSupply, decimals, imageUrl, creator, useVanityAddress } = body

    // Validate input
    if (!name || !symbol || !creator) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create connection to Solana mainnet with fallback RPC endpoints
    const rpcEndpoints = [
      `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`,
      'https://api.mainnet-beta.solana.com',
      'https://rpc.ankr.com/solana'
    ]
    
    let connection: Connection | null = null
    let lastError: any = null
    let rpcEndpoint: string = ''
    
    // Try each endpoint until one works
    for (const endpoint of rpcEndpoints) {
      try {
        connection = new Connection(endpoint, 'confirmed')
        // Test the connection
        await connection.getLatestBlockhash()
        console.log(`Connected to RPC: ${endpoint}`)
        rpcEndpoint = endpoint
        break
      } catch (error) {
        console.error(`Failed to connect to ${endpoint}:`, error)
        lastError = error
      }
    }
    
    if (!connection) {
      throw new Error(`Failed to connect to any RPC endpoint. Last error: ${lastError?.message}`)
    }
    
    // Generate mint keypair (vanity or regular)
    let mintKeypair: Keypair
    let vanityInfo = { isVanity: false, suffix: '', attempts: 0 }
    
    if (useVanityAddress !== false) {
      // Try smart vanity generation (tries RISE, then ISE, then SE)
      const result = generateSmartVanityKeypair()
      mintKeypair = result.keypair
      vanityInfo = {
        isVanity: result.suffix !== '',
        suffix: result.suffix,
        attempts: result.attempts
      }
    } else {
      mintKeypair = Keypair.generate()
    }
    
    const mint = mintKeypair.publicKey
    console.log(`Token mint address: ${mint.toBase58()} ${vanityInfo.isVanity ? `(Vanity: ${vanityInfo.suffix})` : ''}`)
    
    // Parse creator public key
    const creatorPubkey = new PublicKey(creator)
    const platformWallet = new PublicKey(PLATFORM_CONFIG.taxWallet)
    
    // Calculate token amounts
    const totalSupplyWithDecimals = totalSupply * Math.pow(10, decimals)
    const platformAllocation = totalSupplyWithDecimals * (PLATFORM_CONFIG.salesTax / 100)
    const creatorAllocation = totalSupplyWithDecimals - platformAllocation
    
    // Get associated token accounts
    const creatorTokenAccount = await getAssociatedTokenAddress(
      mint,
      creatorPubkey
    )
    
    const platformTokenAccount = await getAssociatedTokenAddress(
      mint,
      platformWallet
    )
    
    // Get minimum balance for rent exemption
    const mintSpace = 82 // Size of mint account
    const mintRent = await connection.getMinimumBalanceForRentExemption(mintSpace)
    
    // Create transaction
    const transaction = new Transaction()
    
    // Add launch fee if applicable
    if (PLATFORM_CONFIG.launchFee > 0) {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: creatorPubkey,
          toPubkey: platformWallet,
          lamports: PLATFORM_CONFIG.launchFee * LAMPORTS_PER_SOL
        })
      )
    }
    
    // Create mint account
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: creatorPubkey,
        newAccountPubkey: mint,
        space: mintSpace,
        lamports: mintRent,
        programId: TOKEN_PROGRAM_ID
      })
    )
    
    // Initialize mint
    transaction.add(
      createInitializeMintInstruction(
        mint,
        decimals,
        creatorPubkey, // mint authority
        null, // freeze authority (null = no freeze)
        TOKEN_PROGRAM_ID
      )
    )
    
    // Create associated token accounts
    transaction.add(
      createAssociatedTokenAccountInstruction(
        creatorPubkey,
        creatorTokenAccount,
        creatorPubkey,
        mint
      )
    )
    
    if (platformAllocation > 0) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          creatorPubkey,
          platformTokenAccount,
          platformWallet,
          mint
        )
      )
    }
    
    // Mint tokens to creator
    transaction.add(
      createMintToInstruction(
        mint,
        creatorTokenAccount,
        creatorPubkey,
        creatorAllocation
      )
    )
    
    // Mint platform allocation
    if (platformAllocation > 0) {
      transaction.add(
        createMintToInstruction(
          mint,
          platformTokenAccount,
          creatorPubkey,
          platformAllocation
        )
      )
    }
    
    // Remove mint authority (renounce minting)
    transaction.add(
      createSetAuthorityInstruction(
        mint,
        creatorPubkey,
        AuthorityType.MintTokens,
        null
      )
    )
    
    // Create metadata JSON
    const tokenMetadata = {
      name: name,
      symbol: symbol,
      description: description || '',
      image: imageUrl || '',
      attributes: [],
      properties: {
        files: imageUrl ? [{
          uri: imageUrl,
          type: "image/png"
        }] : [],
        category: "image",
        creators: [{
          address: creator,
          share: 100
        }]
      },
      seller_fee_basis_points: 0,
      creators: [{
        address: creator,
        verified: false,
        share: 100
      }]
    }

    // For now, we'll use our API endpoint as metadata URI
    // In production, this should be uploaded to IPFS or Arweave
    const metadataUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://launch.fun'}/api/metadata/${mint.toBase58()}`
    
    // Create metadata account - this must come AFTER mint initialization and BEFORE removing mint authority
    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer()
      ],
      TOKEN_METADATA_PROGRAM_ID
    )

    const createMetadataIx = createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataPDA,
        mint,
        mintAuthority: creatorPubkey,
        payer: creatorPubkey,
        updateAuthority: creatorPubkey
      },
      {
        createMetadataAccountArgsV3: {
          data: {
            name,
            symbol,
            uri: metadataUri,
            sellerFeeBasisPoints: 0,
            creators: [{ address: creatorPubkey, verified: false, share: 100 }],
            collection: null,
            uses: null
          },
          isMutable: true,
          collectionDetails: null
        }
      }
    )
    
    transaction.add(createMetadataIx)
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = creatorPubkey
    
    // Add mint keypair as signer
    transaction.partialSign(mintKeypair)
    
    // Save token to registry with metadata
    savePlatformToken({
      mint: mint.toBase58(),
      name,
      symbol,
      decimals,
      totalSupply,
      description,
      imageUrl: imageUrl || '',
      creator: creator,
      createdAt: new Date().toISOString(),
      price: 0.000001, // Initial price
      priceChange24h: 0,
      marketCap: 1000, // Initial market cap
      volume24h: 0,
      holders: 1,
      bondingCurveProgress: 0,
      salesTax: PLATFORM_CONFIG.salesTax
    })
    
    // Return the transaction for the user to sign
    return NextResponse.json({
      success: true,
      transaction: transaction.serialize({ requireAllSignatures: false }).toString('base64'),
      mint: mint.toBase58(),
      message: `Token created successfully with on-chain metadata! ${vanityInfo.isVanity ? `✨ Got vanity address ending with "${vanityInfo.suffix}"!` : ''}`,
      metadataUri: metadataUri,
      vanityAddress: vanityInfo.isVanity,
      vanitySuffix: vanityInfo.suffix,
      vanityAttempts: vanityInfo.attempts
    })
  } catch (error: any) {
    console.error('Error creating token:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create token' },
      { status: 500 }
    )
  }
}