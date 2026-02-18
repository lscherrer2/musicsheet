import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  // Use the minified pdfjs-dist build (pdf.min.mjs) instead of pdf.mjs.
  // The unminified pdf.mjs contains its own embedded webpack runtime
  // (__webpack_require__) which conflicts with Turbopack/webpack when
  // they try to re-process it, causing "Object.defineProperty called on
  // non-object" errors.
  turbopack: {
    resolveAlias: {
      'pdfjs-dist': path.join(
        __dirname,
        'node_modules/react-pdf/node_modules/pdfjs-dist/build/pdf.min.mjs',
      ),
      'pdfjs-dist/build/pdf.worker.min.mjs': path.join(
        __dirname,
        'node_modules/react-pdf/node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
      ),
    },
  },
  webpack: (config) => {
    // Same alias for webpack (used in production builds)
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      'pdfjs-dist': path.resolve(
        'node_modules/react-pdf/node_modules/pdfjs-dist/build/pdf.min.mjs',
      ),
    };
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
};

export default nextConfig;
