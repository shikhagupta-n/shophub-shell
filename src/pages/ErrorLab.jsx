import React, { Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Container, Paper, Typography } from '@mui/material';

// Remote error labs (loaded at runtime).
const AuthErrorLab = React.lazy(() => import('auth/ErrorLab'));
const CatalogErrorLab = React.lazy(() => import('catalog/ErrorLab'));
const CheckoutErrorLab = React.lazy(() => import('checkout/ErrorLab'));
const WishlistErrorLab = React.lazy(() => import('wishlist/ErrorLab'));
const AccountErrorLab = React.lazy(() => import('account/ErrorLab'));

function FullPageLoader() {
  return (
    <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress />
    </Box>
  );
}

function useErrorLabEnabled() {
  const location = useLocation();

  // Enable via query param once, persist to localStorage.
  // Reason: avoid exposing a debug panel to normal users while still allowing staging verification.
  const params = new URLSearchParams(location.search);
  if (params.get('errorlab') === '1') {
    localStorage.setItem('shophub:errorlab:enabled', 'true');
  }

  return localStorage.getItem('shophub:errorlab:enabled') === 'true';
}

function DisabledNotice() {
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Error Lab is disabled
        </Typography>
        <Typography color="text.secondary">
          Append <code>?errorlab=1</code> to enable it for this browser.
        </Typography>
      </Paper>
    </Container>
  );
}

export default function ErrorLab() {
  const enabled = useErrorLabEnabled();
  if (!enabled) return <DisabledNotice />;

  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route path="auth" element={<AuthErrorLab />} />
        <Route path="catalog" element={<CatalogErrorLab />} />
        <Route path="checkout" element={<CheckoutErrorLab />} />
        <Route path="wishlist" element={<WishlistErrorLab />} />
        <Route path="account" element={<AccountErrorLab />} />
        <Route path="" element={<Navigate to="auth" replace />} />
      </Routes>
    </Suspense>
  );
}

