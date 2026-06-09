"""ApeStation bonding curve — constant-product curve with social multipliers.

Mirrors launch-fun-frontend/lib/bondingCurve.ts, plus the Social Bonding
Curve mechanic: verified Twitter/Telegram traction lowers the effective
graduation target so real communities reach Raydium sooner.
"""

from dataclasses import dataclass

INITIAL_TOKEN_RESERVE_RATIO = 0.8   # 80% of supply on the curve
INITIAL_SOL_RESERVE = 0.1
MIN_SOL_RESERVE = 0.01

BASE_GRADUATION_MARKET_CAP = 69_000  # USD, before social multiplier

# Social multiplier bounds (see lib/socialMultiplier.ts)
MIN_MULTIPLIER = 1.0
MAX_MULTIPLIER = 2.0

# Weights for the social signal
W_TWITTER_GROWTH = 0.3
W_TELEGRAM = 0.4
W_ENGAGEMENT = 0.3

TWITTER_GROWTH_CAP = 5_000
TELEGRAM_MEMBERS_CAP = 10_000
ENGAGEMENT_RATE_CAP = 0.1


@dataclass
class CurveState:
    token_reserve: float
    sol_reserve: float
    total_supply: float

    @property
    def k(self) -> float:
        return self.token_reserve * self.sol_reserve

    @property
    def price(self) -> float:
        if self.token_reserve <= 0:
            return 0.0
        return self.sol_reserve / self.token_reserve

    @property
    def market_cap(self) -> float:
        return self.price * self.total_supply


def initial_state(total_supply: float) -> CurveState:
    return CurveState(
        token_reserve=total_supply * INITIAL_TOKEN_RESERVE_RATIO,
        sol_reserve=INITIAL_SOL_RESERVE,
        total_supply=total_supply,
    )


def quote_buy(state: CurveState, sol_in: float) -> float:
    """Tokens out for sol_in (before fees)."""
    if sol_in <= 0 or state.token_reserve <= 0:
        return 0.0
    new_sol = state.sol_reserve + sol_in
    new_tokens = state.k / new_sol
    return state.token_reserve - new_tokens


def quote_sell(state: CurveState, tokens_in: float) -> float:
    """SOL out for tokens_in (before fees). 0 if it would drain the reserve."""
    if tokens_in <= 0:
        return 0.0
    new_tokens = state.token_reserve + tokens_in
    new_sol = state.k / new_tokens
    if new_sol < MIN_SOL_RESERVE:
        return 0.0
    return state.sol_reserve - new_sol


def apply_buy(state: CurveState, sol_in: float, tokens_out: float) -> CurveState:
    return CurveState(
        token_reserve=state.token_reserve - tokens_out,
        sol_reserve=state.sol_reserve + sol_in,
        total_supply=state.total_supply,
    )


def apply_sell(state: CurveState, tokens_in: float, sol_out: float) -> CurveState:
    return CurveState(
        token_reserve=state.token_reserve + tokens_in,
        sol_reserve=state.sol_reserve - sol_out,
        total_supply=state.total_supply,
    )


def social_multiplier(
    twitter_followers_gained_24h: int,
    telegram_members: int,
    twitter_engagement_rate: float,
) -> float:
    """Boost from verified social traction, clamped to [1.0, 2.0]."""
    growth = min(twitter_followers_gained_24h / TWITTER_GROWTH_CAP, 1.0)
    telegram = min(telegram_members / TELEGRAM_MEMBERS_CAP, 1.0)
    engagement = min(twitter_engagement_rate / ENGAGEMENT_RATE_CAP, 1.0)

    signal = (
        growth * W_TWITTER_GROWTH
        + telegram * W_TELEGRAM
        + engagement * W_ENGAGEMENT
    )
    return MIN_MULTIPLIER + signal * (MAX_MULTIPLIER - MIN_MULTIPLIER)


def graduation_target(multiplier: float = MIN_MULTIPLIER) -> float:
    """Effective market cap required to graduate to Raydium."""
    return BASE_GRADUATION_MARKET_CAP / multiplier


def should_graduate(state: CurveState, multiplier: float = MIN_MULTIPLIER) -> bool:
    return state.market_cap >= graduation_target(multiplier)


def graduation_progress(state: CurveState, multiplier: float = MIN_MULTIPLIER) -> float:
    """0-100 progress toward graduation, social-adjusted."""
    return min(state.market_cap / graduation_target(multiplier) * 100, 100.0)
