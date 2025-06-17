require('ts-node/register');
const assert = require('assert');
const { estimateBuyTokens, estimateSellReturn } = require('../launch-fun-frontend/lib/bondingCurve.ts');

describe('bondingCurve', () => {
  it('estimates buy tokens correctly', () => {
    assert.strictEqual(estimateBuyTokens(2, 10), 5);
  });

  it('estimates sell return correctly', () => {
    assert.strictEqual(estimateSellReturn(2, 10), 20);
  });
});
