// Public service status for the in-app banner. Based on each service's actual health
// (so a fixed bug shows as healthy even if its release switch is still on).

const { services } = require('../lib/services');
const { getFlags } = require('../lib/state');

const MESSAGES = {
  buyload: 'Buy Load is temporarily unavailable. Our team is already working on it.',
  otp: 'Some Globe users may receive their one-time PIN late. We are on it.',
  banktransfer: 'Bank transfers via InstaPay and PESONet may be delayed. Your money is safe.',
  sendmoney: 'We are reviewing Send Money transfer fees. Any incorrect fee will be refunded automatically.',
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const flags = await getFlags();
  const issues = Object.entries(services)
    .filter(([id, svc]) => svc.health(Boolean(flags[id])).status !== 200)
    .map(([id, svc]) => ({ service: id, name: svc.name, message: MESSAGES[id] || `${svc.name} is experiencing issues.` }));
  res.status(200).json({ ok: issues.length === 0, issues, checked_at: new Date().toISOString() });
};
