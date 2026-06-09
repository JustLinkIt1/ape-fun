"""Commit-or-Burn vault — on-chain anti-rug commitments.

Devs lock a fraction of their allocation at launch (Builder/Diamond tiers).
Diamond devs additionally publish 3 hashed milestones; the community votes
on completion. Failure burns 50% of the remaining locked tokens and sends
50% to the voters who called it.
"""

import hashlib
from dataclasses import dataclass, field
from enum import Enum

from solders.pubkey import Pubkey

COMMITMENT_VAULT_SEED = b"commitment_vault"

# TODO: replace with the deployed ApeStation program id
APESTATION_PROGRAM_ID = Pubkey.from_string("11111111111111111111111111111111")

MILESTONE_FAIL_BURN_RATIO = 0.5      # burn half; other half to voters
MILESTONE_VOTE_WINDOW_DAYS = 7


class Tier(Enum):
    DEGEN = "degen"
    BUILDER = "builder"
    DIAMOND = "diamond"


TIER_LOCK_RATIO = {Tier.DEGEN: 0.0, Tier.BUILDER: 0.10, Tier.DIAMOND: 0.25}
TIER_LOCK_DAYS = {Tier.DEGEN: 0, Tier.BUILDER: 7, Tier.DIAMOND: 30}


class MilestoneStatus(Enum):
    PENDING = "pending"
    VOTING = "voting"
    PASSED = "passed"
    FAILED = "failed"


@dataclass
class Milestone:
    index: int
    commitment_hash: str        # sha256(description) stored on-chain at launch
    due_unix: int
    status: MilestoneStatus = MilestoneStatus.PENDING
    votes_yes: int = 0
    votes_no: int = 0

    @property
    def passed(self) -> bool:
        total = self.votes_yes + self.votes_no
        return total > 0 and self.votes_yes / total > 0.5


@dataclass
class CommitmentVault:
    mint: Pubkey
    dev: Pubkey
    tier: Tier
    locked_amount: int          # token base units
    lock_end_unix: int
    milestones: list[Milestone] = field(default_factory=list)


def hash_milestone(description: str) -> str:
    return hashlib.sha256(description.encode()).hexdigest()


def derive_commitment_vault(mint: Pubkey) -> Pubkey:
    address, _bump = Pubkey.find_program_address(
        [COMMITMENT_VAULT_SEED, bytes(mint)], APESTATION_PROGRAM_ID
    )
    return address


def lock_commitment(vault: CommitmentVault) -> str:
    """Lock dev tokens into the vault PDA at launch.

    TODO: transfer locked_amount from the dev ATA into the vault PDA and
    write the milestone hashes to the vault account. Returns tx signature.
    """
    raise NotImplementedError("chain integration pending")


def resolve_milestone(vault: CommitmentVault, milestone: Milestone) -> str:
    """Settle a milestone after its voting window closes.

    Pass  -> unlock the Diamond fee-share bonus for the dev.
    Fail  -> burn MILESTONE_FAIL_BURN_RATIO of remaining locked tokens,
             distribute the rest pro-rata to correct voters.

    TODO: build and send the settlement transaction. Returns tx signature.
    """
    if milestone.passed:
        milestone.status = MilestoneStatus.PASSED
    else:
        milestone.status = MilestoneStatus.FAILED
    raise NotImplementedError("chain integration pending")


def release_lock(vault: CommitmentVault) -> str:
    """Return remaining locked tokens to the dev after lock_end_unix.

    TODO: verify clock > lock_end_unix and all milestones settled, then
    transfer the remaining balance back to the dev ATA.
    """
    raise NotImplementedError("chain integration pending")
