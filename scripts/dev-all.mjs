/**
 * Start all MFEs for local development from the shell repo.
 *
 * Reason: you are pushing each MFE into its own repo and not publishing any shared npm package.
 * This script gives a single command (`npm run dev:all`) that runs all 3 remotes + the shell.
 *
 * Notes:
 * - Uses only Node built-ins (no extra dependencies).
 * - On Ctrl+C, it terminates all child processes.
 */

import { spawn } from 'node:child_process';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const shellRepoRoot = process.cwd();
const mfRoot = path.resolve(shellRepoRoot, '..'); // mf-repos/

// IMPORTANT:
// Remotes/services are now config-driven, so you can add 5+ remotes (or non-MFE servers)
// without editing this orchestration script.
const servicesConfigPath = path.join(shellRepoRoot, 'scripts', 'dev-services.mjs');
const { services, shell } = await import(pathToFileURL(servicesConfigPath).toString());

/** @type {Array<{kind?: string, name: string, cwd: string, port?: number, start: {command: string, args: string[]}, readyUrl?: string}>} */
const servicesToStart = services.map((s) => ({
  ...s,
  // Reason: `dev-services.mjs` keeps `cwd` as a repo folder name; make it absolute here.
  cwd: path.join(mfRoot, s.cwd),
}));

const shellService = {
  ...shell,
  cwd: path.join(mfRoot, shell.cwd),
};

/** @type {Array<import('node:child_process').ChildProcess>} */
const children = [];
let isShuttingDown = false;

function prefixLines(name, chunk) {
  const text = chunk.toString();
  // Keep original line breaks; prefix each line for readability in a single terminal.
  return text
    .split(/\r?\n/)
    .map((line) => (line.length ? `[${name}] ${line}` : line))
    .join('\n');
}

function startService({ name, cwd, command, args }) {
  const child = spawn(command, args, {
    cwd,
    shell: true, // best cross-platform for npm on Windows/macOS/Linux
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  children.push(child);

  child.stdout?.on('data', (chunk) => process.stdout.write(prefixLines(name, chunk)));
  child.stderr?.on('data', (chunk) => process.stderr.write(prefixLines(name, chunk)));

  child.on('exit', (code, signal) => {
    const msg = code !== null ? `exit code ${code}` : `signal ${signal}`;
    process.stderr.write(`\n[dev:all] ${name} exited (${msg})\n`);

    // If any service dies unexpectedly, shut everything down to avoid leaving watch processes behind.
    if (!isShuttingDown && code && code !== 0) {
      shutdown(`${name} failed`);
      process.exit(code);
    }
  });

  return child;
}

function isPortInUse(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    socket.once('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}

async function waitForHttpOk(url, { timeoutMs = 60_000, intervalMs = 250 } = {}) {
  const start = Date.now();
  const u = new URL(url);
  const client = u.protocol === 'https:' ? https : http;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      // Reason: avoid relying on global `fetch` (Node version differences); use built-in http/https.
      // eslint-disable-next-line no-await-in-loop
      const ok = await new Promise((resolve) => {
        const req = client.request(
          {
            method: 'GET',
            hostname: u.hostname,
            port: u.port,
            path: `${u.pathname}${u.search}`,
            timeout: 5_000,
            headers: { Connection: 'close' },
          },
          (res) => {
            // Treat any 2xx/3xx as "ready".
            const isOk = res.statusCode && res.statusCode >= 200 && res.statusCode < 400;
            res.resume(); // drain
            resolve(Boolean(isOk));
          },
        );
        req.on('timeout', () => {
          req.destroy(new Error('timeout'));
          resolve(false);
        });
        req.on('error', () => resolve(false));
        req.end();
      });
      if (ok) return true;
    } catch {
      // ignore and retry until timeout
    }

    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out waiting for ${url}`);
    }

    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

function shutdown(reason) {
  isShuttingDown = true;
  process.stderr.write(`\n[dev:all] Shutting down (${reason})...\n`);
  for (const child of children) {
    // Kill the entire child process; npm will cascade to vite.
    try {
      child.kill('SIGINT');
    } catch {
      // ignore
    }
  }
}

process.on('SIGINT', () => {
  shutdown('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
  process.exit(0);
});

// Pre-flight: fail fast if ports are already occupied (usually from a previous `dev:all` run).
const requiredPorts = [
  shellService.port,
  ...servicesToStart.map((s) => s.port).filter((p) => typeof p === 'number'),
].filter(Boolean);
const inUse = [];
for (const p of requiredPorts) {
  // eslint-disable-next-line no-await-in-loop
  if (await isPortInUse(p)) inUse.push(p);
}
if (inUse.length) {
  process.stderr.write(
    `[dev:all] Ports already in use: ${inUse.join(', ')}. Stop the existing servers (Ctrl+C) and re-run.\n`,
  );
  process.exit(1);
}

process.stderr.write('[dev:all] Starting configured dev services...\n');
for (const s of servicesToStart) {
  startService({ name: s.name, cwd: s.cwd, command: s.start.command, args: s.start.args });
}

// Wait for readiness checks before starting the shell.
for (const s of servicesToStart) {
  if (!s.readyUrl) continue;
  // eslint-disable-next-line no-await-in-loop
  await waitForHttpOk(s.readyUrl).catch((e) => {
    process.stderr.write(`[dev:all] Failed waiting for ${s.name} readiness: ${e.message}\n`);
    shutdown('service not reachable');
    process.exit(1);
  });
}

process.stderr.write('[dev:all] Starting shell dev server...\n');
startService({
  name: shellService.name,
  cwd: shellService.cwd,
  command: shellService.start.command,
  args: shellService.start.args,
});

