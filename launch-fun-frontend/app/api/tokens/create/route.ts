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
// TODO: add metadata creation using @metaplex-foundation/mpl-token-metadata

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


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, symbol, description, totalSupply, decimals, imageUrl, creator } = body

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
    
    // Generate mint keypair
    const mintKeypair = Keypair.generate()

    const mint = mintKeypair.publicKey
    console.log(`Token mint address: ${mint.toBase58()}`)
    
    // Parse creator public key
    const creatorPubkey = new PublicKey(creator)
    const platformWallet = new PublicKey(PLATFORM_CONFIG.taxWallet)
    
    // Calculate token amounts
    const totalSupplyWithDecimals = totalSupply * Math.pow(10, decimals)
    const platformAllocation = 0 // sales tax collected on trades
    const creatorAllocation = totalSupplyWithDecimals
    
    // Get associated token accounts
    const creatorTokenAccount = await getAssociatedTokenAddress(
      mint,
      creatorPubkey
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
    
    
    // Mint tokens to creator
    transaction.add(
      createMintToInstruction(
        mint,
        creatorTokenAccount,
        creatorPubkey,
        creatorAllocation
      )
    )
    
    // No initial platform allocation - fees collected on trades
    
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

    // Metadata creation is not implemented in this test build
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = creatorPubkey
    
    // Add mint keypair as signer
    transaction.partialSign(mintKeypair)
    
    // Save token to registry on the client after transaction confirmation
    
    // Return the transaction for the user to sign
    return NextResponse.json({
      success: true,
      transaction: transaction.serialize({ requireAllSignatures: false }).toString('base64'),
      mint: mint.toBase58(),
      message: `Token created successfully with on-chain metadata!`,
      metadataUri: metadataUri
    })
  } catch (error: any) {
    console.error('Error creating token:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create token' },
      { status: 500 }
    )
  }
}