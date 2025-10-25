# COOP Fix for Google Sign-In (Next.js on Vercel)

**Error you saw:**
```
Cross-Origin-Opener-Policy policy would block the window.frames call.
```
This happens when the main page sets `Cross-Origin-Opener-Policy: same-origin`. Google OAuth popup
needs to access `window.opener` across origins to complete the sign-in handshake.

**Fix:** Set
```
Cross-Origin-Opener-Policy: same-origin-allow-popups
```
so popups can still communicate with the opener. This patch adds that header while keeping a strict CSP
allowlist for Firebase/Google domains.

## How to use
1. Replace your project root `next.config.js` with the one from this ZIP.
2. Redeploy to Vercel.
3. Try Google Sign-In again.

> If you still see issues, consider falling back to `signInWithRedirect` inside your login function.
