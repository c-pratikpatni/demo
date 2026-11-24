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
