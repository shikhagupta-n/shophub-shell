/**
 * Module Federation helpers (host-side).
 *
 * Why this file exists:
 * - Webpack MF containers must be initialized with the *same* share scope object for the lifetime
 *   of the page. Calling `container.init({})` (or re-calling init with a different object) throws:
 *   "Container initialization failed as it has already been initialized with a different share scope".
 * - Some UI/debug flows may be tempted to call `window.<remote>.init(...)` manually. This helper makes
 *   that safe and idempotent by always using the host's `__webpack_share_scopes__.default` and caching.
 */

/* eslint-disable no-underscore-dangle */

// Cache init promises per remote container so we never call init twice concurrently.
const containerInitPromises = new Map();

function isMfRuntimeAvailable() {
  // Reason: in unit tests or non-federated builds these globals may not exist.
  return (
    typeof __webpack_init_sharing__ === 'function' &&
    typeof __webpack_share_scopes__ === 'object' &&
    __webpack_share_scopes__ !== null
  );
}

function shouldDebugLog() {
  // Reason: keep production console clean; enable logs only when explicitly opted-in.
  try {
    return globalThis?.localStorage?.getItem('shophub_mf_debug') === 'true';
  } catch {
    return false;
  }
}

function debugLog(...args) {
  if (!shouldDebugLog()) return;
  // eslint-disable-next-line no-console
  console.debug('[shophub-shell][mf]', ...args);
}

/**
 * Ensures the host default share scope is initialized.
 *
 * IMPORTANT:
 * - This must run before any manual container initialization.
 * - Webpack will also do this automatically when loading remotes, but explicit init makes the
 *   calling code deterministic (and easier to diagnose).
 */
export async function ensureDefaultShareScope() {
  if (!isMfRuntimeAvailable()) return;

  // Reason: calling this multiple times is safe; Webpack memoizes internally.
  await __webpack_init_sharing__('default');
  debugLog('default share scope ready');
}

/**
 * Safely initializes a remote container once with the host default share scope.
 *
 * @param {string} remoteName - remote global name (e.g. "account", "catalog")
 * @param {any} container - the remote container object (e.g. window.account)
 */
export async function initContainerOnce(remoteName, container) {
  if (!container || typeof container.init !== 'function') {
    throw new Error(`[mf] Remote container "${remoteName}" is not available or has no init()`);
  }

  // If already in-flight/initialized, reuse the same promise.
  if (containerInitPromises.has(remoteName)) return containerInitPromises.get(remoteName);

  const initPromise = (async () => {
    if (!isMfRuntimeAvailable()) {
      // Reason: if MF runtime isn't present, calling init can't work anyway; fail loudly for diagnostics.
      throw new Error('[mf] Webpack Module Federation runtime globals are not available');
    }

    await ensureDefaultShareScope();

    const shareScope = __webpack_share_scopes__?.default;
    if (!shareScope) {
      // Reason: extremely defensive; should never happen after ensureDefaultShareScope().
      throw new Error('[mf] Host default share scope is missing after initialization');
    }

    try {
      debugLog(`initializing container "${remoteName}"`);
      await container.init(shareScope);
      debugLog(`container "${remoteName}" initialized`);
    } catch (e) {
      const msg = String(e?.message ?? e);

      // Reason: if the container was already initialized earlier (possibly by a different import path),
      // we can safely proceed because the remote is already ready to serve modules.
      // This is specifically to prevent production crashes from accidental double-init attempts.
      if (msg.includes('already been initialized with a different share scope')) {
        debugLog(`container "${remoteName}" already initialized (different share scope); continuing`, e);
        return;
      }

      // Re-throw unknown init errors.
      throw e;
    }
  })();

  containerInitPromises.set(remoteName, initPromise);
  return initPromise;
}

/**
 * Convenience: initializes `window[remoteName]` safely.
 *
 * This is useful for debug tooling, but in normal app code you should rely on `import("remote/Module")`
 * which handles remote loading and initialization automatically.
 */
export async function initRemoteGlobalOnce(remoteName) {
  const container = globalThis?.[remoteName];
  return initContainerOnce(remoteName, container);
}

