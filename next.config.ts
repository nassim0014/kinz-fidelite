import type { NextConfig } from 'next';
import { securityHeaders } from './src/lib/security-headers';

// Dev server only: let phones on the same Wi-Fi load the app through APP_URL's host.
const appHost = process.env.APP_URL ? new URL(process.env.APP_URL).hostname : undefined;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The store's Docker image runs the self-contained server (see Dockerfile).
  output: process.env.BUILD_STANDALONE === '1' ? 'standalone' : undefined,
  allowedDevOrigins: appHost ? [appHost] : [],
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders() }];
  },
};

export default nextConfig;
