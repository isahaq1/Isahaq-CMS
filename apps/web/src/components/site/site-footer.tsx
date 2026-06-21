'use client';

import type { NavItem, NavStyle } from '@group-cms/shared';

export interface SiteFooterProps {
  items: NavItem[];
  primaryColor: string;
  settings?: NavStyle;
}

const PAD_Y: Record<string, string> = { sm: 'py-5', md: 'py-10', lg: 'py-16' };

export function SiteFooter({ items, primaryColor, settings = {} }: SiteFooterProps) {
  const s = settings;

  if (s.footerHidden === true) return null;

  const visibleItems = items.filter((i) => !i.isHidden);

  const groups: { label: string; links: NavItem[] }[] = [];
  const flat: NavItem[] = [];

  visibleItems.forEach((item) => {
    if (item.type === 'dropdown' && item.children && item.children.length > 0) {
      groups.push({ label: item.label, links: item.children.filter((c) => !c.isHidden && c.type !== 'separator') });
    } else if (item.type !== 'separator') {
      flat.push(item);
    }
  });

  const year = new Date().getFullYear();
  const copyright = s.footerText || `© ${year}. All rights reserved.`;

  const bg = s.footerBg || '#f9fafb';
  const bodyText = s.footerTextColor || '#6b7280';
  const headingColor = s.footerHeadingColor || '#9ca3af';
  const linkColor = s.footerLinkColor || '#6b7280';
  const linkHover = s.hoverTextColor || primaryColor;
  const borderColor = s.footerBorderColor || '#e5e7eb';
  const bottomBg = s.footerBottomBg || 'transparent';
  const bottomText = s.footerBottomTextColor || '#9ca3af';
  const padY = PAD_Y[s.footerPaddingY || 'md'];
  const showDivider = s.footerDivider !== false;
  const showCopyright = s.footerShowCopyright !== false;
  const showContent = s.footerShowContent !== false;
  const footerContent = s.footerContent || '';

  const topBorder = showDivider ? `1px solid ${borderColor}` : 'none';

  return (
    <footer style={{ backgroundColor: bg, borderTop: topBorder }}>
      <div className={`max-w-6xl mx-auto px-6 ${padY}`}>

        {/* Main content area */}
        {showContent && (footerContent ? (
          <div
            className="footer-rich-content prose prose-sm max-w-none"
            style={{
              color: bodyText,
              '--footer-link-color': linkColor,
              '--footer-link-hover': linkHover,
              '--footer-heading-color': headingColor,
            } as React.CSSProperties}
            dangerouslySetInnerHTML={{ __html: footerContent }}
          />
        ) : (
          /* Legacy nav items layout */
          (() => {
            const hasColumns = groups.length > 0;
            if (!hasColumns && flat.length === 0) return null;
            return (
              <div className={`grid gap-10 mb-8 ${hasColumns ? 'md:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]' : ''}`}>
                {flat.length > 0 && (
                  <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {flat.map((item) => (
                      <li key={item.id}>
                        <a href={item.url}
                          target={item.openInNewTab ? '_blank' : undefined}
                          rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                          className="text-sm transition-colors"
                          style={{ color: linkColor }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = linkHover)}
                          onMouseLeave={(e) => (e.currentTarget.style.color = linkColor)}>
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                {groups.map((group) => (
                  <div key={group.label}>
                    <h4 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: headingColor }}>
                      {group.label}
                    </h4>
                    <ul className="space-y-2">
                      {group.links.map((link) => (
                        <li key={link.id}>
                          <a href={link.url}
                            target={link.openInNewTab ? '_blank' : undefined}
                            rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
                            className="text-sm transition-colors"
                            style={{ color: linkColor }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = linkHover)}
                            onMouseLeave={(e) => (e.currentTarget.style.color = linkColor)}>
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            );
          })()
        ))}

        {/* Copyright bar */}
        {showCopyright && (
          <div className="mt-8 pt-5 text-xs text-center"
            style={{ borderTop: `1px solid ${borderColor}`, backgroundColor: bottomBg, color: bottomText }}>
            {copyright}
          </div>
        )}
      </div>
    </footer>
  );
}
