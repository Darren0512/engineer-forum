/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // 🔒 Security headers
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(), interest-cohort=()' },

          // ✅ FIX: allow OAuth popup to communicate with opener (Google uses window.opener)
          // If this is 'same-origin' the popup cannot call window.opener on a different origin.
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },

          // CSP (kept strict, with Google/Firebase allowlist)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' https:;",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.gstatic.com https://apis.google.com https://www.googletagmanager.com;",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
              "img-src 'self' data: https: blob:;",
              "font-src 'self' https://fonts.gstatic.com data:;",
              "connect-src 'self' https://firestore.googleapis.com https://*.googleapis.com https://*.firebaseio.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://accounts.google.com https://apis.google.com;",
              "frame-src 'self' https://accounts.google.com https://*.google.com https://*.gstatic.com;",
              "frame-ancestors 'none';",
            ].join(' ')
          },
        ],
      },
      {
        // Preview URLs should not be indexed
        source: '/(.*)',
        has: [{ type: 'header', key: 'host', value: '(.*)-vercel\\.app' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex' }],
      },
    ];
  },
};

module.exports = nextConfig;
