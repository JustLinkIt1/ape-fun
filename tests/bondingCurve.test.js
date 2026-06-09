require('ts-node/register');
const assert = require('assert');
const {
  estimateBuyTokens,
  estimateSellReturn,
  getInitialBondingCurveState,
  estimateBuyTokensWithState,
  shouldGraduate,
} = require('../launch-fun-frontend/lib/bondingCurve.ts');

// The curve is constant-product (x*y=k) with 1% default slippage tolerance,
// so output is slightly below the linear amount/price estimate.

describe('bondingCurve', () => {
  it('estimates buy tokens near the linear estimate, reduced by slippage', () => {
    const linear = 10 / 2; // 5 tokens at price 2
    const tokens = estimateBuyTokens(2, 10);
    assert.ok(tokens > 0, 'should return tokens');
    assert.ok(tokens < linear, 'constant product + slippage yields less than linear');
    assert.ok(tokens > linear * 0.98, 'small trade should be within 2% of linear');
  });

  it('estimates sell return near the linear estimate, reduced by slippage', () => {
    const linear = 10 * 2; // 20 SOL for 10 tokens at price 2
    const sol = estimateSellReturn(2, 10);
    assert.ok(sol > 0, 'should return SOL');
    assert.ok(sol < linear, 'constant product + slippage yields less than linear');
    assert.ok(sol > linear * 0.98, 'small trade should be within 2% of linear');
  });

  it('buys move the price up', () => {
    const state = getInitialBondingCurveState(1_000_000_000);
    const { priceImpact, finalPrice } = estimateBuyTokensWithState(state, 1);
    assert.ok(priceImpact > 0, 'buys should have positive price impact');
    assert.ok(finalPrice > 0);
  });

  it('fresh curves do not graduate', () => {
    const state = getInitialBondingCurveState(1_000_000_000);
    assert.strictEqual(shouldGraduate(state), false);
  });
});
