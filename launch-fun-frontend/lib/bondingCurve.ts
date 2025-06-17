export const DEFAULT_SOL_RESERVE = 1

// Calculate current price of token in SOL using constant product formula
export function calculatePrice(tokenReserve: number, solReserve: number): number {
  if (tokenReserve === 0) return 0
  return solReserve / tokenReserve
}

// Calculate how many tokens are minted/bought for given SOL amount
export function calculateTokensForSol(
  solAmount: number,
  tokenReserve: number,
  solReserve: number
): number {
  const k = tokenReserve * solReserve
  const newSolReserve = solReserve + solAmount
  const newTokenReserve = k / newSolReserve
  return tokenReserve - newTokenReserve
}

// Calculate how much SOL you receive for selling a given token amount
export function calculateSolForTokens(
  tokenAmount: number,
  tokenReserve: number,
  solReserve: number
): number {
  const k = tokenReserve * solReserve
  const newTokenReserve = tokenReserve + tokenAmount
  const newSolReserve = k / newTokenReserve
  return solReserve - newSolReserve
}
