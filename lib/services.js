// FinCash services as the hosted app exposes them: health checks for the monitor
// and customer actions for the app screens. Both depend on the failure flags.
// For Send Money the flag means "release 2.4.0 is deployed" (the new fee engine).

const { sendMoneyFee, expectedFee } = require('./fees');

const jitter = (base, pct = 0.08) => Math.round(base * (1 + (Math.random() * 2 - 1) * pct));
const round1 = (n) => Math.round(n * 10) / 10;

const services = {
  buyload: {
    name: 'BuyLoad',
    health(broken) {
      if (!broken) return { status: 200, body: { status: 'ok', service: 'buyload', rpm: jitter(1450), error_rate: round1(0.1 + Math.random() * 0.3), p95_ms: jitter(320), synthetic: '5/5 PASS' } };
      return {
        status: 503,
        body: {
          status: 'down', service: 'buyload', rpm: jitter(1380), error_rate: 100, p95_ms: jitter(45),
          synthetic: '0/5 PASS', flag: 'buyload_service_enabled=false',
          error: 'BUYLOAD_DISABLED: service flag buyload_service_enabled=false',
        },
      };
    },
    action(broken, input) {
      if (broken) return { ok: false, code: 'BUYLOAD_DISABLED', message: 'Buy Load is temporarily unavailable. Please try again in a few minutes.' };
      return { ok: true, message: `₱${input.amount || 100} ${input.promo || 'Regular Load'} sent to ${input.number || 'your number'} (${input.network || 'Globe'}).` };
    },
  },

  otp: {
    name: 'OTP Service',
    health(broken) {
      if (!broken) return { status: 200, body: { status: 'ok', service: 'otp', rpm: jitter(2300), error_rate: round1(0.4 + Math.random() * 0.6), p95_ms: jitter(4200), delivery_rate: '99.2%' } };
      return {
        status: 503,
        body: {
          status: 'degraded', service: 'otp', rpm: jitter(2450), error_rate: round1(21 + Math.random() * 2), p95_ms: jitter(72000),
          delivery_rate: '78%', carrier_globe: '503 intermittent', carrier_smart: 'normal',
          error: 'SMS_GATEWAY_UNAVAILABLE: carrier=globe upstream=503',
        },
      };
    },
    action(broken, input) {
      if (broken && (input.network || 'Globe') === 'Globe') return { ok: false, code: 'OTP_NOT_SENT', message: "We couldn't send your one-time PIN. Please wait a moment and try again." };
      return { ok: true, message: 'One-time PIN sent.', otp: '482913' };
    },
  },

  banktransfer: {
    name: 'Bank Transfer',
    health(broken) {
      if (!broken) return { status: 200, body: { status: 'ok', service: 'banktransfer', rpm: jitter(640), error_rate: round1(0.2 + Math.random() * 0.4), p95_ms: jitter(1400), success_rate: '99.6%' } };
      return {
        status: 504,
        body: {
          status: 'degraded', service: 'banktransfer', rpm: jitter(610), error_rate: round1(28 + Math.random() * 3), p95_ms: jitter(31000),
          success_rate: '71%', rails: 'InstaPay, PESONet',
          error: 'UPSTREAM_TIMEOUT: bancnet instapay/pesonet > 30s',
        },
      };
    },
    action(broken, input) {
      if (broken) return { ok: false, code: 'TRANSFER_PENDING', message: 'Your transfer is taking longer than usual. Status: PENDING. We will notify you once it completes.' };
      return { ok: true, message: `₱${input.amount || '1,000'} sent to ${input.bank || 'BPI'} via InstaPay.`, ref: 'FC' + Date.now().toString().slice(-8) };
    },
  },

  sendmoney: {
    name: 'Send Money',
    // Business check: the fee charged on a PHP 1,000 probe must match the fee policy.
    health(release240) {
      const release = release240 ? '2.4.0' : '2.3.1';
      const probe = 1000, fee = sendMoneyFee(probe, release), expected = expectedFee(probe);
      const base = { service: 'sendmoney', release, rpm: jitter(3100), p95_ms: jitter(260), fee_probe: `PHP ${fee.toFixed(2)} on PHP ${probe.toFixed(2)}`, fee_expected: `PHP ${expected.toFixed(2)}` };
      if (fee === expected) return { status: 200, body: { status: 'ok', ...base, error_rate: round1(0.1 + Math.random() * 0.2) } };
      return {
        status: 500,
        body: {
          status: 'policy_violation', ...base, canary: '20% of users', error_rate: round1(19 + Math.random() * 2),
          error: `FEE_POLICY_VIOLATION: fee ${fee.toFixed(2)} on ${probe.toFixed(2)} (policy ${expected.toFixed(2)}) release=${release}`,
        },
      };
    },
    action(release240, input) {
      const amount = Number(String(input.amount || 500).replace(/[^\d.]/g, '')) || 0;
      const fee = sendMoneyFee(amount, release240 ? '2.4.0' : '2.3.1');
      return { ok: true, message: `₱${amount.toFixed(2)} sent to ${input.name || input.number || 'recipient'}.`, amount, fee, total: Math.round((amount + fee) * 100) / 100, ref: 'FC' + Date.now().toString().slice(-8) };
    },
  },
};

// Only these can be switched from the chaos controls.
const BREAKABLE = ['buyload', 'otp', 'banktransfer', 'sendmoney'];

module.exports = { services, BREAKABLE };
