import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Badge,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Container,
  Divider,
  Chip,
  Fade,
  Slide,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  Apps as AppsIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
import { useWishlist } from '../contexts/WishlistContext.jsx';
import attemptTracker from '../utils/attemptTracker.js';

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { getCartItemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [anchorEl, setAnchorEl] = useState(null);
  const [remotesAnchorEl, setRemotesAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [failModeEnabled, setFailModeEnabled] = useState(attemptTracker.getFailMode());

  // Logical errors (shell / header).
  // Reason: if a user is interacting with the header while fail mode is enabled, the stacktrace should
  // point to shell/header code, not a shared util.
  const LOGICAL_ERRORS = [
    { code: 'LOGIC_001', message: 'Incorrect conditional flow: action allowed when preconditions are not met.' },
    { code: 'LOGIC_002', message: 'Wrong state transition: attempted to update UI state from a stale snapshot.' },
    { code: 'LOGIC_003', message: 'Broken UI rendering logic: computed view model is inconsistent with inputs.' },
    { code: 'LOGIC_004', message: 'Invalid business rule: checkout/wishlist operation violates domain constraints.' },
    { code: 'LOGIC_005', message: 'Routing logic error: navigation target resolved to an unexpected route.' },
  ];
  // Keep a component-scoped counter so we generate one logical error per click (rotating).
  // Reason: user asked for errors one-by-one, not all together.
  const logicalErrorState = React.useRef({ n: 0 });
  const nextLogicalError = () => {
    const idx = logicalErrorState.current.n % LOGICAL_ERRORS.length;
    logicalErrorState.current.n += 1;
    return LOGICAL_ERRORS[idx];
  };

  const isFailModeOn = () => {
    try {
      return JSON.parse(localStorage.getItem('ecommerce_fail_mode') || 'false') === true;
    } catch {
      return false;
    }
  };

  const maybeInjectLogicalError = (event) => {
    if (!isFailModeOn()) return false;
    const target = event?.target;
    if (!(target instanceof Element)) return false;
    if (target.closest('[data-skip-logical-error="true"]')) return false;
    const buttonEl = target.closest('button, [role="button"], a, input[type="button"], input[type="submit"]');
    if (!buttonEl) return false;

    // Block normal flow so only logical errors are produced while fail mode is enabled.
    event.preventDefault();
    event.stopPropagation();

    const chosen = nextLogicalError();
    const buttonText = (buttonEl.getAttribute('aria-label') || buttonEl.textContent || '').trim().slice(0, 80) || 'unknown';
    const err = new Error(`[shell] ${chosen.code}: ${chosen.message}`);
    err.name = 'ShophubLogicalError';

    // Send to Zipy (if installed) with a real stacktrace pointing to this file.
    if (window.zipy) {
      window.zipy.logMessage('Logical error injected (fail mode)', { code: chosen.code, routeRemoteHint: 'shell', buttonText });
      window.zipy.logException(err);
    }

    // eslint-disable-next-line no-console
    console.error('[shell][LogicalError]', { ...chosen, buttonText });
    return true;
  };

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle user menu
  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRemotesMenuOpen = (event) => {
    setRemotesAnchorEl(event.currentTarget);
  };

  const handleRemotesMenuClose = () => {
    setRemotesAnchorEl(null);
  };

  const handleRemoteNavigation = (path) => {
    // Close menus before navigating.
    handleRemotesMenuClose();
    handleNavigation(path);
  };

  const triggerMFMismatchedExport = () => {
    void import('catalog/__MISSING_EXPOSED_MODULE__');
  };

  const triggerMFShareScopeMismatch = () => {
    void import('catalog/Products').then(() => window.catalog.init({}));
  };

  // FIX: Added retry logic for transient chunk load failures and graceful error handling.
  // Reason: the previous implementation caught the ChunkLoadError and re-threw it via setTimeout,
  // turning it into an uncaught global exception with no recovery path. Now we retry up to 3 times
  // with a delay (handles cache-busting after deploys / flaky networks), and log instead of crash
  // if all retries are exhausted.
  const CHUNK_RETRY_LIMIT = 3;
  const CHUNK_RETRY_DELAY_MS = 1500;

  const importWithRetry = (importFn, retries = CHUNK_RETRY_LIMIT) => {
    return importFn().catch((error) => {
      if (retries > 0 && error?.name === 'ChunkLoadError') {
        return new Promise((resolve) => setTimeout(resolve, CHUNK_RETRY_DELAY_MS))
          .then(() => importWithRetry(importFn, retries - 1));
      }
      throw error;
    });
  };

  const triggerChunkLoadFailure = () => {
    importWithRetry(() => import('../diagnostics/DeferredPanel.jsx'))
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error('[shell] Failed to load offers panel after retries:', e);
        if (window.zipy) {
          window.zipy.logException(e);
        }
      });
  };

  const triggerAbortRace = () => {
    const controller = new AbortController();
    const p = fetch('http://localhost:4000/api/time', { signal: controller.signal }).then((r) => r.json());
    setTimeout(() => controller.abort(), 0);
    void p;
  };

  const triggerNetworkFailure = () => {
    void fetch('http://localhost:9/').then((r) => r.text());
  };

  // Handle logout - implements fail/success pattern
  const handleLogout = async () => {
    try {
      await logout();
      // NOTE: Zipy removed from all repos.
      handleUserMenuClose();
      navigate('/products');
    } catch (e) {
      console.log('Logout failed:', e);
      // Error is already handled by AuthContext
    }
  };

  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Explicitly set fail mode via checkbox
  const setFailMode = (enabled) => {
    const newMode = attemptTracker.setFailMode(enabled);
    setFailModeEnabled(newMode);
  };

  return (
    <>
      <AppBar 
        position="fixed" 
        elevation={0}
        onClickCapture={(e) => {
          // Reason: inject logical errors from shell/header when fail mode is ON.
          maybeInjectLogicalError(e);
        }}
        sx={{
          background: scrolled 
            ? 'rgba(255, 255, 255, 0.98)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: scrolled 
            ? '1px solid rgba(0, 0, 0, 0.08)' 
            : '1px solid rgba(0, 0, 0, 0.04)',
          transition: 'all 0.3s ease-in-out',
          zIndex: 1200,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ 
            justifyContent: 'space-between', 
            minHeight: scrolled ? '70px' : '80px',
            transition: 'all 0.3s ease-in-out',
          }}>
            {/* Logo and Brand */}
            <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <Typography
                variant="h4"
                component="div"
                sx={{ 
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #d4af37 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: scrolled ? '1.75rem' : '2rem',
                  transition: 'all 0.3s ease-in-out',
                  letterSpacing: '-0.02em',
                }}
                onClick={() => handleNavigation('/products')}
              >
                LUXE
              </Typography>
            </Box>

            {/* Desktop Navigation Links */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, alignItems: 'center' }}>
              <Button
                color="inherit"
                onClick={() => handleNavigation('/products')}
                sx={{ 
                  textTransform: 'none', 
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'text.primary',
                  borderRadius: 3,
                  px: 3,
                  py: 1.5,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent)',
                    transition: 'left 0.6s',
                  },
                  '&:hover': {
                    background: 'rgba(212, 175, 55, 0.08)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.2)',
                    '&::before': {
                      left: '100%',
                    },
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                    background: 'rgba(212, 175, 55, 0.12)',
                    transition: 'all 0.1s',
                  },
                  '&:focus': {
                    outline: 'none',
                    boxShadow: 'none',
                  },
                  '&:focus-visible': {
                    outline: 'none',
                    boxShadow: 'none',
                  },
                }}
              >
                SHOP
              </Button>
              <Button
                color="inherit"
                onClick={() => handleNavigation('/collections')}
                sx={{ 
                  textTransform: 'none', 
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'text.primary',
                  borderRadius: 3,
                  px: 3,
                  py: 1.5,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent)',
                    transition: 'left 0.6s',
                  },
                  '&:hover': {
                    background: 'rgba(212, 175, 55, 0.08)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.2)',
                    '&::before': {
                      left: '100%',
                    },
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                    background: 'rgba(212, 175, 55, 0.12)',
                    transition: 'all 0.1s',
                  },
                  '&:focus': {
                    outline: 'none',
                    boxShadow: 'none',
                  },
                  '&:focus-visible': {
                    outline: 'none',
                    boxShadow: 'none',
                  },
                }}
              >
                COLLECTIONS
              </Button>
              <Button
                color="inherit"
                onClick={() => handleNavigation('/about')}
                sx={{ 
                  textTransform: 'none', 
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'text.primary',
                  borderRadius: 3,
                  px: 3,
                  py: 1.5,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent)',
                    transition: 'left 0.6s',
                  },
                  '&:hover': {
                    background: 'rgba(212, 175, 55, 0.08)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.2)',
                    '&::before': {
                      left: '100%',
                    },
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                    background: 'rgba(212, 175, 55, 0.12)',
                    transition: 'all 0.1s',
                  },
                  '&:focus': {
                    outline: 'none',
                    boxShadow: 'none',
                  },
                  '&:focus-visible': {
                    outline: 'none',
                    boxShadow: 'none',
                  },
                }}
              >
                ABOUT
              </Button>

              {/* Quick navigation to remote-owned pages */}
              <Button
                color="inherit"
                startIcon={<AppsIcon />}
                onClick={handleRemotesMenuOpen}
                sx={{
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'text.primary',
                  borderRadius: 3,
                  px: 3,
                  py: 1.5,
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  '&:hover': {
                    background: 'rgba(0, 0, 0, 0.03)',
                    borderColor: 'rgba(0, 0, 0, 0.18)',
                  },
                }}
              >
                Remotes
              </Button>

              <Menu
                anchorEl={remotesAnchorEl}
                open={Boolean(remotesAnchorEl)}
                onClose={handleRemotesMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 260,
                    borderRadius: 3,
                    boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                  },
                }}
              >
                <MenuItem onClick={() => handleRemoteNavigation('/login')}>Auth → Login</MenuItem>
                <MenuItem onClick={() => handleRemoteNavigation('/signup')}>Auth → Sign up</MenuItem>
                <Divider />
                <MenuItem onClick={() => handleRemoteNavigation('/products')}>Catalog → Products</MenuItem>
                <MenuItem onClick={() => handleRemoteNavigation('/collections')}>Catalog → Collections</MenuItem>
                <MenuItem onClick={() => handleRemoteNavigation('/about')}>Catalog → About</MenuItem>
                <Divider />
                <MenuItem onClick={() => handleRemoteNavigation('/cart')}>Checkout → Cart</MenuItem>
                <MenuItem onClick={() => handleRemoteNavigation('/checkout')}>Checkout → Checkout</MenuItem>
                <Divider />
                <MenuItem onClick={() => handleRemoteNavigation('/wishlist')}>Wishlist → Wishlist</MenuItem>
                <Divider />
                <MenuItem onClick={() => handleRemoteNavigation('/account')}>Account → Profile</MenuItem>
                <MenuItem onClick={() => handleRemoteNavigation('/account/addresses')}>Account → Addresses</MenuItem>
                <Divider />
                <MenuItem onClick={() => handleRemoteNavigation('/debug/remotes')}>Shell → Remote Showcase</MenuItem>
                <Divider />
                <MenuItem
                  data-skip-logical-error="true"
                  onClick={() => {
                    handleRemotesMenuClose();
                    triggerMFMismatchedExport();
                  }}
                >
                  Remote module import
                </MenuItem>
                <MenuItem
                  data-skip-logical-error="true"
                  onClick={() => {
                    handleRemotesMenuClose();
                    triggerMFShareScopeMismatch();
                  }}
                >
                  Remote init
                </MenuItem>
                <MenuItem
                  data-skip-logical-error="true"
                  onClick={() => {
                    handleRemotesMenuClose();
                    triggerChunkLoadFailure();
                  }}
                >
                  Open offers
                </MenuItem>
                <MenuItem
                  data-skip-logical-error="true"
                  onClick={() => {
                    handleRemotesMenuClose();
                    triggerAbortRace();
                  }}
                >
                  Refresh prices
                </MenuItem>
                <MenuItem
                  data-skip-logical-error="true"
                  onClick={() => {
                    handleRemotesMenuClose();
                    triggerNetworkFailure();
                  }}
                >
                  Sync account
                </MenuItem>
              </Menu>
            </Box>

            {/* Right side - Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1,
              }}>
              {/* Fail Mode Checkbox - Desktop Only */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={failModeEnabled}
                    onChange={(e) => setFailMode(e.target.checked)}
                    // Reason: allow toggling fail mode OFF even when logical error injection is active.
                    inputProps={{ 'data-skip-logical-error': 'true' }}
                  />
                }
                sx={{ 
                  ml: 1,
                  display: { xs: 'none', md: 'flex' }, // Hide on mobile, show on desktop
                }}
              />

              {/* Search Icon */}
              <IconButton
                color="inherit"
                sx={{ 
                  color: 'text.primary',
                  '&:hover': {
                    background: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <SearchIcon />
              </IconButton>

              {/* Wishlist Icon */}
              <IconButton
                color="inherit"
                onClick={() => handleNavigation('/wishlist')}
                sx={{ 
                  color: 'text.primary',
                  '&:hover': {
                    background: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <Badge
                  badgeContent={wishlistCount}
                  color="secondary"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.7rem',
                      minWidth: '18px',
                      height: '18px',
                      borderRadius: '9px',
                      fontWeight: 600,
                    },
                  }}
                >
                  <FavoriteIcon />
                </Badge>
              </IconButton>

              {/* Cart Icon */}
              <IconButton
                color="inherit"
                onClick={() => handleNavigation('/cart')}
                sx={{ 
                  color: 'text.primary',
                  position: 'relative',
                  '&:hover': {
                    background: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                <Badge
                  badgeContent={getCartItemCount()}
                  color="secondary"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.7rem',
                      minWidth: '18px',
                      height: '18px',
                      borderRadius: '9px',
                      fontWeight: 600,
                    },
                  }}
                >
                  <CartIcon />
                </Badge>
              </IconButton>

              {/* User Menu */}
              {isAuthenticated ? (
                <>
                  <IconButton
                    color="inherit"
                    onClick={handleUserMenuOpen}
                    sx={{ 
                      ml: 1,
                      '&:hover': {
                        background: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        background: 'linear-gradient(135deg, #d4af37 0%, #e6c866 100%)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#1a1a1a',
                      }}
                    >
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleUserMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    PaperProps={{
                      sx: {
                        mt: 1,
                        minWidth: 200,
                        borderRadius: 3,
                        boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
                        border: '1px solid rgba(0, 0, 0, 0.08)',
                      },
                    }}
                  >
                    <MenuItem disabled sx={{ opacity: 0.7 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" />
                        <Typography variant="body2" fontWeight={500}>
                          {user?.name || user?.email}
                        </Typography>
                      </Box>
                    </MenuItem>
                    <Divider />
                    <MenuItem
                      onClick={() => {
                        // Reason: account pages live in a dedicated MFE (`shophub-account`).
                        handleUserMenuClose();
                        navigate('/account');
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon fontSize="small" />
                        <Typography>My Account</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LogoutIcon fontSize="small" />
                        <Typography>Sign Out</Typography>
                      </Box>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, ml: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => handleNavigation('/login')}
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: 'rgba(0, 0, 0, 0.2)',
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: 'text.primary',
                        background: 'rgba(0, 0, 0, 0.02)',
                      },
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleNavigation('/signup')}
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #d4af37 0%, #e6c866 100%)',
                      color: '#1a1a1a',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #b8941f 0%, #d4af37 100%)',
                      },
                    }}
                  >
                    Join
                  </Button>
                </Box>
              )}

              {/* Mobile Menu Button */}
              <IconButton
                color="inherit"
                onClick={toggleMobileMenu}
                sx={{ 
                  display: { xs: 'flex', md: 'none' },
                  ml: 1,
                  color: 'text.primary',
                }}
              >
                {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Menu */}
      <Slide direction="down" in={mobileMenuOpen} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            zIndex: 1100,
            pt: '80px',
            pb: 3,
          }}
        >
          <Container maxWidth="xl">
            <Box sx={{ py: 2 }}>
              <Button
                fullWidth
                variant="text"
                onClick={handleRemotesMenuOpen}
                sx={{
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'text.primary',
                  py: 1.5,
                }}
                startIcon={<AppsIcon />}
              >
                REMOTES
              </Button>

              <Menu
                anchorEl={remotesAnchorEl}
                open={Boolean(remotesAnchorEl)}
                onClose={handleRemotesMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 260,
                    borderRadius: 3,
                    boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.12)',
                    border: '1px solid rgba(0, 0, 0, 0.08)',
                  },
                }}
              >
                <MenuItem onClick={() => handleRemoteNavigation('/login')}>Auth → Login</MenuItem>
                <MenuItem onClick={() => handleRemoteNavigation('/signup')}>Auth → Sign up</MenuItem>
                <Divider />
                <MenuItem onClick={() => handleRemoteNavigation('/products')}>Catalog → Products</MenuItem>
                <MenuItem onClick={() => handleRemoteNavigation('/collections')}>Catalog → Collections</MenuItem>
                <MenuItem onClick={() => handleRemoteNavigation('/about')}>Catalog → About</MenuItem>
                <Divider />
                <MenuItem onClick={() => handleRemoteNavigation('/cart')}>Checkout → Cart</MenuItem>
                <MenuItem onClick={() => handleRemoteNavigation('/checkout')}>Checkout → Checkout</MenuItem>
                <Divider />
                <MenuItem onClick={() => handleRemoteNavigation('/wishlist')}>Wishlist → Wishlist</MenuItem>
                <Divider />
                <MenuItem onClick={() => handleRemoteNavigation('/account')}>Account → Profile</MenuItem>
                <MenuItem onClick={() => handleRemoteNavigation('/account/addresses')}>Account → Addresses</MenuItem>
                <Divider />
                <MenuItem onClick={() => handleRemoteNavigation('/debug/remotes')}>Shell → Remote Showcase</MenuItem>
                <Divider />
                <MenuItem
                  data-skip-logical-error="true"
                  onClick={() => {
                    handleRemotesMenuClose();
                    triggerMFMismatchedExport();
                  }}
                >
                  Remote module import
                </MenuItem>
                <MenuItem
                  data-skip-logical-error="true"
                  onClick={() => {
                    handleRemotesMenuClose();
                    triggerMFShareScopeMismatch();
                  }}
                >
                  Remote init
                </MenuItem>
                <MenuItem
                  data-skip-logical-error="true"
                  onClick={() => {
                    handleRemotesMenuClose();
                    triggerChunkLoadFailure();
                  }}
                >
                  Open offers
                </MenuItem>
                <MenuItem
                  data-skip-logical-error="true"
                  onClick={() => {
                    handleRemotesMenuClose();
                    triggerAbortRace();
                  }}
                >
                  Refresh prices
                </MenuItem>
                <MenuItem
                  data-skip-logical-error="true"
                  onClick={() => {
                    handleRemotesMenuClose();
                    triggerNetworkFailure();
                  }}
                >
                  Sync account
                </MenuItem>
              </Menu>

              <Button
                fullWidth
                variant="text"
                onClick={() => handleNavigation('/products')}
                sx={{ 
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  color: 'text.primary',
                  py: 1.5,
                }}
              >
                SHOP
              </Button>
              <Button
                fullWidth
                variant="text"
                sx={{ 
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  color: 'text.primary',
                  py: 1.5,
                }}
              >
                COLLECTIONS
              </Button>
              <Button
                fullWidth
                variant="text"
                sx={{ 
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  color: 'text.primary',
                  py: 1.5,
                }}
              >
                ABOUT
              </Button>
              
              {/* Fail Mode Checkbox for Mobile */}
              <FormControlLabel
                control={
                  <Checkbox
                    checked={failModeEnabled}
                    onChange={(e) => setFailMode(e.target.checked)}
                    // Reason: allow toggling fail mode OFF even when logical error injection is active.
                    inputProps={{ 'data-skip-logical-error': 'true' }}
                  />
                }
                sx={{ 
                  mt: 2,
                  display: { xs: 'flex', md: 'none' }, // Show on mobile, hide on desktop
                }}
              />
              
              {!isAuthenticated && (
                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => handleNavigation('/login')}
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    onClick={() => handleNavigation('/signup')}
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Join
                  </Button>
                </Box>
              )}
            </Box>
          </Container>
        </Box>
      </Slide>

      {/* Spacer for fixed navbar */}
      <Box sx={{ height: scrolled ? '70px' : '80px' }} />
    </>
  );
};

export default Navbar;
