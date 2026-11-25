const test = require('node:test');
const assert = require('node:assert');
const { sendMoneyFee, expectedFee } = require('../lib/fees');

test('release 2.3.1: fee is 1.5% of the amount', () => {
  assert.strictEqual(sendMoneyFee(1000, '2.3.1'), 15);
  assert.strictEqual(sendMoneyFee(500, '2.3.1'), 7.5);
});

test('release 2.3.1: fee respects the PHP 5 minimum and PHP 250 maximum', () => {
  assert.strictEqual(sendMoneyFee(100, '2.3.1'), 5);
  assert.strictEqual(sendMoneyFee(50000, '2.3.1'), 250);
});

test('release 2.4.0: fee engine v2 applies the 1.5% policy rate (ISS-4996)', () => {
  assert.strictEqual(sendMoneyFee(500, '2.4.0'), 7.5);
  assert.strictEqual(sendMoneyFee(1000, '2.4.0'), 15);
  assert.strictEqual(sendMoneyFee(10000, '2.4.0'), 150);
});

test('release 2.4.0: fee matches release 2.3.1 and the policy on standard amounts', () => {
  for (const amount of [500, 1000, 5000, 10000]) {
    assert.strictEqual(sendMoneyFee(amount, '2.4.0'), sendMoneyFee(amount, '2.3.1'));
  }
  assert.strictEqual(sendMoneyFee(1000, '2.4.0'), expectedFee(1000));
});

test('release 2.4.0: fee respects the PHP 5 minimum and PHP 250 maximum', () => {
  assert.strictEqual(sendMoneyFee(100, '2.4.0'), 5);
  assert.strictEqual(sendMoneyFee(50000, '2.4.0'), 250);
});
