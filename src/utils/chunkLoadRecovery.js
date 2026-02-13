/* global __webpack_require__ */
// Reason: Webpack injects `__webpack_require__` at runtime; ESLint doesn't know about it by default.
/**
 * Install a best-effort handler for Webpack chunk load failures.
 *
 * Why this exists:
 * - In production, users can have an older HTML page cached while JS chunk filenames (content hashes)
 *   change after a deploy. When the app later tries to lazy-load a chunk that no longer exists,
 *   Webpack throws a `ChunkLoadError` (or a similar "Loading chunk X failed" error).
 *
 * Goals:
 * - Recover automatically with a single reload (to fetch the latest HTML + chunk graph).
 * - Avoid infinite reload loops if the problem persists (bad CDN, offline, etc).
 * - Add lightweight logging for observability (console + optional Zipy).
 */
export function installChunkLoadRecovery() {
  if (typeof window === 'undefined') return;

  const RELOAD_GUARD_KEY = '__shophub_shell_chunk_reload_guard__';
  const RELOAD_GUARD_TTL_MS = 10 * 60 * 1000; // 10 minutes

  function now() {
    return Date.now();
  }

  function hasRecentlyReloaded() {
    try {
      const raw = window.sessionStorage.getItem(RELOAD_GUARD_KEY);
      if (!raw) return false;
      const ts = Number(raw);
      return Number.isFinite(ts) && now() - ts < RELOAD_GUARD_TTL_MS;
    } catch {
      // If storage is blocked, err on the side of not reloading repeatedly.
      return true;
    }
  }

  function markReloaded() {
    try {
      window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(now()));
    } catch {
      // Ignore; handler still works without persistence.
    }
  }

  function isChunkLoadError(err) {
    const name = err?.name;
    const message = err?.message;
    return (
      name === 'ChunkLoadError' ||
      (typeof message === 'string' && /Loading chunk \d+ failed/i.test(message))
    );
  }

  function getChunkRequest(err) {
    // Webpack usually provides `request` on ChunkLoadError.
    if (typeof err?.request === 'string') return err.request;
    // Fallback: try to capture URLs embedded in the error message.
    const msg = typeof err?.message === 'string' ? err.message : '';
    const match = msg.match(/\(error:\s*([^)]+)\)/i);
    return match?.[1];
  }

  function report(err, source) {
    const request = getChunkRequest(err);
    const publicPath =
      typeof __webpack_require__ !== 'undefined' && typeof __webpack_require__?.p === 'string'
        ? __webpack_require__.p
        : undefined;

    // eslint-disable-next-line no-console
    console.warn('[shophub-shell][chunk-load]', {
      source,
      message: err?.message,
      name: err?.name,
      request,
      publicPath,
      href: window.location.href,
      online: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
    });

    if (window.zipy?.logMessage) {
      window.zipy.logMessage('Chunk load failure detected', {
        source,
        request,
        publicPath,
        href: window.location.href,
      });
    }
    if (window.zipy?.logException && err instanceof Error) {
      window.zipy.logException(err);
    }
  }

  function maybeRecover(err, source) {
    if (!isChunkLoadError(err)) return;

    report(err, source);

    // If offline, reloading typically doesn't help and can worsen UX.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

    // Avoid reload loops when the failure is persistent (bad deploy, CDN, etc).
    if (hasRecentlyReloaded()) return;

    markReloaded();
    window.location.reload();
  }

  window.addEventListener('unhandledrejection', (event) => {
    maybeRecover(event?.reason, 'unhandledrejection');
  });

  // Some environments surface chunk load failures via `error` events.
  window.addEventListener('error', (event) => {
    maybeRecover(event?.error, 'error');
  });
}

