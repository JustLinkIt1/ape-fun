const { Connection, PublicKey } = require('@solana/web3.js');
const { MPL_TOKEN_METADATA_PROGRAM_ID: TOKEN_METADATA_PROGRAM_ID } = require('@metaplex-foundation/mpl-token-metadata');

// Helper to get metadata PDA
function getMetadataPDA(mint) {
  const [metadata] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID
  );
  return metadata;
}

async function checkTokenMetadata(mintAddress) {
  try {
    // Connect to mainnet
    const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');
    
    // Parse mint address
    const mint = new PublicKey(mintAddress);
    
    // Get metadata PDA
    const metadataPDA = getMetadataPDA(mint);
    console.log('Metadata PDA:', metadataPDA.toBase58());
    
    // Fetch metadata account
    const metadataAccount = await connection.getAccountInfo(metadataPDA);
    
    if (!metadataAccount) {
      console.log('No metadata account found for this token');
      return;
    }
    
    console.log('Metadata account exists!');
    console.log('Owner:', metadataAccount.owner.toBase58());
    console.log('Data length:', metadataAccount.data.length);
    
    // Parse metadata
    const data = metadataAccount.data;
    
    // Skip discriminator and key (first 2 bytes)
    let offset = 1 + 1;
    
    // Read update authority
    const updateAuthority = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    // Read mint
    const mintFromData = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    // Read name (fixed 32 bytes in the old format)
    const nameBytes = data.slice(offset, offset + 32);
    const name = nameBytes.toString('utf8').replace(/\0/g, '').trim();
    offset += 32;
    
    // Read symbol (fixed 10 bytes in the old format)
    const symbolBytes = data.slice(offset, offset + 10);
    const symbol = symbolBytes.toString('utf8').replace(/\0/g, '').trim();
    offset += 10;
    
    // Read URI (fixed 200 bytes in the old format)
    const uriBytes = data.slice(offset, offset + 200);
    const uri = uriBytes.toString('utf8').replace(/\0/g, '').trim();
    offset += 200;
    
    console.log('\nParsed Metadata:');
    console.log('Update Authority:', updateAuthority.toBase58());
    console.log('Mint:', mintFromData.toBase58());
    console.log('Name:', name);
    console.log('Symbol:', symbol);
    console.log('URI:', uri);
    
    // Fetch URI content if it exists
    if (uri) {
      try {
        const response = await fetch(uri);
        const jsonMetadata = await response.json();
        console.log('\nJSON Metadata from URI:');
        console.log(JSON.stringify(jsonMetadata, null, 2));
      } catch (error) {
        console.log('\nCould not fetch metadata from URI:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Test with a known token or the one from the transaction
const mintAddress = process.argv[2];
if (!mintAddress) {
  console.log('Usage: node test-metadata.js <MINT_ADDRESS>');
  console.log('Example: node test-metadata.js 9vmL2GZPVfUjcAKFWZs3uGgMLP8XiYvvbuvjdYwVpump');
  process.exit(1);
}

checkTokenMetadata(mintAddress);