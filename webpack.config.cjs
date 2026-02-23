/**
 * Webpack config for `shophub-shell` (host MFE).
 *
 * Migration note:
 * - Replaces Vite + `@originjs/vite-plugin-federation` with Webpack 5 Module Federation.
 * - Remotes now default to `http://localhost:<port>/remoteEntry.js` (root),
 *   instead of Vite's `.../assets/remoteEntry.js`.
 *
 * Production note:
 * - Remote URLs are configurable via env vars so the same build can point at deployed remotes:
 *   - `SHOPHUB_AUTH_REMOTE_URL`
 *   - `SHOPHUB_CATALOG_REMOTE_URL`
 *   - `SHOPHUB_CHECKOUT_REMOTE_URL`
 */
const path = require('node:path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

const pkg = require('./package.json');
const deps = pkg.dependencies ?? {};

function getInstalledVersion(pkgName) {
  // Reason: some packages (notably MUI) resolve to a subpath that doesn't include a version in its own package.json.
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    return require(`${pkgName}/package.json`).version;
  } catch {
    return deps[pkgName];
  }
}

module.exports = (_env, argv) => {
  const isProd = argv.mode === 'production';

  // Zipy config (optional).
  // Reason: enable sourcemap-mapped stack traces in Zipy by ensuring `zipy.init(..., { releaseVer })`
  // uses the same version as your `zipy-cli --releaseVer` uploads.
  const zipySdkUrl =
    process.env.ZIPY_SDK_URL ?? 'https://storage.googleapis.com/zipy-cdn-staging/sdk/latest/zipy.min.umd.js';
  const zipyProjectKey = process.env.ZIPY_PROJECT_KEY ?? '';
  const zipyReleaseVer = process.env.ZIPY_RELEASE_VER ?? process.env.SHOPHUB_RELEASE_VER ?? pkg.version;

  // const authRemoteUrl = process.env.SHOPHUB_AUTH_REMOTE_URL ?? 'http://localhost:5174/remoteEntry.js';
  // const catalogRemoteUrl = process.env.SHOPHUB_CATALOG_REMOTE_URL ?? 'http://localhost:5175/remoteEntry.js';
  // const checkoutRemoteUrl = process.env.SHOPHUB_CHECKOUT_REMOTE_URL ?? 'http://localhost:5176/remoteEntry.js';
  // const wishlistRemoteUrl = process.env.SHOPHUB_WISHLIST_REMOTE_URL ?? 'http://localhost:5177/remoteEntry.js';
  // const accountRemoteUrl = process.env.SHOPHUB_ACCOUNT_REMOTE_URL ?? 'http://localhost:5178/remoteEntry.js';

  const authRemoteUrl =
    process.env.SHOPHUB_AUTH_REMOTE_URL ??
    (isProd ? 'https://shophub-auth-2.netlify.app/remoteEntry.js' : 'https://shophub-auth-2.netlify.app/remoteEntry.js');
  const catalogRemoteUrl =
    process.env.SHOPHUB_CATALOG_REMOTE_URL ??
    (isProd ? 'https://shophub-catalog-2.netlify.app/remoteEntry.js' : 'https://shophub-catalog-2.netlify.app/remoteEntry.js');
  const checkoutRemoteUrl =
    process.env.SHOPHUB_CHECKOUT_REMOTE_URL ??
    (isProd ? 'https://shophub-checkout-2.netlify.app/remoteEntry.js' : 'https://shophub-checkout-2.netlify.app/remoteEntry.js');
  const wishlistRemoteUrl =
    process.env.SHOPHUB_WISHLIST_REMOTE_URL ??
    (isProd ? 'https://shophub-wishlist-2.netlify.app/remoteEntry.js' : 'https://shophub-wishlist-2.netlify.app/remoteEntry.js');
  const accountRemoteUrl =
    process.env.SHOPHUB_ACCOUNT_REMOTE_URL ??
    (isProd ? 'https://shophub-account-2.netlify.app/remoteEntry.js' : 'https://shophub-account-2.netlify.app/remoteEntry.js');


  // Support 5+ remotes without editing this config:
  // - Set `SHOPHUB_REMOTES` to a JSON object mapping remoteName -> remoteEntryUrl
  //   Example:
  //   SHOPHUB_REMOTES='{"auth":"https://auth.netlify.app/remoteEntry.js","catalog":"https://catalog.netlify.app/remoteEntry.js","checkout":"https://checkout.netlify.app/remoteEntry.js","search":"https://search.netlify.app/remoteEntry.js"}'
  function parseJsonEnv(varName) {
    const raw = process.env[varName];
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(`[shophub-shell] Ignoring invalid ${varName} JSON: ${e?.message ?? e}`);
      return null;
    }
  }

  const extraRemotes = parseJsonEnv('SHOPHUB_REMOTES') ?? {};
  const remoteUrls = {
    auth: authRemoteUrl,
    catalog: catalogRemoteUrl,
    checkout: checkoutRemoteUrl,
    wishlist: wishlistRemoteUrl,
    account: accountRemoteUrl,
    ...extraRemotes,
  };
  const mfRemotes = Object.fromEntries(
    Object.entries(remoteUrls).map(([remoteName, remoteEntryUrl]) => [remoteName, `${remoteName}@${remoteEntryUrl}`]),
  );

  return {
    name: 'shophub-shell',
    mode: isProd ? 'production' : 'development',
    entry: path.resolve(__dirname, 'src', 'main.jsx'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProd ? 'assets/[name].[contenthash].js' : 'assets/[name].js',
      chunkFilename: isProd ? 'assets/[name].[contenthash].js' : 'assets/[name].js',
      assetModuleFilename: 'assets/[name].[contenthash][ext][query]',
      // FIX: Use '/' instead of 'auto' for the shell (host) application.
      // Reason: 'auto' relies on document.currentScript.src at runtime to resolve chunk URLs, but
      // in Module Federation setups with multiple external scripts (analytics SDKs, remote entries),
      // the auto-detection can resolve to an incorrect origin (e.g. http://localhost:9/), causing
      // ChunkLoadError for the shell's own lazy-loaded chunks.
      // The shell always serves from the root path so '/' is deterministic and correct.
      // Note: remotes are unaffected — each remote's webpack runtime manages its own publicPath.
      publicPath: '/',
      clean: true,
      uniqueName: 'shophub-shell',
    },
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.[jt]sx?$/,
          exclude: /node_modules/,
          // Reason: preserve Vite-style extensionless imports in ESM projects (`"type": "module"`).
          resolve: { fullySpecified: false },
          use: {
            loader: 'babel-loader',
          },
        },
        {
          test: /\.css$/i,
          use: [isProd ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader'],
        },
        {
          test: /\.(png|jpe?g|gif|svg|woff2?|eot|ttf|otf)$/i,
          type: 'asset',
        },
      ],
    },
    plugins: [
      new ModuleFederationPlugin({
        name: 'shophub-shell',
        remotes: mfRemotes,
        // IMPORTANT: shell owns state; share runtime libs as singletons.
        shared: {
          react: { singleton: true, eager: true, requiredVersion: deps.react },
          'react-dom': { singleton: true, eager: true, requiredVersion: deps['react-dom'] },
          'react-router-dom': { singleton: true, requiredVersion: deps['react-router-dom'] },
          '@emotion/react': { singleton: true, requiredVersion: deps['@emotion/react'] },
          '@emotion/styled': { singleton: true, requiredVersion: deps['@emotion/styled'] },
          '@mui/material': {
            singleton: true,
            requiredVersion: deps['@mui/material'],
            version: getInstalledVersion('@mui/material'),
          },
          // NOTE: do not share `@mui/icons-material`.
          // Reason: keep parity with the previous Vite setup; icons are safe to duplicate.
        },
      }),

      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'index.html'),
        // These options become available to the HTML template.
        zipySdkUrl,
        zipyProjectKey,
        zipyReleaseVer,
        // IMPORTANT: ensure injected asset URLs are absolute (e.g. `/assets/main.js`),
        // otherwise deep routes like `/debug/remotes` would try to load `/debug/assets/main.js` and 404.
        publicPath: '/',
      }),

      // Vite used to copy `public/` into `dist/`. Keep that behavior (Netlify _redirects, vite.svg, etc).
      new CopyWebpackPlugin({
        patterns: [{ from: 'public', to: '.', noErrorOnMissing: true }],
      }),

      ...(isProd ? [new MiniCssExtractPlugin({ filename: 'assets/[name].[contenthash].css' })] : []),
    ],
    devtool: isProd ? 'source-map' : 'eval-cheap-module-source-map',
    devServer: {
      port: 5173,
      // Note: webpack-dev-server will fail if the port is in use (similar to Vite `strictPort`).
      historyApiFallback: true,
      static: {
        directory: path.resolve(__dirname, 'public'),
        publicPath: '/',
      },
      hot: true,
      liveReload: true,
      client: {
        overlay: true,
      },
      allowedHosts: 'all',
    },
    performance: {
      hints: false,
    },
  };
};

