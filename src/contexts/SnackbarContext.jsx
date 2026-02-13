/* eslint-disable react-refresh/only-export-components */
// Reason: context modules intentionally export both Provider components and hooks (e.g. `useSnackbar`).
import React, { createContext, useContext, useState } from 'react';
import { Snackbar, Alert, Box } from '@mui/material';

// Create snackbar context for managing global notifications
const SnackbarContext = createContext();

// Custom hook to use snackbar context
export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};

// Snackbar provider component
export const SnackbarProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info', // 'error', 'warning', 'info', 'success'
    duration: 4000, // Auto-close duration in milliseconds
  });

  // Show success message
  const showSuccess = (message, duration = 4000) => {
    setSnackbar({
      open: true,
      message,
      severity: 'success',
      duration,
    });
  };

  // Show error message
  const showError = (message, duration = 4000) => {
    setSnackbar({
      open: true,
      message,
      severity: 'error',
      duration,
    });
  };

  // Show warning message
  const showWarning = (message, duration = 4000) => {
    setSnackbar({
      open: true,
      message,
      severity: 'warning',
      duration,
    });
  };

  // Show info message
  const showInfo = (message, duration = 4000) => {
    setSnackbar({
      open: true,
      message,
      severity: 'info',
      duration,
    });
  };

  // Close snackbar
  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Context value object
  const value = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    closeSnackbar,
  };

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      
      {/* Global Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.duration}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{
          '& .MuiSnackbar-root': {
            zIndex: 9999,
          },
        }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: '100%',
            borderRadius: 2,
            fontWeight: 500,
            '& .MuiAlert-message': {
              fontSize: '0.9rem',
            },
            // Custom styling for different severities
            '&.MuiAlert-standardError': {
              background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
              color: '#ffffff',
            },
            '&.MuiAlert-standardSuccess': {
              background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
              color: '#ffffff',
            },
            '&.MuiAlert-standardWarning': {
              background: 'linear-gradient(135deg, #ed6c02 0%, #e65100 100%)',
              color: '#ffffff',
            },
            '&.MuiAlert-standardInfo': {
              background: 'linear-gradient(135deg, #0288d1 0%, #01579b 100%)',
              color: '#ffffff',
            },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};
