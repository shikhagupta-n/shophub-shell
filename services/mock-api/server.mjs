/**
 * Mock API service (dev-only).
 *
 * Why this exists:
 * - You asked for "5+ remotes without breaking" AND the ability to add new servers for other purposes.
 * - This server is an example of a non-MFE service that can run alongside MFEs via `npm run dev:all`.
 *
 * Design:
 * - Uses only Node built-ins (no extra deps) for portability and fast boot.
 * - Includes request logging, basic CORS (dev), and safe response headers.
 * - Provides a stable readiness endpoint at `/health`.
 */

import http from 'node:http';
import { randomUUID } from 'node:crypto';
import process from 'node:process';
import { URL } from 'node:url';

const PORT = Number.parseInt(process.env.PORT ?? '4000', 10);

if (!Number.isFinite(PORT) || PORT <= 0) {
  // eslint-disable-next-line no-console
  console.error(`[mock-api] Invalid PORT: ${process.env.PORT}`);
  process.exit(1);
}

/**
 * Minimal structured logger.
 * Reason: easy to grep in a shared terminal (dev:all prefixes stdout anyway).
 */
function log(event, fields = {}) {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ts: new Date().toISOString(), service: 'mock-api', event, ...fields }));
}

function sendJson(res, statusCode, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    // Reason: reduce common browser sniffing pitfalls.
    'x-content-type-options': 'nosniff',
    // Reason: dev-only mock; avoid caching surprises.
    'cache-control': 'no-store',
    ...extraHeaders,
  });
  res.end(payload);
}

function sendText(res, statusCode, text, extraHeaders = {}) {
  res.writeHead(statusCode, {
    'content-type': 'text/plain; charset=utf-8',
    'content-length': Buffer.byteLength(text),
    'x-content-type-options': 'nosniff',
    'cache-control': 'no-store',
    ...extraHeaders,
  });
  res.end(text);
}

function applyCors(req, res) {
  // Reason: allow MFEs on localhost ports to call this service in dev.
  // If you want to lock this down, replace '*' with an allowlist of localhost origins.
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type, x-request-id');
  res.setHeader('access-control-max-age', '600');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }

  return false;
}

async function readJsonBody(req, { maxBytes = 1_000_000 } = {}) {
  // Reason: avoid memory DoS in dev service; limit request size.
  const chunks = [];
  let bytes = 0;

  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > maxBytes) {
      throw new Error('body_too_large');
    }
    chunks.push(chunk);
  }

  if (!chunks.length) return null;
  const raw = Buffer.concat(chunks).toString('utf8');
  return JSON.parse(raw);
}

const server = http.createServer(async (req, res) => {
  const requestId = req.headers['x-request-id']?.toString() ?? randomUUID();
  res.setHeader('x-request-id', requestId);

  const startedAt = Date.now();
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  try {
    if (applyCors(req, res)) {
      log('request', { requestId, method: req.method, path: url.pathname, status: 204, ms: Date.now() - startedAt });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, { ok: true });
      log('request', { requestId, method: req.method, path: url.pathname, status: 200, ms: Date.now() - startedAt });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/time') {
      sendJson(res, 200, { now: new Date().toISOString() });
      log('request', { requestId, method: req.method, path: url.pathname, status: 200, ms: Date.now() - startedAt });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/echo') {
      const body = await readJsonBody(req).catch((e) => {
        if (e?.message === 'body_too_large') return { __error: 'body_too_large' };
        return { __error: 'invalid_json' };
      });

      if (body?.__error) {
        sendJson(res, 400, { error: body.__error });
        log('request', { requestId, method: req.method, path: url.pathname, status: 400, ms: Date.now() - startedAt });
        return;
      }

      sendJson(res, 200, { received: body });
      log('request', { requestId, method: req.method, path: url.pathname, status: 200, ms: Date.now() - startedAt });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/fail-500') {
      // Reason: deterministic 5xx endpoint for frontend error monitoring tests (Zipy, etc.).
      sendJson(res, 500, { error: 'simulated_failure', requestId });
      log('request', { requestId, method: req.method, path: url.pathname, status: 500, ms: Date.now() - startedAt });
      return;
    }

    sendText(res, 404, 'Not Found');
    log('request', { requestId, method: req.method, path: url.pathname, status: 404, ms: Date.now() - startedAt });
  } catch (err) {
    sendJson(res, 500, { error: 'internal_error', requestId });
    log('error', {
      requestId,
      method: req.method,
      path: url.pathname,
      message: err?.message ?? String(err),
      ms: Date.now() - startedAt,
    });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  log('listening', { port: PORT });
});

function shutdown(signal) {
  log('shutdown', { signal });
  server.close(() => process.exit(0));
  // Hard-exit fallback (best-effort).
  setTimeout(() => process.exit(1), 5_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

