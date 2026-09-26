import type { NextConfig } from 'next';
const config: NextConfig = {
  poweredByHeader: false, turbopack: { root: process.cwd() },
  serverExternalPackages: ['bcrypt', '@prisma/client', '@prisma/adapter-pg', 'pg'],
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'same-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Cache-Control', value: 'no-store' }
    ] }];
  }
};
export default config;
