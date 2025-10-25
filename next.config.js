/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(), interest-cohort=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' https:;",
              // Firebase + Google OAuth scripts
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://apis.google.com https://www.googletagmanager.com;",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
              "img-src 'self' data: https: blob:;",
              "font-src 'self' https://fonts.gstatic.com data:;",
              // IMPORTANT: allow Google OAuth endpoints for popup / token exchange
              "connect-src 'self' https://firestore.googleapis.com https://*.googleapis.com https://*.firebaseio.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://accounts.google.com https://apis.google.com;",
              // Allow OAuth popups/iframes
              "frame-src 'self' https://accounts.google.com https://*.google.com https://*.gstatic.com;",
              "frame-ancestors 'none';",
            ].join(' ')
          },
        ],
      },
      {
        // Preview noindex
        source: '/(.*)',
        has: [{ type: 'header', key: 'host', value: '(.*)-vercel\\.app' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
    ];
  },
};

module.exports = nextConfig;
