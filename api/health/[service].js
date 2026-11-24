const { services } = require('../../lib/services');
const { getFlags } = require('../../lib/state');

module.exports = async (req, res) => {
  const svc = services[req.query.service];
  res.setHeader('Cache-Control', 'no-store');
  if (!svc) return res.status(404).json({ error: 'unknown service' });
  const flags = await getFlags();
  const h = svc.health(Boolean(flags[req.query.service]));
  res.status(h.status).json({ ...h.body, checked_at: new Date().toISOString() });
};
