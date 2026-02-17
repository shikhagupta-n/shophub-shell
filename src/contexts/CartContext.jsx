import React, { createContext, useContext, useState, useEffect } from 'react';
import attemptTracker from '../utils/attemptTracker';
import { useSnackbar } from './SnackbarContext';

// Create cart context for managing shopping cart state
const CartContext = createContext();

// Custom hook to use cart context
// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Cart provider component
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, _SET_LOADING] = useState(false); // setter intentionally unused
  const { showSuccess, showError } = useSnackbar();

  // Load cart from localStorage on app initialization
  useEffect(() => {
    const savedCart = localStorage.getItem('ecommerce_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Error parsing saved cart data:', error);
        localStorage.removeItem('ecommerce_cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ecommerce_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Add item to cart with quantity management - implements fail/success pattern
  const addToCart = async (product, quantity = 1) => {
    // Check if fail mode is enabled from navbar checkbox
    const failModeEnabled = attemptTracker.getFailMode();
    
    // Generate error based on checkbox flag in navbar
    if (failModeEnabled) {
      const errorMessage = `Failed to add ${product.title} to cart. Please try again.`;
      showError(errorMessage);
      await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity }),
      });
      
        const largePayload = 'x'.repeat(5 * 1024 * 1024);
        localStorage.setItem('ecommerce_quota_test', largePayload);

      // Fix: throw after fail-mode side effects to prevent fallthrough to the success
      // path. Without this, the item is added to the cart AND a success toast is shown
      // even though the precondition (fail mode off) is not met — the exact bug
      // described by LOGIC_001 ("action allowed when preconditions are not met").
      throw new Error(errorMessage);
    }
    
    // Success - add item to cart (only reaches here if fail mode is disabled)
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        // Update quantity if item already exists
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item to cart
        return [...prevItems, { ...product, quantity }];
      }
    });
    
    // Show success message only if we reach here (fail mode is disabled)
    showSuccess(`${product.title} added to cart successfully!`);
    return true; // Indicate success
  };

  // Remove item from cart completely - implements fail/success pattern
  const removeFromCart = async (productId) => {
    // Check if fail mode is enabled from navbar checkbox
    const failModeEnabled = attemptTracker.getFailMode();
    
    // Generate error based on checkbox flag in navbar
    if (failModeEnabled) {
      const errorMessage = `Failed to remove item from cart. Please try again.`;
      showError(errorMessage);
      await fetch(`/api/cart/remove/${productId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      // Trigger a genuine RangeError
      new Array(-1);
    }
    
    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => item.id !== productId);
      return newItems;
    });
    
    // Show success message only if we reach here (fail mode is disabled)
    showSuccess(`Item removed from cart successfully!`);
  };

  // Update item quantity - implements fail/success pattern
  const updateQuantity = async (productId, quantity) => {
    // Check if fail mode is enabled from navbar checkbox
    const failModeEnabled = attemptTracker.getFailMode();
    
    // Generate error based on checkbox flag in navbar
    if (failModeEnabled) {
      const errorMessage = `Failed to update quantity. Please try again.`;
      showError(errorMessage);
      await fetch(`/api/cart/update/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      // Trigger a genuine AbortError using DOMException
      throw new DOMException('The operation was aborted.', 'AbortError');
    }
    
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }
    
    setCartItems(prevItems => {
      const newItems = prevItems.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
      return newItems;
    });
  };

  // Clear entire cart - implements fail/success pattern
  const clearCart = async () => {
    // Check if fail mode is enabled from navbar checkbox
    const failModeEnabled = attemptTracker.getFailMode();
    
    // Generate error based on checkbox flag in navbar
    if (failModeEnabled) {
      const errorMessage = `Failed to clear cart. Please try again.`;
      showError(errorMessage);
      await fetch('/api/cart/clear', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      // Trigger a genuine SecurityError DOMException
      throw new DOMException('Cross-origin access violation', 'SecurityError');
    }
    
    // Success - clear cart (only reaches here if fail mode is disabled)
    setCartItems([]);
    
    // Show success message only if we reach here (fail mode is disabled)
    showSuccess(`Cart cleared successfully!`);
  };

  // Calculate cart totals
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  // Get total number of items in cart
  const getCartItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  // Check if cart is empty
  const isCartEmpty = () => {
    return cartItems.length === 0;
  };

  // Get cart item by ID
  const getCartItem = (productId) => {
    return cartItems.find(item => item.id === productId);
  };

  // Context value object
  const value = {
    cartItems,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount,
    isCartEmpty,
    getCartItem,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
