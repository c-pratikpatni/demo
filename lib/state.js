// Failure flags shared by all serverless functions. Uses Upstash Redis over REST
// when its environment variables are set (Vercel), otherwise process memory (local).

const { BREAKABLE } = require('./services');

const KEY = 'fincash:broken';
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const memory = {};

async function redis(command) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  return (await res.json()).result;
}

async function getFlags() {
  let raw = memory;
  if (url && token) {
    const list = (await redis(['HGETALL', KEY])) || [];
    raw = {};
    for (let i = 0; i < list.length; i += 2) raw[list[i]] = list[i + 1];
  }
  return Object.fromEntries(BREAKABLE.map((id) => [id, raw[id] === '1' || raw[id] === true]));
}

async function setFlag(id, broken) {
  if (!BREAKABLE.includes(id)) throw new Error(`Unknown service ${id}`);
  if (url && token) await redis(['HSET', KEY, id, broken ? '1' : '0']);
  else memory[id] = broken ? '1' : '0';
  return getFlags();
}

const storeName = () => (url && token ? 'upstash-redis' : 'memory');

module.exports = { getFlags, setFlag, storeName };
