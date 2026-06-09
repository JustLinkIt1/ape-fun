"""ApeStation fee model — Clanker-style three-way fee splits.

Every trade on the bonding curve pays a 1% fee split between the platform
treasury, the token creator, and the requestor (the agent or referrer that
initiated the launch). After Raydium graduation the LP fee is split the same
three ways. Fees accumulate in a per-token FeeVault PDA and are claimable
at any time by the creator and requestor.
"""

from dataclasses import dataclass

from solders.pubkey import Pubkey

# --- Fee constants (keep in sync with launch-fun-frontend/lib/constants.ts) ---

CREATION_FEE_LAMPORTS = 20_000_000          # 0.02 SOL flat, 100% treasury

TRADE_FEE_BPS = 100                          # 1% on bonding-curve buys/sells
TREASURY_SHARE = 0.50
CREATOR_SHARE = 0.30
REQUESTOR_SHARE = 0.20

RAYDIUM_LP_FEE_BPS = 25                      # 0.25% per swap post-graduation
RAYDIUM_TREASURY_SHARE = 0.60
RAYDIUM_CREATOR_SHARE = 0.28
RAYDIUM_REQUESTOR_SHARE = 0.12

# Diamond-tier devs earn +10% on their creator share once milestones pass
DIAMOND_FEE_SHARE_BONUS = 0.10

# 10% of all platform fees pool into the seasonal treasury
SEASON_TREASURY_RATIO = 0.10

FEE_VAULT_SEED = b"fee_vault"

# TODO: replace with the deployed ApeStation program id
APESTATION_PROGRAM_ID = Pubkey.from_string("11111111111111111111111111111111")


@dataclass
class FeeSplit:
    treasury: int
    creator: int
    requestor: int

    @property
    def total(self) -> int:
        return self.treasury + self.creator + self.requestor


def derive_fee_vault(mint: Pubkey) -> Pubkey:
    """FeeVault PDA: ["fee_vault", token_mint]."""
    address, _bump = Pubkey.find_program_address(
        [FEE_VAULT_SEED, bytes(mint)], APESTATION_PROGRAM_ID
    )
    return address


def trade_fee_lamports(trade_lamports: int) -> int:
    """Total fee charged on a bonding-curve trade."""
    return trade_lamports * TRADE_FEE_BPS // 10_000


def split_trade_fee(trade_lamports: int, diamond_bonus: bool = False) -> FeeSplit:
    """Split a bonding-curve trade fee between treasury/creator/requestor.

    diamond_bonus moves 10% of the creator share's worth from treasury to
    creator once a Diamond milestone has passed.
    """
    fee = trade_fee_lamports(trade_lamports)
    creator_share = CREATOR_SHARE
    treasury_share = TREASURY_SHARE
    if diamond_bonus:
        bonus = CREATOR_SHARE * DIAMOND_FEE_SHARE_BONUS
        creator_share += bonus
        treasury_share -= bonus

    creator = int(fee * creator_share)
    requestor = int(fee * REQUESTOR_SHARE)
    treasury = fee - creator - requestor  # remainder avoids rounding dust
    return FeeSplit(treasury=treasury, creator=creator, requestor=requestor)


def split_lp_fee(swap_lamports: int) -> FeeSplit:
    """Split the Raydium LP fee captured post-graduation."""
    fee = swap_lamports * RAYDIUM_LP_FEE_BPS // 10_000
    creator = int(fee * RAYDIUM_CREATOR_SHARE)
    requestor = int(fee * RAYDIUM_REQUESTOR_SHARE)
    treasury = fee - creator - requestor
    return FeeSplit(treasury=treasury, creator=creator, requestor=requestor)


def collect_trade_fee(mint: Pubkey, trade_lamports: int, diamond_bonus: bool = False) -> FeeSplit:
    """Record a trade fee into the token's FeeVault.

    TODO: build and send the on-chain transfer into the FeeVault PDA,
    crediting claimable balances for creator and requestor.
    """
    split = split_trade_fee(trade_lamports, diamond_bonus)
    vault = derive_fee_vault(mint)
    print(f"[fee_model] vault={vault} treasury={split.treasury} "
          f"creator={split.creator} requestor={split.requestor}")
    return split


def claim_fees(mint: Pubkey, claimant: Pubkey) -> int:
    """Claim accrued fees for the creator or requestor of a token.

    TODO: verify claimant is the registered creator/requestor for the mint,
    transfer claimable lamports out of the FeeVault PDA, zero the balance.
    Returns lamports claimed.
    """
    raise NotImplementedError("chain integration pending")
