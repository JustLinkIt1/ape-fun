// Bonding curve implementation using constant product formula (x * y = k)
// This creates a price curve where price increases as supply decreases

interface BondingCurveState {
  tokenReserve: number  // Tokens in the bonding curve
  solReserve: number    // SOL in the bonding curve
  totalSupply: number   // Total token supply
}

// Initial liquidity settings
const INITIAL_TOKEN_RESERVE_RATIO = 0.8  // 80% of supply goes to bonding curve
const INITIAL_SOL_RESERVE = 0.1         // Start with 0.1 SOL in the curve (lower initial price)
const MIN_SOL_RESERVE = 0.01            // Minimum SOL to maintain liquidity

export function getInitialBondingCurveState(totalSupply: number): BondingCurveState {
  return {
    tokenReserve: totalSupply * INITIAL_TOKEN_RESERVE_RATIO,
    solReserve: INITIAL_SOL_RESERVE,
    totalSupply: totalSupply
  }
}

// Calculate constant k for the curve
function getConstant(state: BondingCurveState): number {
  return state.tokenReserve * state.solReserve
}

// Get current token price in SOL
export function getCurrentPrice(state: BondingCurveState): number {
  if (state.tokenReserve <= 0) return 0
  return state.solReserve / state.tokenReserve
}

// Estimate tokens received for a given SOL amount (buy)
export function estimateBuyTokensWithState(
  state: BondingCurveState,
  solAmount: number,
  slippageBps: number = 100 // 1% default slippage
): { tokensOut: number, priceImpact: number, finalPrice: number } {
  if (solAmount <= 0 || state.tokenReserve <= 0) {
    return { tokensOut: 0, priceImpact: 0, finalPrice: 0 }
  }

  const k = getConstant(state)
  const newSolReserve = state.solReserve + solAmount
  const newTokenReserve = k / newSolReserve
  const tokensOut = state.tokenReserve - newTokenReserve
  
  // Apply slippage tolerance
  const minTokensOut = tokensOut * (1 - slippageBps / 10000)
  
  // Calculate price impact
  const initialPrice = getCurrentPrice(state)
  const finalPrice = newSolReserve / newTokenReserve
  const priceImpact = ((finalPrice - initialPrice) / initialPrice) * 100
  
  return {
    tokensOut: minTokensOut,
    priceImpact,
    finalPrice
  }
}

// Estimate SOL received for selling tokens
export function estimateSellReturnWithState(
  state: BondingCurveState,
  tokenAmount: number,
  slippageBps: number = 100 // 1% default slippage
): { solOut: number, priceImpact: number, finalPrice: number } {
  if (tokenAmount <= 0 || state.solReserve <= MIN_SOL_RESERVE) {
    return { solOut: 0, priceImpact: 0, finalPrice: 0 }
  }

  const k = getConstant(state)
  const newTokenReserve = state.tokenReserve + tokenAmount
  const newSolReserve = k / newTokenReserve
  
  // Ensure minimum SOL reserve is maintained
  if (newSolReserve < MIN_SOL_RESERVE) {
    return { solOut: 0, priceImpact: 0, finalPrice: 0 }
  }
  
  const solOut = state.solReserve - newSolReserve
  
  // Apply slippage tolerance
  const minSolOut = solOut * (1 - slippageBps / 10000)
  
  // Calculate price impact
  const initialPrice = getCurrentPrice(state)
  const finalPrice = newSolReserve / newTokenReserve
  const priceImpact = ((initialPrice - finalPrice) / initialPrice) * 100
  
  return {
    solOut: minSolOut,
    priceImpact,
    finalPrice
  }
}

// Update state after a buy
export function applyBuy(state: BondingCurveState, solAmount: number, tokensOut: number): BondingCurveState {
  return {
    ...state,
    solReserve: state.solReserve + solAmount,
    tokenReserve: state.tokenReserve - tokensOut
  }
}

// Update state after a sell
export function applySell(state: BondingCurveState, tokenAmount: number, solOut: number): BondingCurveState {
  return {
    ...state,
    solReserve: state.solReserve - solOut,
    tokenReserve: state.tokenReserve + tokenAmount
  }
}

// Calculate market cap based on current price
export function getMarketCap(state: BondingCurveState): number {
  const price = getCurrentPrice(state)
  return price * state.totalSupply
}

// Check if bonding curve should graduate to Raydium
export function shouldGraduate(state: BondingCurveState, targetMarketCap: number = 69000): boolean {
  return getMarketCap(state) >= targetMarketCap
}

// Legacy functions for backward compatibility
export function estimateBuyTokens(price: number, solAmount: number): number {
  // Create a dummy state based on price
  const tokenReserve = 1000000
  const solReserve = price * tokenReserve
  const state = { tokenReserve, solReserve, totalSupply: tokenReserve }
  return estimateBuyTokensWithState(state, solAmount).tokensOut
}

export function estimateSellReturn(price: number, tokenAmount: number): number {
  // Create a dummy state based on price
  const tokenReserve = 1000000
  const solReserve = price * tokenReserve
  const state = { tokenReserve, solReserve, totalSupply: tokenReserve }
  return estimateSellReturnWithState(state, tokenAmount).solOut
}
