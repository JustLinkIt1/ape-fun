import { NextRequest, NextResponse } from 'next/server'
import { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction } from '@solana/web3.js'
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
import { saveServerToken } from '@/lib/serverTokenRegistry'

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

// Helper function to create metadata instruction
function createMetadataInstruction(
  metadata: PublicKey,
  mint: PublicKey,
  mintAuthority: PublicKey,
  payer: PublicKey,
  updateAuthority: PublicKey,
  name: string,
  symbol: string,
  uri: string
): TransactionInstruction {
  // Instruction discriminator for CreateMetadataAccountV3
  const discriminator = Buffer.from([33])
  
  // Helper to serialize string with length prefix
  const serializeString = (str: string): Buffer => {
    const encoded = Buffer.from(str, 'utf8')
    const len = Buffer.alloc(4)
    len.writeUInt32LE(encoded.length, 0)
    return Buffer.concat([len, encoded])
  }
  
  // Serialize the instruction data
  const data = Buffer.concat([
    discriminator,
    serializeString(name),
    serializeString(symbol),
    serializeString(uri),
    Buffer.from([0, 0]), // seller_fee_basis_points (u16) = 0
    Buffer.from([1]), // creators (Option) = Some
    Buffer.from([1, 0, 0, 0]), // creators vector length = 1
    updateAuthority.toBuffer(), // creator address
    Buffer.from([0]), // verified = false
    Buffer.from([100]), // share = 100
    Buffer.from([0]), // collection (Option) = None
    Buffer.from([0]), // uses (Option) = None
    Buffer.from([1]), // isMutable = true
    Buffer.from([0]), // collectionDetails (Option) = None
  ])

  const keys = [
    { pubkey: metadata, isSigner: false, isWritable: true },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: mintAuthority, isSigner: true, isWritable: false },
    { pubkey: payer, isSigner: true, isWritable: false },
    { pubkey: updateAuthority, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ]

  return new TransactionInstruction({
    keys,
    programId: TOKEN_METADATA_PROGRAM_ID,
    data,
  })
}

// Helper to upload metadata JSON to IPFS
async function uploadMetadataToIPFS(metadata: any): Promise<string> {
  const NFT_STORAGE_API_KEY = process.env.NFT_STORAGE_API_KEY
  
  if (!NFT_STORAGE_API_KEY || NFT_STORAGE_API_KEY === 'YOUR_API_KEY_HERE') {
    // Return a data URL as fallback
    const jsonStr = JSON.stringify(metadata)
    const base64 = Buffer.from(jsonStr).toString('base64')
    return `data:application/json;base64,${base64}`
  }
  
  try {
    const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    const response = await fetch('https://api.nft.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NFT_STORAGE_API_KEY}`,
      },
      body: blob
    })
    
    if (!response.ok) {
      throw new Error(`NFT.Storage upload failed: ${response.statusText}`)
    }
    
    const data = await response.json()
    return `https://ipfs.io/ipfs/${data.value.cid}`
  } catch (error) {
    console.error('Failed to upload metadata to IPFS:', error)
    // Fallback to API endpoint
    return `${process.env.NEXT_PUBLIC_APP_URL || 'https://launch.fun'}/api/metadata/${metadata.mint}`
  }
}


export async function POST(request: NextRequest) {
  try {
    console.log('[Token Creation] Received request');
    const body = await request.json()
    let { name, symbol, description, totalSupply, decimals, imageUrl, creator } = body
    console.log('[Token Creation] Parsed body:', body);

    // Validate input
    if (!name || !symbol || !creator) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // --- IMAGE UPLOAD HANDLING ---
    let finalImageUrl = imageUrl;
    if (imageUrl && !imageUrl.startsWith('https://ipfs.io/ipfs/')) {
      // If imageUrl is a data URL or not an IPFS link, upload to IPFS
      console.log('[Token Creation] Uploading image to IPFS...');
      try {
        // Convert data URL to Blob if needed
        let imageBlob;
        if (imageUrl.startsWith('data:')) {
          const matches = imageUrl.match(/^data:(.+);base64,(.*)$/);
          if (!matches) throw new Error('Invalid data URL for image');
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          imageBlob = new Blob([buffer], { type: mimeType });
        } else {
          // If it's a URL but not IPFS, try to fetch and re-upload
          const response = await fetch(imageUrl);
          const arrayBuffer = await response.arrayBuffer();
          imageBlob = new Blob([arrayBuffer]);
        }
        const NFT_STORAGE_API_KEY = process.env.NFT_STORAGE_API_KEY;
        if (!NFT_STORAGE_API_KEY || NFT_STORAGE_API_KEY === 'YOUR_API_KEY_HERE') {
          throw new Error('NFT.Storage API key not set');
        }
        const response = await fetch('https://api.nft.storage/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${NFT_STORAGE_API_KEY}`,
          },
          body: imageBlob
        });
        if (!response.ok) {
          throw new Error(`NFT.Storage upload failed: ${response.statusText}`);
        }
        const data = await response.json();
        finalImageUrl = `https://ipfs.io/ipfs/${data.value.cid}`;
        console.log('[Token Creation] Image uploaded to IPFS:', finalImageUrl);
      } catch (err) {
        console.error('[Token Creation] Failed to upload image to IPFS:', err);
        let message = 'Unknown error';
        if (err instanceof Error) message = err.message;
        return NextResponse.json(
          { error: 'Failed to upload image to IPFS', details: message },
          { status: 500 }
        );
      }
    } else {
      console.log('[Token Creation] Using provided imageUrl:', imageUrl);
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
        await connection.getLatestBlockhash()
        console.log(`[Token Creation] Connected to RPC: ${endpoint}`)
        rpcEndpoint = endpoint
        break
      } catch (error) {
        console.error(`[Token Creation] Failed to connect to ${endpoint}:`, error)
        lastError = error
      }
    }
    
    if (!connection) {
      console.error('[Token Creation] Could not connect to any RPC endpoint. Last error:', lastError);
      throw new Error(`Failed to connect to any RPC endpoint. Last error: ${lastError?.message}`)
    }
    
    // Generate mint keypair
    const mintKeypair = Keypair.generate()
    const mint = mintKeypair.publicKey
    console.log('[Token Creation] Generated mint keypair:', mint.toBase58())
    
    // Parse creator public key
    const creatorPubkey = new PublicKey(creator)
    const platformWallet = new PublicKey(PLATFORM_CONFIG.taxWallet)
    
    // Calculate token amounts
    const totalSupplyWithDecimals = totalSupply * Math.pow(10, decimals)
    
    // Bonding curve allocation (80% to bonding curve, 20% to creator)
    const BONDING_CURVE_ALLOCATION = 0.8 // 80% goes to bonding curve
    const CREATOR_ALLOCATION = 0.2 // 20% goes to creator
    
    const bondingCurveAllocation = Math.floor(totalSupplyWithDecimals * BONDING_CURVE_ALLOCATION)
    const creatorAllocation = Math.floor(totalSupplyWithDecimals * CREATOR_ALLOCATION)
    
    // For now, we'll use a platform-controlled address as the bonding curve pool
    // In production, this would be a program-derived address (PDA)
    const bondingCurvePool = new PublicKey(PLATFORM_CONFIG.taxWallet) // Placeholder
    
    // Get associated token accounts
    const creatorTokenAccount = await getAssociatedTokenAddress(
      mint,
      creatorPubkey
    )
    
    const bondingCurveTokenAccount = await getAssociatedTokenAddress(
      mint,
      bondingCurvePool
    )
    
    console.log('[Token Creation] Creator token account:', creatorTokenAccount.toBase58());
    console.log('[Token Creation] Bonding curve token account:', bondingCurveTokenAccount.toBase58());
    
    // Get minimum balance for rent exemption
    const mintSpace = 82 // Size of mint account
    const mintRent = await connection.getMinimumBalanceForRentExemption(mintSpace)
    console.log('[Token Creation] Mint rent:', mintRent);
    
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
    
    // Create bonding curve pool token account
    transaction.add(
      createAssociatedTokenAccountInstruction(
        creatorPubkey,
        bondingCurveTokenAccount,
        bondingCurvePool,
        mint
      )
    )
    
    
    // Mint tokens to creator (20%)
    if (creatorAllocation > 0) {
      transaction.add(
        createMintToInstruction(
          mint,
          creatorTokenAccount,
          creatorPubkey,
          creatorAllocation
        )
      )
    }
    
    // Mint tokens to bonding curve pool (80%)
    if (bondingCurveAllocation > 0) {
      transaction.add(
        createMintToInstruction(
          mint,
          bondingCurveTokenAccount,
          creatorPubkey,
          bondingCurveAllocation
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
      name,
      symbol,
      description,
      image: finalImageUrl,
      external_url: `https://launch.fun/token/${mint.toBase58()}`,
      attributes: [],
      properties: {
        files: [
          {
            uri: finalImageUrl,
            type: 'image/png', // or detect from mimeType if needed
          },
        ],
        category: 'image',
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

    // Upload metadata to IPFS
    console.log('[Token Creation] Uploading metadata to IPFS...');
    const metadataUri = await uploadMetadataToIPFS({
      ...tokenMetadata,
      mint: mint.toBase58()
    })
    console.log('[Token Creation] Metadata URI:', metadataUri);
    
    // Create metadata account - this must come AFTER mint initialization and BEFORE removing mint authority
    const [metadataPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer()
      ],
      TOKEN_METADATA_PROGRAM_ID
    )

    // Create metadata instruction
    const metadataInstruction = createMetadataInstruction(
      metadataPDA,
      mint,
      creatorPubkey,
      creatorPubkey,
      creatorPubkey,
      name,
      symbol,
      metadataUri
    )
    
    // Add metadata instruction BEFORE removing mint authority
    // Find the position of remove authority instruction
    const removeAuthorityIndex = transaction.instructions.findIndex(
      (ix, index) => {
        // Check if this is the SetAuthority instruction that removes mint authority
        if (ix.programId.equals(TOKEN_PROGRAM_ID) && ix.data.length > 0 && ix.data[0] === 6) {
          // Additional check: ensure it's setting authority to null
          return index > 0 // Make sure it's not the first instruction
        }
        return false
      }
    )
    
    if (removeAuthorityIndex > -1) {
      // Insert metadata instruction before remove authority
      transaction.instructions.splice(removeAuthorityIndex, 0, metadataInstruction)
    } else {
      // If we can't find remove authority, add it at the end (but this shouldn't happen)
      transaction.add(metadataInstruction)
    }
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = creatorPubkey
    
    // Add mint keypair as signer
    transaction.partialSign(mintKeypair)
    
    // Save token to both client and server registries
    const tokenData = {
      mint: mint.toBase58(),
      name,
      symbol,
      decimals,
      totalSupply,
      description: description || '',
      imageUrl: finalImageUrl || '',
      creator: creator,
      createdAt: new Date().toISOString(),
      price: 0.000001, // Initial price
      priceChange24h: 0,
      marketCap: 1000, // Initial market cap
      volume24h: 0,
      holders: 1,
      bondingCurveProgress: 0,
      salesTax: PLATFORM_CONFIG.salesTax
    }
    
    // Save to server-side storage
    saveServerToken(tokenData)
    
    // Also save to client-side storage (this will only work if called from client)
    if (typeof window !== 'undefined') {
      savePlatformToken(tokenData)
    }
    
    // Return the transaction for the user to sign
    return NextResponse.json({
      success: true,
      transaction: transaction.serialize({ requireAllSignatures: false }).toString('base64'),
      mint: mint.toBase58(),
      message: `Token created successfully! ${(creatorAllocation / Math.pow(10, decimals)).toLocaleString()} ${symbol} sent to your wallet, ${(bondingCurveAllocation / Math.pow(10, decimals)).toLocaleString()} ${symbol} added to bonding curve.`,
      metadataUri: metadataUri,
      allocation: {
        creator: creatorAllocation / Math.pow(10, decimals),
        bondingCurve: bondingCurveAllocation / Math.pow(10, decimals),
        creatorPercentage: CREATOR_ALLOCATION * 100,
        bondingCurvePercentage: BONDING_CURVE_ALLOCATION * 100
      }
    })
  } catch (error: any) {
    console.error('[Token Creation] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create token' },
      { status: 500 }
    )
  }
}