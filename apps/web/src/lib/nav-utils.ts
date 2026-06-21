import type { NavItem } from '@group-cms/shared';

/**
 * Resolves nav item URLs relative to a base path.
 * e.g. `/about` → `/preview/abc123/about`
 * External links (http/https/mailto) are left unchanged.
 */
export function resolveNavUrl(url: string, basePath: string): string {
  if (!url) return url;
  if (url.startsWith('http') || url.startsWith('//') || url.startsWith('mailto:') || url.startsWith('tel:')) {
    return url;
  }
  if (url === '/') return basePath || '/';
  if (url.startsWith('/')) return `${basePath}${url}`;
  return url;
}

export function resolveNavItems(items: NavItem[], basePath: string): NavItem[] {
  return items.map((item) => ({
    ...item,
    url: resolveNavUrl(item.url, basePath),
    children: item.children ? resolveNavItems(item.children, basePath) : undefined,
  }));
}
