const test = require('node:test');
const assert = require('node:assert');
const { sendMoneyFee } = require('../lib/fees');

test('release 2.3.1: fee is 1.5% of the amount', () => {
  assert.strictEqual(sendMoneyFee(1000, '2.3.1'), 15);
  assert.strictEqual(sendMoneyFee(500, '2.3.1'), 7.5);
});

test('release 2.3.1: fee respects the PHP 5 minimum and PHP 250 maximum', () => {
  assert.strictEqual(sendMoneyFee(100, '2.3.1'), 5);
  assert.strictEqual(sendMoneyFee(50000, '2.3.1'), 250);
});

test('release 2.4.0 (fee engine v2): fee is 1.5% of the amount, not 15%', () => {
  assert.strictEqual(sendMoneyFee(1000, '2.4.0'), 15);
  assert.strictEqual(sendMoneyFee(500, '2.4.0'), 7.5);
});

test('release 2.4.0 (fee engine v2): fee respects the PHP 5 minimum and PHP 250 maximum', () => {
  assert.strictEqual(sendMoneyFee(0.01, '2.4.0'), 5);
  assert.strictEqual(sendMoneyFee(100, '2.4.0'), 5);
  assert.strictEqual(sendMoneyFee(50000, '2.4.0'), 250);
});

test('release 2.4.0 matches release 2.3.1 within the PHP 0.25 rounding step', () => {
  for (let amount = 100; amount <= 20000; amount += 199.37) {
    const v1 = sendMoneyFee(amount, '2.3.1');
    const v2 = sendMoneyFee(amount, '2.4.0');
    // v2 rounds up to the next 0.25; v1 rounds to the nearest centavo.
    assert.ok(v2 >= v1 && v2 - v1 <= 0.26, `amount ${amount}: v1=${v1} v2=${v2}`);
  }
});

test('sendmoney health check passes on release 2.4.0 (no FEE_POLICY_VIOLATION)', () => {
  const { services } = require('../lib/services');
  const h = services.sendmoney.health(true);
  assert.strictEqual(h.status, 200);
  assert.strictEqual(h.body.release, '2.4.0');
  assert.strictEqual(h.body.error, undefined);
});
