import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

export default function DeferredPanel() {
  return (
    <Box sx={{ p: 2 }}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
          Offers
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Loading…
        </Typography>
      </Paper>
    </Box>
  );
}

