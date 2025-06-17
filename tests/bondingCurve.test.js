const assert = require('assert')
const { calculateTokensForSol, DEFAULT_SOL_RESERVE } = require('./tmp/bondingCurve')

function simulateCreate(initialBuy) {
  const supply = 1000
  const tokensFromBuy = initialBuy > 0 ? Math.floor(calculateTokensForSol(initialBuy, supply, DEFAULT_SOL_RESERVE)) : 0
  const creatorBalance = tokensFromBuy
  return creatorBalance
}

assert.strictEqual(simulateCreate(0), 0)
const expected = Math.floor(calculateTokensForSol(1, 1000, DEFAULT_SOL_RESERVE))
assert.strictEqual(simulateCreate(1), expected)
console.log('All tests passed')
