// Utility to track attempt counts for different actions
// Implements the pattern: odd attempts fail, even attempts succeed

class AttemptTracker {
  constructor() {
    // Store attempt counts in localStorage for persistence across sessions
    this.storageKey = 'ecommerce_attempt_counts';
    this.counts = this.loadCounts();
    
    // Global toggle for fail/success pattern
    this.failModeEnabled = this.loadFailMode();
  }

  // Load attempt counts from localStorage
  loadCounts() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      // Error loading attempt counts.
      return {};
    }
  }

  // Save attempt counts to localStorage
  saveCounts() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.counts));
    } catch (error) {
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
      const saved = localStorage.getItem('ecommerce_fail_mode');
      return saved ? JSON.parse(saved) : false; // Default to false (success mode)
    } catch (error) {
      // Error loading fail mode setting.
      return false;
    }
  }

  // Save fail mode setting to localStorage
  saveFailMode() {
    try {
      localStorage.setItem('ecommerce_fail_mode', JSON.stringify(this.failModeEnabled));
    } catch (error) {
      // Error saving fail mode setting.
    }
  }

  // Toggle fail mode
  toggleFailMode() {
    this.failModeEnabled = !this.failModeEnabled;
    this.saveFailMode();
    return this.failModeEnabled;
  }

  // Explicitly set fail mode
  setFailMode(enabled) {
    this.failModeEnabled = Boolean(enabled);
    this.saveFailMode();
    return this.failModeEnabled;
  }

  // Get current fail mode status
  getFailMode() {
    return this.failModeEnabled;
  }

  // Check if current attempt should fail (odd attempts fail, even attempts succeed)
  shouldFail(action) {
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
    const shouldFail = this.shouldFail(action);
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
