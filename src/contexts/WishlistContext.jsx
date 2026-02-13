/* eslint-disable react-refresh/only-export-components */
// Reason: context modules intentionally export both Provider components and hooks (e.g. `useWishlist`).
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Wishlist state owned by the shell.
 *
 * Reason:
 * - Multiple MFEs (catalog, wishlist page, etc.) need to interact with a single wishlist.
 * - Storing it in the shell avoids cross-remote state coupling while keeping MFEs stateless via props.
 */

const WishlistContext = createContext(null);

const STORAGE_KEY = 'shophub:wishlist:v1';

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load initial wishlist from localStorage once.
  useEffect(() => {
    const saved = safeJsonParse(localStorage.getItem(STORAGE_KEY), []);
    // Reason: normalize to array (defensive against storage tampering).
    setWishlistItems(Array.isArray(saved) ? saved : []);
    setLoading(false);
  }, []);

  // Persist wishlist on changes.
  useEffect(() => {
    if (loading) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlistItems));
    } catch {
      // Ignore storage quota / privacy mode errors in dev; wishlist remains in-memory for session.
    }
  }, [wishlistItems, loading]);

  const api = useMemo(() => {
    const isInWishlist = (productId) => wishlistItems.some((p) => p?.id === productId);

    const addToWishlist = (product) => {
      if (!product?.id) return;
      setWishlistItems((prev) => {
        if (prev.some((p) => p?.id === product.id)) return prev;
        return [product, ...prev];
      });
    };

    const removeFromWishlist = (productId) => {
      setWishlistItems((prev) => prev.filter((p) => p?.id !== productId));
    };

    const clearWishlist = () => setWishlistItems([]);

    return {
      loading,
      wishlistItems,
      wishlistCount: wishlistItems.length,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      clearWishlist,
    };
  }, [wishlistItems, loading]);

  return <WishlistContext.Provider value={api}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>');
  return ctx;
}

