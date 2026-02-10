import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Box, CircularProgress, CssBaseline } from '@mui/material';

import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { CartProvider, useCart } from './contexts/CartContext.jsx';
import { SnackbarProvider, useSnackbar } from './contexts/SnackbarContext.jsx';
import { WishlistProvider, useWishlist } from './contexts/WishlistContext.jsx';
import { theme } from './theme/theme.js';
import Navbar from './components/Navbar.jsx';

// Remote page modules (loaded at runtime).
const Login = React.lazy(() => import('auth/Login'));
const SignUp = React.lazy(() => import('auth/SignUp'));

const Products = React.lazy(() => import('catalog/Products'));
const ProductDetail = React.lazy(() => import('catalog/ProductDetail'));
const Collections = React.lazy(() => import('catalog/Collections'));
const About = React.lazy(() => import('catalog/About'));

const Cart = React.lazy(() => import('checkout/Cart'));
const Checkout = React.lazy(() => import('checkout/Checkout'));
const OrderConfirmation = React.lazy(() => import('checkout/OrderConfirmation'));

// New remotes (added):
const Wishlist = React.lazy(() => import('wishlist/Wishlist'));
const Account = React.lazy(() => import('account/Account'));
const Addresses = React.lazy(() => import('account/Addresses'));

function FullPageLoader() {
  return (
    <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress />
    </Box>
  );
}

// Protected route component to handle authentication.
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Reason: avoid redirect flicker while session is being loaded from localStorage.
  if (loading) return <FullPageLoader />;

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppLayout() {
  const { isAuthenticated, loading, login, signup } = useAuth();
  // Note: `useAuth().loading` covers auth bootstrapping; login/signup each manage their own async state.
  const { cartItems, getCartTotal, addToCart, removeFromCart, updateQuantity, isCartEmpty, clearCart } = useCart();
  const { showError, showSuccess } = useSnackbar();
  const { wishlistItems, addToWishlist, removeFromWishlist, clearWishlist, isInWishlist } = useWishlist();

  if (loading) return <FullPageLoader />;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1, pt: 0, pb: 0 }}>
        <Suspense fallback={<FullPageLoader />}>
          <Routes>
            <Route
              path="/login"
              element={
                !isAuthenticated ? (
                  <Login login={login} loading={loading} />
                ) : (
                  <Navigate to="/products" replace />
                )
              }
            />
            <Route
              path="/signup"
              element={
                !isAuthenticated ? (
                  <SignUp signup={signup} loading={loading} />
                ) : (
                  <Navigate to="/products" replace />
                )
              }
            />

            <Route
              path="/products"
              element={
                <Products
                  addToCart={addToCart}
                  showError={showError}
                  // Reason: catalog can add products to wishlist without owning wishlist state.
                  addToWishlist={addToWishlist}
                  isInWishlist={isInWishlist}
                />
              }
            />
            <Route
              path="/product/:id"
              element={
                <ProductDetail
                  addToCart={addToCart}
                  addToWishlist={addToWishlist}
                  isInWishlist={isInWishlist}
                  cartItems={cartItems}
                  showError={showError}
                  showSuccess={showSuccess}
                />
              }
            />
            <Route path="/collections" element={<Collections />} />
            <Route path="/about" element={<About />} />

            <Route
              path="/cart"
              element={
                <Cart
                  cartItems={cartItems}
                  removeFromCart={removeFromCart}
                  updateQuantity={updateQuantity}
                  getCartTotal={getCartTotal}
                  isCartEmpty={isCartEmpty}
                  clearCart={clearCart}
                  showError={showError}
                />
              }
            />

            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <Checkout
                    cartItems={cartItems}
                    getCartTotal={getCartTotal}
                    clearCart={clearCart}
                    showError={showError}
                    showSuccess={showSuccess}
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/order-confirmation"
              element={
                <ProtectedRoute>
                  <OrderConfirmation />
                </ProtectedRoute>
              }
            />

            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist
                    items={wishlistItems}
                    removeFromWishlist={removeFromWishlist}
                    clearWishlist={clearWishlist}
                    // Optional: let wishlist add items to cart (shell owns cart).
                    addToCart={addToCart}
                    showError={showError}
                    showSuccess={showSuccess}
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/addresses"
              element={
                <ProtectedRoute>
                  <Addresses />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/products" replace />} />
          </Routes>
        </Suspense>
      </Box>
    </Box>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Router>
                <AppLayout />
              </Router>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

