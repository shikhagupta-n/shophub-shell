/**
 * Centralized dev services config for `npm run dev:all`.
 *
 * Goal:
 * - Support 5+ remotes without constantly editing `dev-all.mjs`.
 * - Allow starting additional non-federated servers (API, mocks, jobs) alongside MFEs.
 *
 * How to add a new Module Federation remote:
 * - Add an entry with:
 *   - kind: 'remote'
 *   - name: <remote scope used in imports, e.g. `search` for `import('search/Foo')`>
 *   - cwd: <repo folder name under the monorepo root>
 *   - port: <local port>
 *   - start: usually `npm run dev`
 *   - readyUrl: `http://localhost:<port>/remoteEntry.js`
 *
 * How to add a non-MFE server:
 * - Add an entry with:
 *   - kind: 'service'
 *   - readyUrl: a cheap health/ready endpoint (or home page) that returns 2xx
 */

const services = [];

// Optional non-MFE server example: mock API (health + stub endpoints).
// Reason: lets you add "other purpose" servers without impacting remotes.
// Default: OFF (so your dev:all behavior remains "MFEs only" unless explicitly enabled).
if (process.env.SHOPHUB_ENABLE_MOCK_API === 'true') {
  services.push({
    kind: 'service',
    name: 'mock-api',
    // IMPORTANT: this service lives inside the shell repo.
    // Reason: keeps it close to the orchestration script; you can split it into its own repo later.
    cwd: 'shophub-shell',
    port: 4000,
    start: { command: 'npm', args: ['run', 'dev:mock-api'] },
    readyUrl: 'http://localhost:4000/health',
  });
}

services.push(
  {
    kind: 'remote',
    name: 'auth',
    cwd: 'shophub-auth',
    port: 5174,
    start: { command: 'npm', args: ['run', 'dev'] },
    readyUrl: 'http://localhost:5174/remoteEntry.js',
  },
  {
    kind: 'remote',
    name: 'catalog',
    cwd: 'shophub-catalog',
    port: 5175,
    start: { command: 'npm', args: ['run', 'dev'] },
    readyUrl: 'http://localhost:5175/remoteEntry.js',
  },
  {
    kind: 'remote',
    name: 'checkout',
    cwd: 'shophub-checkout',
    port: 5176,
    start: { command: 'npm', args: ['run', 'dev'] },
    readyUrl: 'http://localhost:5176/remoteEntry.js',
  },
  // New MFE repos (added):
  {
    kind: 'remote',
    name: 'wishlist',
    cwd: 'shophub-wishlist',
    port: 5177,
    start: { command: 'npm', args: ['run', 'dev'] },
    readyUrl: 'http://localhost:5177/remoteEntry.js',
  },
  {
    kind: 'remote',
    name: 'account',
    cwd: 'shophub-account',
    port: 5178,
    start: { command: 'npm', args: ['run', 'dev'] },
    readyUrl: 'http://localhost:5178/remoteEntry.js',
  },
  // Example (disabled): add more remotes/services here.
  // {
  //   kind: 'remote',
  //   name: 'search',
  //   cwd: 'shophub-search',
  //   port: 5177,
  //   start: { command: 'npm', args: ['run', 'dev'] },
  //   readyUrl: 'http://localhost:5177/remoteEntry.js',
  // },
  // {
  //   kind: 'service',
  //   name: 'mock-api',
  //   cwd: 'shophub-mock-api',
  //   port: 4000,
  //   start: { command: 'npm', args: ['run', 'dev'] },
  //   readyUrl: 'http://localhost:4000/health',
  // },
);

export { services };

export const shell = {
  name: 'shell',
  cwd: 'shophub-shell',
  port: 5173,
  start: { command: 'npm', args: ['run', 'dev'] },
  // For the shell we don't need a readyUrl; `webpack-dev-server` logs are enough.
};

