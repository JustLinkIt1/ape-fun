export function estimateBuyTokens(price: number, solAmount: number): number {
  if (price <= 0 || solAmount <= 0) return 0
  // Placeholder bonding curve logic - simple proportional price
  return solAmount / price
}

export function estimateSellReturn(price: number, tokenAmount: number): number {
  if (price <= 0 || tokenAmount <= 0) return 0
  // Placeholder bonding curve logic - simple proportional price
  return tokenAmount * price
}
