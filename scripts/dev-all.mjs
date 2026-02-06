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
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';

const shellRepoRoot = process.cwd();
const mfRoot = path.resolve(shellRepoRoot, '..'); // mf-repos/

// Migration note:
// - Under Vite, remotes required `build --watch` + `preview` because `remoteEntry.js` was not reliably served by `vite dev`.
// - Under Webpack Module Federation, `webpack serve` reliably serves `/remoteEntry.js`, so we can run each remote in normal dev mode.
const remotes = [
  { name: 'auth', cwd: path.join(mfRoot, 'shophub-auth'), port: 5174, remoteEntryUrl: 'http://localhost:5174/remoteEntry.js' },
  {
    name: 'catalog',
    cwd: path.join(mfRoot, 'shophub-catalog'),
    port: 5175,
    remoteEntryUrl: 'http://localhost:5175/remoteEntry.js',
  },
  {
    name: 'checkout',
    cwd: path.join(mfRoot, 'shophub-checkout'),
    port: 5176,
    remoteEntryUrl: 'http://localhost:5176/remoteEntry.js',
  },
];

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
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      // Reason: some bundlers may return 200 before the full body is streamed; for our purpose, `ok` is enough.
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return true;
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
const requiredPorts = [5173, 5174, 5175, 5176];
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

process.stderr.write('[dev:all] Starting remote dev servers...\n');
for (const r of remotes) {
  startService({ name: r.name, cwd: r.cwd, command: 'npm', args: ['run', 'dev'] });
}

// Wait for remoteEntry to be served before starting the shell.
for (const r of remotes) {
  // eslint-disable-next-line no-await-in-loop
  await waitForHttpOk(r.remoteEntryUrl).catch((e) => {
    process.stderr.write(`[dev:all] Failed waiting for ${r.name} remoteEntry: ${e.message}\n`);
    shutdown('remoteEntry not reachable');
    process.exit(1);
  });
}

process.stderr.write('[dev:all] Starting shell dev server...\n');
startService({ name: 'shell', cwd: path.join(mfRoot, 'shophub-shell'), command: 'npm', args: ['run', 'dev'] });

