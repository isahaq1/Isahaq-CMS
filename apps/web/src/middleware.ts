import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const INTERNAL_API =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000/api';

const APP_DOMAIN = (process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost').toLowerCase();

// Paths that must never be rewritten — dashboard, preview, Next.js internals, static assets
const SKIP_PREFIXES = [
  '/_next', '/_vercel', '/preview', '/dashboard', '/login',
  '/api', '/uploads', '/favicon', '/robots', '/sitemap',
];

// Simple in-memory cache: domain → { siteId, expires }
const cache = new Map<string, { siteId: string; expires: number }>();

async function resolveSiteId(domain: string): Promise<string | null> {
  const hit = cache.get(domain);
  if (hit && hit.expires > Date.now()) return hit.siteId;

  try {
    const res = await fetch(
      `${INTERNAL_API}/public/domain?host=${encodeURIComponent(domain)}`,
      { cache: 'no-store' },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const siteId: string | undefined = json?.data?.id;
    if (!siteId) return null;
    cache.set(domain, { siteId, expires: Date.now() + 60_000 }); // cache 60s
    return siteId;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const domain = host.split(':')[0].toLowerCase().replace(/^www\./, '');

  // Pass through requests to the app's own domain or localhost
  if (domain === 'localhost' || domain === '127.0.0.1' || domain === APP_DOMAIN) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Skip internal paths
  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const siteId = await resolveSiteId(domain);
  if (!siteId) return NextResponse.next();

  // Rewrite: mysite.com/about → /preview/[siteId]/about
  const url = request.nextUrl.clone();
  url.pathname = `/preview/${siteId}${pathname === '/' ? '' : pathname}`;

  const response = NextResponse.rewrite(url);
  // Tell the preview page it's served via a custom domain (used to fix nav link basePath)
  response.cookies.set('_cms_domain', siteId, {
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    maxAge: 3600,
  });
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
