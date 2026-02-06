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

  const authRemoteUrl = process.env.SHOPHUB_AUTH_REMOTE_URL ?? 'http://localhost:5174/remoteEntry.js';
  const catalogRemoteUrl = process.env.SHOPHUB_CATALOG_REMOTE_URL ?? 'http://localhost:5175/remoteEntry.js';
  const checkoutRemoteUrl = process.env.SHOPHUB_CHECKOUT_REMOTE_URL ?? 'http://localhost:5176/remoteEntry.js';

  return {
    name: 'shophub-shell',
    mode: isProd ? 'production' : 'development',
    entry: path.resolve(__dirname, 'src', 'main.jsx'),
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProd ? 'assets/[name].[contenthash].js' : 'assets/[name].js',
      chunkFilename: isProd ? 'assets/[name].[contenthash].js' : 'assets/[name].js',
      assetModuleFilename: 'assets/[name].[contenthash][ext][query]',
      // IMPORTANT for Module Federation:
      // Reason: ensures chunks load correctly no matter what origin serves them (dev/prod/CDN).
      publicPath: 'auto',
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
        remotes: {
          // Note: the `auth@` prefix is required by Webpack Module Federation.
          auth: `auth@${authRemoteUrl}`,
          catalog: `catalog@${catalogRemoteUrl}`,
          checkout: `checkout@${checkoutRemoteUrl}`,
        },
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

