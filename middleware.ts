
import { NextResponse, NextRequest } from 'next/server';

export const config = {
  matcher: [
    '/api/:path*',
    '/posts/:path*/comments',
    '/posts/:path*/like',
    '/create',
  ],
};

const WINDOW_MS = 10_000;
const MAX_COUNT = 5;

function parseCookie(req: NextRequest) {
  try {
    const raw = req.cookies.get('rl')?.value;
    if (!raw) return { c: 0, t: Date.now() };
    const { c, t } = JSON.parse(atob(raw));
    return { c: Number(c) || 0, t: Number(t) || Date.now() };
  } catch {
    return { c: 0, t: Date.now() };
  }
}

function encodeCookie(obj: any) {
  return btoa(JSON.stringify(obj));
}

export default async function middleware(req: NextRequest) {
  if (req.method !== 'POST') return NextResponse.next();

  const { c, t } = parseCookie(req);
  const now = Date.now();
  let count = c;
  let ts = t;

  if (now - ts > WINDOW_MS) {
    count = 0;
    ts = now;
  }
  count += 1;

  const res = NextResponse.next();
  res.headers.set('X-RateLimit-Limit', String(MAX_COUNT));
  res.headers.set('X-RateLimit-Remaining', String(Math.max(0, MAX_COUNT - count)));
  res.headers.set('X-RateLimit-Reset', String(ts + WINDOW_MS));

  // FIX: sameSite must be lowercase string literal 'lax' to satisfy ResponseCookie type
  res.cookies.set('rl', encodeCookie({ c: count, t: ts }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 5,
  });

  if (count > MAX_COUNT) {
    return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
      status: 429,
      headers: { 'content-type': 'application/json' },
    });
  }
  return res;
}
