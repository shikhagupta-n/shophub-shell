import React, { createContext, useContext, useState, useEffect } from 'react';
import attemptTracker from '../utils/attemptTracker';
import { useSnackbar } from './SnackbarContext';

// Create authentication context for managing user state
const AuthContext = createContext();

// Custom hook to use authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Authentication provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useSnackbar();

  // Check for existing user session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('ecommerce_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('ecommerce_user');
      }
    }
    setLoading(false);
  }, []);

  // Login function with realistic validation and error handling - implements fail/success pattern
  const login = async (email, password) => {
    try {
      setLoading(true);

      // Check if fail mode is enabled from navbar checkbox
      const failModeEnabled = attemptTracker.getFailMode();
      // Added detailed log to trace login flow and fail mode state for debugging network issues.
      console.log('[Auth][Login] Starting login', { failModeEnabled });

      // Simulate API call delay for realistic UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Basic validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Generate error based on checkbox flag in navbar
      if (failModeEnabled) {
        // Make a real API call that we expect to fail logically (or return index.html in prod)
        // and then intentionally trigger a real network error so monitoring tools can capture it.
        showError(`Login failed. Please try again.`);

        try {
          // First call the real API so that in environments where it truly fails,
          // the network error is naturally captured.
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const contentType = response.headers.get('content-type') || '';
          console.log('[Auth][Login][failMode] Real /api/auth/login response', {
            status: response.status,
            ok: response.ok,
            contentType,
          });

          // In production today this often returns 200 with index.html (text/html) instead of JSON.
          // To simulate a real network error that tools like Zipy can capture, we call an always-invalid
          // domain which guarantees a network-level failure at the fetch layer.
          if (response.ok && contentType.includes('text/html')) {
            console.error(
              '[Auth][Login][failMode] Received HTML (likely index.html) from /api/auth/login; triggering simulated network error.',
            );
            await fetch('https://auth-simulated-fail.invalid/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              // Do not send real credentials to the simulated endpoint; only diagnostic info.
              body: JSON.stringify({ reason: 'login_fail_mode_simulation' }),
            });
          }
        } catch (networkError) {
          // This catch is reached when either the real API or the simulated .invalid endpoint
          // fails at the network layer. This is the behavior we want tools to observe.
          console.error(
            '[Auth][Login][failMode] Network-layer error during fail-mode simulation:',
            networkError,
          );
          throw new Error('Login failed due to simulated network error.');
        }

        // If both the real API and the simulated network call "succeed" (unexpected),
        // still fail logically so the UI behaves consistently.
        throw new Error(`Login failed. Please try again.`);
      }

      // For demo purposes, accept any valid email/password combination
      // In a real app, this would be an API call to your backend
      const userData = {
        id: Date.now(),
        email,
        name: email.split('@')[0], // Use email prefix as name for demo
        createdAt: new Date().toISOString(),
      };

      // Save user data to localStorage for persistence
      localStorage.setItem('ecommerce_user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);

      // Show success message only if we reach here (fail mode is disabled)
      showSuccess(`Login successful! Welcome back.`);

      return { success: true, user: userData };
    } catch (error) {
      // Added explicit log so we can see any unexpected login errors during debugging.
      console.error('[Auth][Login] Login error caught in AuthContext:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Signup function with comprehensive validation - implements fail/success pattern
  const signup = async (name, email, password, confirmPassword) => {
    try {
      setLoading(true);

      // Check if fail mode is enabled from navbar checkbox
      const failModeEnabled = attemptTracker.getFailMode();
      // Added log to trace signup flow and fail mode state for debugging network issues.
      console.log('[Auth][Signup] Starting signup', { failModeEnabled });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Comprehensive validation
      if (!name || !email || !password || !confirmPassword) {
        throw new Error('All fields are required');
      }

      if (name.length < 2) {
        throw new Error('Name must be at least 2 characters long');
      }

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Generate error based on checkbox flag in navbar
      if (failModeEnabled) {
        // Make a real API call that we expect to fail logically (or return index.html in prod)
        // and then intentionally trigger a real network error so monitoring tools can capture it.
        showError(`Signup failed. Please try again.`);

        try {
          // First call the real API so that in environments where it truly fails,
          // the network error is naturally captured.
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, confirmPassword }),
          });

          const contentType = response.headers.get('content-type') || '';
          console.log('[Auth][Signup][failMode] Real /api/auth/signup response', {
            status: response.status,
            ok: response.ok,
            contentType,
          });

          // In production today this often returns 200 with index.html (text/html) instead of JSON.
          // To simulate a real network error that tools like Zipy can capture, we call an always-invalid
          // domain which guarantees a network-level failure at the fetch layer.
          if (response.ok && contentType.includes('text/html')) {
            console.error(
              '[Auth][Signup][failMode] Received HTML (likely index.html) from /api/auth/signup; triggering simulated network error.',
            );
            await fetch('https://auth-simulated-fail.invalid/signup', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              // Do not send real credentials to the simulated endpoint; only diagnostic info.
              body: JSON.stringify({ reason: 'signup_fail_mode_simulation' }),
            });
          }
        } catch (networkError) {
          // This catch is reached when either the real API or the simulated .invalid endpoint
          // fails at the network layer. This is the behavior we want tools to observe.
          console.error(
            '[Auth][Signup][failMode] Network-layer error during fail-mode simulation:',
            networkError,
          );
          throw new Error('Signup failed due to simulated network error.');
        }

        // If both the real API and the simulated network call "succeed" (unexpected),
        // still fail logically so the UI behaves consistently.
        throw new Error(`Signup failed. Please try again.`);
      }

      // Check if user already exists (simulate database check)
      const existingUser = localStorage.getItem('ecommerce_user');
      if (existingUser) {
        const parsedUser = JSON.parse(existingUser);
        if (parsedUser.email === email) {
          throw new Error('User with this email already exists');
        }
      }

      // Create new user
      const userData = {
        id: Date.now(),
        name,
        email,
        createdAt: new Date().toISOString(),
      };

      // Save user data
      localStorage.setItem('ecommerce_user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Show success message only if we reach here (fail mode is disabled)
      showSuccess(`Account created successfully! Welcome ${name}.`);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function - implements fail/success pattern with streaming support
  const logout = async () => {
    // Check if fail mode is enabled from navbar checkbox
    const failModeEnabled = attemptTracker.getFailMode();
    // Added log to trace logout flow and fail mode state for debugging network issues.
    console.log('[Auth][Logout] Starting logout', { failModeEnabled });

    // Generate error based on checkbox flag in navbar
    if (failModeEnabled) {
      // Make a real API call that we expect to fail logically (or return index.html in prod)
      // and then intentionally trigger a real network error so monitoring tools can capture it.
      const errorMessage = `Failed to logout. Please try again.`;
      showError(errorMessage);

      try {
        // First call the real API so that in environments where it truly fails,
        // the network error is naturally captured.
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        const contentType = response.headers.get('content-type') || '';
        console.log('[Auth][Logout][failMode] Real /api/auth/logout response', {
          status: response.status,
          ok: response.ok,
          contentType,
        });

        // In production today this often returns 200 with index.html (text/html) instead of JSON.
        // To simulate a real network error that tools like Zipy can capture, we call an always-invalid
        // domain which guarantees a network-level failure at the fetch layer.
        if (response.ok && contentType.includes('text/html')) {
          console.error(
            '[Auth][Logout][failMode] Received HTML (likely index.html) from /api/auth/logout; triggering simulated network error.',
          );
          await fetch('https://auth-simulated-fail.invalid/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Do not send any user-identifying data to the simulated endpoint; only diagnostic info.
            body: JSON.stringify({ reason: 'logout_fail_mode_simulation' }),
          });
        }
      } catch (networkError) {
        // This catch is reached when either the real API or the simulated .invalid endpoint
        // fails at the network layer. This is the behavior we want tools to observe.
        console.error(
          '[Auth][Logout][failMode] Network-layer error during fail-mode simulation:',
          networkError,
        );
        throw new Error(errorMessage);
      }

      // If both the real API and the simulated network call "succeed" (unexpected),
      // still fail logically so the UI behaves consistently.
      throw new Error(errorMessage);
    }

    // Success - logout (only reaches here if fail mode is disabled)
    localStorage.removeItem('ecommerce_user');
    setUser(null);
    setIsAuthenticated(false);
    
    // Show success message
    showSuccess('Logged out successfully!');
  };

  // Context value object
  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
