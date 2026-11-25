// Send Money fee calculation. Policy: 1.5% of the amount, minimum PHP 5, maximum PHP 250.
//
// Release 2.3.1 uses the original calculator. Release 2.4.0 introduced the new fee
// engine (computeFeeV2) with tiered rounding for partner wallets.

const FEE_RATE = 0.015;
const FEE_MIN = 5;
const FEE_MAX = 250;

const round2 = (n) => Math.round(n * 100) / 100;
const clamp = (n) => Math.min(FEE_MAX, Math.max(FEE_MIN, n));

function computeFeeV1(amount) {
  return round2(clamp(amount * FEE_RATE));
}

// Fee engine v2 (release 2.4.0): same policy, rounds up to the next 25 centavos
// to match partner wallet settlement.
function computeFeeV2(amount) {
  const raw = clamp(amount * FEE_RATE);
  return Math.ceil(raw * 4) / 4;
}

function sendMoneyFee(amount, release) {
  return release === '2.4.0' ? computeFeeV2(amount) : computeFeeV1(amount);
}

// What the policy says the fee should be, used by the health check.
const expectedFee = (amount) => computeFeeV1(amount);

module.exports = { sendMoneyFee, expectedFee, computeFeeV1, computeFeeV2, FEE_RATE, FEE_MIN, FEE_MAX };
