import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

// Vite Module Federation host (shell) app.
// Reason: the shell owns routing/layout and composes remote MFEs at runtime.
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shophub-shell',
      remotes: {
        auth: 'http://localhost:5174/assets/remoteEntry.js',
        catalog: 'http://localhost:5175/assets/remoteEntry.js',
        checkout: 'http://localhost:5176/assets/remoteEntry.js',
      },
      // IMPORTANT: shell owns state; share runtime libs as singletons.
      shared: {
        react: { singleton: true, eager: true },
        'react-dom': { singleton: true, eager: true },
        'react-router-dom': { singleton: true },
        '@emotion/react': { singleton: true },
        '@emotion/styled': { singleton: true },
        '@mui/material': { singleton: true },
        // NOTE: do not share `@mui/icons-material`.
        // Reason: `@originjs/vite-plugin-federation` can fail to auto-detect its version in dev
        // and crash the shell with "No description file or no version... @mui/icons-material(undefined)".
        // Icons are stateless; duplicating them across MFEs is safe.
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
});

