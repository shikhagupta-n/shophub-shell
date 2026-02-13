import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { ensureObservabilityGlobals } from './utils/observability.js';
import { installChunkLoadRecovery } from './utils/chunkLoadRecovery.js';

// Ensure GA/Zipy globals exist in local/isolated runs.
// Reason: page/components may call `window.gtag` and should not crash without the script tag.
ensureObservabilityGlobals();

// Install a one-time recovery for Webpack ChunkLoadError edge cases.
// Reason: users can have stale HTML cached after deploys, leading to missing hashed chunk files.
installChunkLoadRecovery();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

