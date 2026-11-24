// Break or restore a service. Only callable with the shared ADMIN_KEY,
// which lives in the Vercel environment and in Sentinel's local .env.local.

const crypto = require('node:crypto');
const { getFlags, setFlag, storeName } = require('../../lib/state');

const keyMatches = (given) => {
  const expected = process.env.ADMIN_KEY || '';
  if (!expected || typeof given !== 'string' || given.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!keyMatches(req.headers['x-admin-key'])) return res.status(401).json({ error: 'unauthorized' });
  if (req.method === 'GET') return res.status(200).json({ flags: await getFlags(), store: storeName() });
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  const { service, broken } = req.body || {};
  try {
    res.status(200).json({ flags: await setFlag(service, Boolean(broken)), store: storeName() });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
