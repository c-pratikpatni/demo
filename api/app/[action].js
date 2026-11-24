const { services } = require('../../lib/services');
const { getFlags } = require('../../lib/state');

module.exports = async (req, res) => {
  const svc = services[req.query.action];
  res.setHeader('Cache-Control', 'no-store');
  if (!svc || req.method !== 'POST') return res.status(404).json({ error: 'not found' });
  const flags = await getFlags();
  await new Promise((r) => setTimeout(r, 400 + Math.random() * 500));
  const result = svc.action(Boolean(flags[req.query.action]), req.body || {});
  res.status(result.ok ? 200 : 503).json(result);
};
