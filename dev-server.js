import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import countHandler from './api/count.js';
import waitlistHandler from './api/waitlist.js';
import healthHandler from './api/health.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number(process.env.PORT || 3000);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function createResAdapter(res) {
  return {
    setHeader(name, value) {
      res.setHeader(name, value);
    },
    status(code) {
      res.statusCode = code;
      return this;
    },
    json(payload) {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      res.end(JSON.stringify(payload));
      return this;
    },
    end(payload) {
      res.end(payload);
      return this;
    }
  };
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

async function serveStatic(pathname, res) {
  const safePath = pathname === '/' ? '/index.html' : pathname;
  const normalized = path.normalize(safePath).replace(/^\.\.(\/|\\|$)/, '/');
  const filePath = path.join(__dirname, normalized);

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
    res.end(data);
  } catch {
    const fallback = path.join(__dirname, 'index.html');
    try {
      const html = await fs.readFile(fallback);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(html);
    } catch {
      res.statusCode = 404;
      res.end('Not found');
    }
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/api/health') {
    const resAdapter = createResAdapter(res);
    await healthHandler(req, resAdapter);
    return;
  }

  if (url.pathname === '/api/count') {
    const resAdapter = createResAdapter(res);
    await countHandler(req, resAdapter);
    return;
  }

  if (url.pathname === '/api/waitlist') {
    const resAdapter = createResAdapter(res);
    if (req.method === 'POST') {
      try {
        req.body = await readJsonBody(req);
      } catch {
        resAdapter.status(400).json({ message: 'Invalid JSON body.' });
        return;
      }
    }
    await waitlistHandler(req, resAdapter);
    return;
  }

  await serveStatic(url.pathname, res);
});

server.listen(port, () => {
  console.log(`PoolIt local preview running on http://localhost:${port}`);
});
