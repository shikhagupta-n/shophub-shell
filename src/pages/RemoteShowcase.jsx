import React, { Suspense } from 'react';
import { Box, CircularProgress, Container, Divider, Paper, Typography } from '@mui/material';

import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useSnackbar } from '../contexts/SnackbarContext.jsx';
import { useWishlist } from '../contexts/WishlistContext.jsx';

/**
 * RemoteShowcase
 *
 * Purpose:
 * - A single shell-owned page that imports and renders multiple remotes together.
 * - Useful for validating Module Federation wiring, shared deps, and cross-remote composition.
 *
 * Note:
 * - Each remote is wrapped in an error boundary so one remote crashing doesn't break the whole page.
 */

const RemoteLogin = React.lazy(() => import('auth/Login'));
const RemoteProducts = React.lazy(() => import('catalog/Products'));
const RemoteCart = React.lazy(() => import('checkout/Cart'));
const RemoteAccount = React.lazy(() => import('account/Account'));

function Loader() {
  return (
    <Box sx={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress size={28} />
    </Box>
  );
}

class RemoteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    // Keep console logging for debugging remote integration issues.
    // Reason: this page is meant for diagnostics.
    // eslint-disable-next-line no-console
    console.error('[RemoteShowcase] Remote crashed:', this.props?.title, error);
  }

  render() {
    if (this.state.error) {
      return (
        <Paper sx={{ p: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            {this.props.title} failed to render
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {String(this.state.error?.message ?? this.state.error)}
          </Typography>
        </Paper>
      );
    }
    return this.props.children;
  }
}

function Section({ title, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        border: '1px solid rgba(0,0,0,0.06)',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {children}
    </Paper>
  );
}

export default function RemoteShowcase() {
  const { loading, login } = useAuth();
  const { cartItems, getCartTotal, removeFromCart, updateQuantity, isCartEmpty, clearCart, addToCart } = useCart();
  const { showError, showSuccess } = useSnackbar();
  const { wishlistItems, addToWishlist, removeFromWishlist, clearWishlist, isInWishlist } = useWishlist();

  return (
    <Box sx={{ minHeight: '100vh', background: '#fafafa', py: 4 }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 950 }}>
            Remote Showcase
          </Typography>
          <Typography color="text.secondary">
            Shell page rendering 4 remotes together: auth, catalog, checkout, account.
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
          <RemoteErrorBoundary title="Auth / Login">
            <Section title="Auth Remote (Login)">
              <Suspense fallback={<Loader />}>
                <RemoteLogin login={login} loading={loading} />
              </Suspense>
            </Section>
          </RemoteErrorBoundary>

          <RemoteErrorBoundary title="Account / My Account">
            <Section title="Account Remote">
              <Suspense fallback={<Loader />}>
                <RemoteAccount />
              </Suspense>
            </Section>
          </RemoteErrorBoundary>

          <RemoteErrorBoundary title="Catalog / Products">
            <Section title="Catalog Remote (Products)">
              <Suspense fallback={<Loader />}>
                <RemoteProducts
                  addToCart={addToCart}
                  showError={showError}
                  // Wishlist is shell-owned; pass callbacks to let catalog interact with it.
                  addToWishlist={addToWishlist}
                  isInWishlist={isInWishlist}
                />
              </Suspense>
            </Section>
          </RemoteErrorBoundary>

          <RemoteErrorBoundary title="Checkout / Cart">
            <Section title="Checkout Remote (Cart)">
              <Suspense fallback={<Loader />}>
                <RemoteCart
                  cartItems={cartItems}
                  removeFromCart={removeFromCart}
                  updateQuantity={updateQuantity}
                  getCartTotal={getCartTotal}
                  isCartEmpty={isCartEmpty}
                  clearCart={clearCart}
                  showError={showError}
                  // Optional extras for consistency when you test in one place.
                  wishlistItems={wishlistItems}
                  removeFromWishlist={removeFromWishlist}
                  clearWishlist={clearWishlist}
                  showSuccess={showSuccess}
                />
              </Suspense>
            </Section>
          </RemoteErrorBoundary>
        </Box>
      </Container>
    </Box>
  );
}

