// Utility to track attempt counts for different actions.
// Implements the pattern: odd attempts fail, even attempts succeed.
//
// IMPORTANT:
// This module is also used as a "failure injection" toggle in several user flows (auth/cart/payment)
// for debugging and demos. That behavior must NEVER affect production users, so we defensively
// disable fail mode in production builds even if `localStorage` was previously toggled on.

function isProductionBuild() {
  // Reason: webpack commonly inlines `process.env.NODE_ENV`; guard for non-webpack/test environments.
  try {
    const nodeEnv = globalThis?.process?.env?.NODE_ENV;
    return nodeEnv === 'production';
  } catch {
    return false;
  }
}

function getLocalStorage() {
  // Reason: avoid hard-crashes in SSR/tests/private mode where localStorage may be unavailable.
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}

class AttemptTracker {
  constructor() {
    // Store attempt counts in localStorage for persistence across sessions
    this.storageKey = 'ecommerce_attempt_counts';
    this.counts = this.loadCounts();
    
    // Global toggle for fail/success pattern
    this.failModeEnabled = this.loadFailMode();

    // Ensure fail mode cannot leak into production sessions.
    // Reason: fail mode intentionally injects errors (including "logical" errors) for debugging.
    if (isProductionBuild() && this.failModeEnabled) {
      this.failModeEnabled = false;
      this.saveFailMode();
    }
  }

  // Load attempt counts from localStorage
  loadCounts() {
    try {
      const storage = getLocalStorage();
      if (!storage) return {};
      const saved = storage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      // Error loading attempt counts.
      return {};
    }
  }

  // Save attempt counts to localStorage
  saveCounts() {
    try {
      const storage = getLocalStorage();
      if (!storage) return;
      storage.setItem(this.storageKey, JSON.stringify(this.counts));
    } catch {
      // Error saving attempt counts.
    }
  }

  // Get current attempt count for an action
  getAttemptCount(action) {
    return this.counts[action] || 0;
  }

  // Increment attempt count for an action
  incrementAttempt(action) {
    this.counts[action] = (this.counts[action] || 0) + 1;
    this.saveCounts();
    return this.counts[action];
  }

  // Load fail mode setting from localStorage
  loadFailMode() {
    try {
      // Reason: fail mode is a debug feature; production must always run in success mode.
      if (isProductionBuild()) return false;

      const storage = getLocalStorage();
      if (!storage) return false;
      const saved = storage.getItem('ecommerce_fail_mode');
      return saved ? JSON.parse(saved) : false; // Default to false (success mode)
    } catch {
      // Error loading fail mode setting.
      return false;
    }
  }

  // Save fail mode setting to localStorage
  saveFailMode() {
    try {
      const storage = getLocalStorage();
      if (!storage) return;
      storage.setItem('ecommerce_fail_mode', JSON.stringify(this.failModeEnabled));
    } catch {
      // Error saving fail mode setting.
    }
  }

  // Toggle fail mode
  toggleFailMode() {
    // Reason: never allow failure injection in production builds.
    if (isProductionBuild()) return false;
    this.failModeEnabled = !this.failModeEnabled;
    this.saveFailMode();
    return this.failModeEnabled;
  }

  // Explicitly set fail mode
  setFailMode(enabled) {
    // Reason: never allow failure injection in production builds.
    if (isProductionBuild()) return false;
    this.failModeEnabled = Boolean(enabled);
    this.saveFailMode();
    return this.failModeEnabled;
  }

  // Get current fail mode status
  getFailMode() {
    return this.failModeEnabled;
  }

  // Whether fail mode should be exposed to the user (UI) in the current build.
  isFailModeAvailable() {
    // Reason: prevent accidental enabling in production even if UI code renders a toggle.
    return !isProductionBuild();
  }

  // Check if current attempt should fail (odd attempts fail, even attempts succeed)
  shouldFail() {
    // New behavior:
    // - If fail mode is enabled → ALWAYS fail
    // - If fail mode is disabled → ALWAYS succeed
    if (this.failModeEnabled) {
      return true;
    }
    return false;
  }

  // Get attempt info for an action
  getAttemptInfo(action) {
    const count = this.getAttemptCount(action);
    const shouldFail = this.shouldFail();
    return {
      count,
      shouldFail,
      isOdd: count % 2 === 1,
      isEven: count % 2 === 0,
    };
  }

  // Reset attempt count for an action (useful for testing)
  resetAttempt(action) {
    delete this.counts[action];
    this.saveCounts();
  }

  // Reset all attempt counts
  resetAllAttempts() {
    this.counts = {};
    this.saveCounts();
  }

  // Get all attempt counts (for debugging)
  getAllCounts() {
    return { ...this.counts };
  }
}

// Create singleton instance
const attemptTracker = new AttemptTracker();

export default attemptTracker;
