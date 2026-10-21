import path from 'node:path';

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['@forgekit/core', '@forgekit/templates'],
  // Trace from the monorepo root so the workspace packages and the templates'
  // content files (read from disk at runtime) land inside the serverless
  // function bundles on Vercel.
  outputFileTracingRoot: path.join(__dirname, '../../'),
  outputFileTracingIncludes: {
    '/build/*': ['../../packages/templates/templates/**/*', '../../packages/core/dist/**/*'],
    '/api/plan': ['../../packages/templates/templates/**/*', '../../packages/core/dist/**/*'],
    '/api/download': ['../../packages/templates/templates/**/*', '../../packages/core/dist/**/*'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
