"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SOL_RESERVE = void 0;
exports.calculatePrice = calculatePrice;
exports.calculateTokensForSol = calculateTokensForSol;
exports.calculateSolForTokens = calculateSolForTokens;
exports.DEFAULT_SOL_RESERVE = 1;
// Calculate current price of token in SOL using constant product formula
function calculatePrice(tokenReserve, solReserve) {
    if (tokenReserve === 0)
        return 0;
    return solReserve / tokenReserve;
}
// Calculate how many tokens are minted/bought for given SOL amount
function calculateTokensForSol(solAmount, tokenReserve, solReserve) {
    const k = tokenReserve * solReserve;
    const newSolReserve = solReserve + solAmount;
    const newTokenReserve = k / newSolReserve;
    return tokenReserve - newTokenReserve;
}
// Calculate how much SOL you receive for selling a given token amount
function calculateSolForTokens(tokenAmount, tokenReserve, solReserve) {
    const k = tokenReserve * solReserve;
    const newTokenReserve = tokenReserve + tokenAmount;
    const newSolReserve = k / newTokenReserve;
    return solReserve - newSolReserve;
}
