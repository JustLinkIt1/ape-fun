from dataclasses import dataclass
from typing import Optional, List
import time

from solana.rpc.api import Client
from solana.rpc.commitment import Confirmed
from solana.keypair import Keypair
from solana.publickey import PublicKey
from solana.transaction import Transaction
from solana.system_program import SYS_PROGRAM_ID, SYSVAR_RENT_PUBKEY
from spl.token.constants import TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID
from spl.token.instructions import (
    create_mint,
    create_associated_token_account,
    mint_to,
)

# Metaplex metadata program
METAPLEX_METADATA_PROGRAM_ID = PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
)  # noqa: E501


@dataclass
class TokenMetadata:
    """Basic token metadata"""

    name: str
    symbol: str
    uri: str


@dataclass
class LaunchConfig:
    total_supply: int
    decimals: int = 9
    rpc_url: str = "https://api.mainnet-beta.solana.com"


class SimpleMainnetLaunchpad:
    """Simplified launchpad for creating an SPL token with metadata."""

    def __init__(self, rpc_url: Optional[str] = None):
        self.client = Client(
            rpc_url or "https://api.mainnet-beta.solana.com",
            commitment=Confirmed,
        )
        self._verify_connection()

    def _verify_connection(self):
        version = self.client.get_version()
        print(f"Connected to Solana {version['result']['solana-core']}")

    def _send_transaction_with_retry(
        self, tx: Transaction, signers: List[Keypair], retries: int = 3
    ) -> str:
        for attempt in range(retries):
            try:
                resp = self.client.send_transaction(
                    tx,
                    *signers,
                    opts={
                        "skip_preflight": False,
                        "preflight_commitment": Confirmed,
                    },
                )
                self.client.confirm_transaction(
                    resp["result"],
                    commitment=Confirmed,
                )
                return resp["result"]
            except Exception as err:
                if attempt == retries - 1:
                    raise err
                print("Transaction failed, retrying...", err)
                time.sleep(2)

    def _create_metadata_instruction(
        self,
        metadata_pda: PublicKey,
        mint: PublicKey,
        payer: PublicKey,
        metadata: TokenMetadata,
    ):
        """Build CreateMetadataAccountV3 instruction."""
        from mpl_token_metadata.instructions import create_metadata_account_v3
        from mpl_token_metadata.layout import DataV2

        data = DataV2(
            name=metadata.name,
            symbol=metadata.symbol,
            uri=metadata.uri,
            seller_fee_basis_points=0,
            creators=None,
            collection=None,
            uses=None,
        )

        return create_metadata_account_v3(
            {
                "metadata": metadata_pda,
                "mint": mint,
                "mint_authority": payer,
                "payer": payer,
                "update_authority": payer,
                "system_program": SYS_PROGRAM_ID,
                "rent": SYSVAR_RENT_PUBKEY,
            },
            {"data": data, "is_mutable": True, "collection_details": None},
        )

    def create_token(
        self, payer: Keypair, metadata: TokenMetadata, config: LaunchConfig
    ) -> PublicKey:
        mint_keypair = Keypair()

        # Mint account
        mint_ix = create_mint(
            payer=payer.public_key,
            mint_authority=payer.public_key,
            freeze_authority=None,
            decimals=config.decimals,
            mint=mint_keypair.public_key,
            program_id=TOKEN_PROGRAM_ID,
        )

        # Associated token account for payer
        ata_ix = create_associated_token_account(
            payer=payer.public_key,
            owner=payer.public_key,
            mint=mint_keypair.public_key,
        )

        # Mint total supply
        amount = config.total_supply * (10**config.decimals)
        mint_to_ix = mint_to(
            program_id=TOKEN_PROGRAM_ID,
            mint=mint_keypair.public_key,
            dest=PublicKey.find_program_address(
                [
                    bytes(payer.public_key),
                    bytes(TOKEN_PROGRAM_ID),
                    bytes(mint_keypair.public_key),
                ],
                ASSOCIATED_TOKEN_PROGRAM_ID,
            )[0],
            mint_authority=payer.public_key,
            amount=amount,
        )

        # Metadata PDA
        metadata_pda, _ = PublicKey.find_program_address(
            [
                b"metadata",
                bytes(METAPLEX_METADATA_PROGRAM_ID),
                bytes(mint_keypair.public_key),
            ],
            METAPLEX_METADATA_PROGRAM_ID,
        )
        metadata_ix = self._create_metadata_instruction(
            metadata_pda, mint_keypair.public_key, payer.public_key, metadata
        )

        tx = Transaction()
        tx.add(mint_ix)
        tx.add(ata_ix)
        tx.add(mint_to_ix)
        tx.add(metadata_ix)

        sig = self._send_transaction_with_retry(tx, [payer, mint_keypair])
        print(f"Token created: {mint_keypair.public_key}")
        print(f"Transaction: https://solscan.io/tx/{sig}")
        return mint_keypair.public_key


if __name__ == "__main__":
    # Example usage
    payer = Keypair()
    print("A new temporary keypair was created. Fund it with SOL to continue.")
    print("Public key:", payer.public_key)
    print("Private key:", payer.secret_key)
    input("Press Enter after funding the wallet...")

    metadata = TokenMetadata(
        name="ExampleCoin",
        symbol="EXCO",
        uri="https://example.com/metadata.json",
    )
    config = LaunchConfig(total_supply=1_000_000)
    pad = SimpleMainnetLaunchpad(config.rpc_url)
    pad.create_token(payer, metadata, config)
