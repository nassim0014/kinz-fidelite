import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Card URLs carry the customer's secret token: never leak them to other sites.
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

// Dev server only: let phones on the same Wi-Fi load the app through APP_URL's host.
const appHost = process.env.APP_URL ? new URL(process.env.APP_URL).hostname : undefined;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  allowedDevOrigins: appHost ? [appHost] : [],
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
