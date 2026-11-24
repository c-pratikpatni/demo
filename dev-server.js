// Runs the Vercel app on localhost with in-memory failure flags, for rehearsal
// and as an offline fallback. Same handlers as production, with a tiny req/res shim.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT || 4300);
process.env.ADMIN_KEY = process.env.ADMIN_KEY || 'local-demo-key';

const routes = [
  { re: /^\/api\/health\/([\w-]+)$/, param: 'service', handler: require('./api/health/[service].js') },
  { re: /^\/api\/app\/([\w-]+)$/, param: 'action', handler: require('./api/app/[action].js') },
  { re: /^\/api\/admin\/state$/, handler: require('./api/admin/state.js') },
];
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => (data += c));
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
  });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  for (const r of routes) {
    const m = url.pathname.match(r.re);
    if (!m) continue;
    req.query = { ...Object.fromEntries(url.searchParams), ...(r.param ? { [r.param]: m[1] } : {}) };
    req.body = req.method === 'POST' ? await readBody(req) : undefined;
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (obj) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); };
    return r.handler(req, res);
  }
  const file = path.join(__dirname, 'public', url.pathname === '/' ? 'index.html' : url.pathname);
  if (!file.startsWith(path.join(__dirname, 'public'))) { res.statusCode = 403; return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.statusCode = 404; return res.end('not found'); }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
}).listen(PORT, () => console.log(`FinCash app (local) http://localhost:${PORT}  admin key: ${process.env.ADMIN_KEY === 'local-demo-key' ? 'local-demo-key' : '(from env)'}`));
