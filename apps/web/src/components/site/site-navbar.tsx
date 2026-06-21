'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { NavItem, NavStyle } from '@group-cms/shared';
import { cn } from '@/lib/utils';

const ICON_EMOJI: Record<string, string> = {
  home: '🏠', info: 'ℹ️', phone: '📞', mail: '✉️', shop: '🛍️',
  blog: '📝', star: '⭐', heart: '❤️', globe: '🌐', lock: '🔒', user: '👤', arrow: '→',
};

const HEIGHT_CLASS: Record<string, string> = { sm: 'h-12', md: 'h-16', lg: 'h-20' };
const SHADOW_CLASS: Record<string, string> = { none: '', sm: 'shadow-sm', md: 'shadow-md', lg: 'shadow-lg' };

export interface SiteNavbarProps {
  items: NavItem[];
  logo?: string;
  companyName: string;
  primaryColor: string;
  sticky?: boolean;
  logoHref?: string;
  settings?: NavStyle;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hex2rgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity / 100})`;
}

function resolveNavBg(s: NavStyle): React.CSSProperties {
  const opacity = s.bgOpacity ?? 100;
  const hex = s.bgColor || '#ffffff';
  if (opacity < 100) {
    return { backgroundColor: hex2rgba(hex.startsWith('#') ? hex : '#ffffff', opacity) };
  }
  return { backgroundColor: hex };
}

// ── Desktop dropdown item ─────────────────────────────────────────────────────

function DropdownItem({ item, primaryColor, s }: { item: NavItem; primaryColor: string; s: NavStyle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open_ = () => { if (timer.current) clearTimeout(timer.current); setOpen(true); };
  const close_ = () => { timer.current = setTimeout(() => setOpen(false), 120); };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const ctaBg = s.ctaBgColor || primaryColor;
  const ctaText = s.ctaTextColor || '#ffffff';
  const ctaRadius = s.ctaBorderRadius || '0.5rem';
  const linkText = s.textColor || '#374151';
  const hoverText = s.hoverTextColor || '#111827';
  const hoverBg = s.hoverBgColor || '#f3f4f6';
  const dropdownBg = s.dropdownBg || '#ffffff';
  const dropdownText = s.dropdownTextColor || '#374151';
  const dropdownBorder = s.dropdownBorderColor || '#f3f4f6';

  if (item.type === 'separator') {
    return <div className="w-px h-5 mx-1 self-center" style={{ backgroundColor: dropdownBorder }} />;
  }

  if (item.type === 'button') {
    return (
      <a href={item.url}
        target={item.openInNewTab ? '_blank' : undefined}
        rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
        className={cn('px-4 py-2 text-sm font-semibold transition hover:opacity-90', item.cssClass)}
        style={{ backgroundColor: ctaBg, color: ctaText, borderRadius: ctaRadius }}>
        {item.icon && <span className="mr-1.5">{ICON_EMOJI[item.icon] || ''}</span>}
        {item.label}
        {item.badge && (
          <span className="ml-1.5 px-1.5 py-0.5 text-xs font-bold rounded"
            style={{ backgroundColor: item.badgeColor || '#16a34a', color: 'white' }}>
            {item.badge}
          </span>
        )}
      </a>
    );
  }

  const hasChildren = (item.children || []).filter((c) => !c.isHidden).length > 0;

  if (hasChildren) {
    return (
      <div className="relative" ref={ref} onMouseEnter={open_} onMouseLeave={close_}>
        <button
          className={cn('flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors', item.cssClass)}
          style={{ color: linkText }}
          onMouseEnter={(e) => { e.currentTarget.style.color = hoverText; e.currentTarget.style.backgroundColor = hoverBg; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = linkText; e.currentTarget.style.backgroundColor = 'transparent'; }}
          onClick={() => setOpen((v) => !v)}>
          {item.icon && <span>{ICON_EMOJI[item.icon] || ''}</span>}
          {item.label}
          {item.badge && (
            <span className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded text-white"
              style={{ backgroundColor: item.badgeColor || primaryColor }}>{item.badge}</span>
          )}
          <svg className={cn('w-3.5 h-3.5 opacity-50 transition-transform ml-0.5', open && 'rotate-180')}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div
            className="absolute left-0 top-full mt-1 w-52 rounded-xl shadow-lg border py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            style={{ backgroundColor: dropdownBg, borderColor: dropdownBorder }}
            onMouseEnter={open_} onMouseLeave={close_}>
            {(item.children || []).filter((c) => !c.isHidden).map((child) => (
              <DropdownChild key={child.id} item={child} primaryColor={primaryColor}
                textColor={dropdownText} hoverBg={hoverBg} hoverText={hoverText} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <a href={item.url}
      target={item.openInNewTab ? '_blank' : undefined}
      rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
      className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors', item.cssClass)}
      style={{ color: linkText }}
      onMouseEnter={(e) => { e.currentTarget.style.color = hoverText; e.currentTarget.style.backgroundColor = hoverBg; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = linkText; e.currentTarget.style.backgroundColor = 'transparent'; }}>
      {item.icon && <span>{ICON_EMOJI[item.icon] || ''}</span>}
      {item.label}
      {item.badge && (
        <span className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded text-white"
          style={{ backgroundColor: item.badgeColor || primaryColor }}>{item.badge}</span>
      )}
    </a>
  );
}

function DropdownChild({ item, primaryColor, textColor, hoverBg, hoverText }: {
  item: NavItem; primaryColor: string;
  textColor: string; hoverBg: string; hoverText: string;
}) {
  if (item.type === 'separator') return <hr className="my-1" style={{ borderColor: '#e5e7eb' }} />;
  return (
    <a href={item.url}
      target={item.openInNewTab ? '_blank' : undefined}
      rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
      className={cn('flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors', item.cssClass)}
      style={{ color: item.type === 'button' ? primaryColor : textColor }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = hoverBg; e.currentTarget.style.color = hoverText; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = item.type === 'button' ? primaryColor : textColor; }}>
      {item.icon && <span className="w-5 text-center">{ICON_EMOJI[item.icon] || ''}</span>}
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className="px-1.5 py-0.5 text-xs font-bold rounded text-white"
          style={{ backgroundColor: item.badgeColor || primaryColor }}>{item.badge}</span>
      )}
    </a>
  );
}

// ── Mobile item ───────────────────────────────────────────────────────────────

function MobileItem({ item, primaryColor, s, onClose }: {
  item: NavItem; primaryColor: string; s: NavStyle; onClose: () => void;
}) {
  const [open, setOpen] = useState(false);
  const children = (item.children || []).filter((c) => !c.isHidden);
  const ctaBg = s.ctaBgColor || primaryColor;
  const ctaText = s.ctaTextColor || '#ffffff';
  const ctaRadius = s.ctaBorderRadius || '0.75rem';
  const linkText = s.textColor || '#374151';

  if (item.type === 'separator') return <hr className="border-gray-100" />;

  if (item.type === 'button') {
    return (
      <a href={item.url}
        target={item.openInNewTab ? '_blank' : undefined}
        rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
        onClick={onClose}
        className="block mx-4 my-1 px-4 py-2.5 text-sm font-semibold text-center"
        style={{ backgroundColor: ctaBg, color: ctaText, borderRadius: ctaRadius }}>
        {item.icon && <span className="mr-1.5">{ICON_EMOJI[item.icon] || ''}</span>}
        {item.label}
      </a>
    );
  }

  if (children.length > 0) {
    return (
      <div>
        <button onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-gray-50"
          style={{ color: linkText }}>
          {item.icon && <span>{ICON_EMOJI[item.icon] || ''}</span>}
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge && (
            <span className="px-1.5 py-0.5 text-xs font-bold rounded text-white"
              style={{ backgroundColor: item.badgeColor || primaryColor }}>{item.badge}</span>
          )}
          <svg className={cn('w-4 h-4 opacity-40 transition-transform', open && 'rotate-180')}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="bg-gray-50 border-y border-gray-100">
            {children.map((child) => (
              <a key={child.id} href={child.url}
                target={child.openInNewTab ? '_blank' : undefined}
                rel={child.openInNewTab ? 'noopener noreferrer' : undefined}
                onClick={onClose}
                className="flex items-center gap-3 px-8 py-2.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                {child.icon && <span>{ICON_EMOJI[child.icon] || ''}</span>}
                {child.label}
                {child.badge && (
                  <span className="ml-auto px-1.5 py-0.5 text-xs font-bold rounded text-white"
                    style={{ backgroundColor: child.badgeColor || primaryColor }}>{child.badge}</span>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <a href={item.url}
      target={item.openInNewTab ? '_blank' : undefined}
      rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
      onClick={onClose}
      className={cn('flex items-center gap-3 px-4 py-3 text-sm font-medium hover:bg-gray-50', item.cssClass)}
      style={{ color: linkText }}>
      {item.icon && <span>{ICON_EMOJI[item.icon] || ''}</span>}
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className="px-1.5 py-0.5 text-xs font-bold rounded text-white"
          style={{ backgroundColor: item.badgeColor || primaryColor }}>{item.badge}</span>
      )}
    </a>
  );
}

// ── Main SiteNavbar ───────────────────────────────────────────────────────────

export function SiteNavbar({
  items, logo, companyName, primaryColor,
  sticky = false, logoHref = '/', settings = {},
}: SiteNavbarProps) {
  const s = settings;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const visibleItems = items.filter((i) => !i.isHidden);

  const handleScroll = useCallback(() => setScrolled(window.scrollY > 8), []);
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
  useEffect(() => {
    const r = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);

  if (s.navHidden === true) return null;

  const bgStyle = resolveNavBg(s);
  const heightClass = HEIGHT_CLASS[s.height || 'md'];
  const isSticky = s.navSticky ?? sticky;
  const shadowClass = SHADOW_CLASS[s.shadow || (scrolled && isSticky ? 'md' : 'none')];
  const borderClass = s.borderBottom !== false ? 'border-b' : '';
  const borderStyle = s.borderColor ? { borderColor: s.borderColor } : {};
  const blurClass = (s.bgBlur && (s.bgOpacity ?? 100) < 100) ? 'backdrop-blur-md' : '';
  const logoTextColor = s.logoTextColor || primaryColor;
  const showLogo = s.navShowLogo !== false;
  const showCompanyName = !logo || s.navShowCompanyName === true;
  const showMenu = s.navShowMenu !== false;
  const showMobileMenu = s.navShowMobileMenu !== false;

  return (
    <>
      <header
        className={cn(
          'w-full z-40 transition-all duration-200',
          isSticky ? 'sticky top-0' : 'relative',
          borderClass,
          shadowClass,
          blurClass,
        )}
        style={{ ...bgStyle, ...borderStyle }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className={cn('flex items-center justify-between', heightClass)}>
            {/* Logo */}
            {showLogo && (
              <a href={logoHref} className="flex items-center gap-2.5 shrink-0">
                {logo && <img src={logo} alt={companyName} className="h-8 w-auto object-contain" />}
                {showCompanyName && (
                  <span className="text-lg font-bold" style={{ color: logoTextColor }}>{companyName}</span>
                )}
              </a>
            )}

            {/* Desktop nav */}
            {showMenu && (
              <nav className="hidden md:flex items-center gap-1">
                {visibleItems.map((item) => (
                  <DropdownItem key={item.id} item={item} primaryColor={primaryColor} s={s} />
                ))}
              </nav>
            )}

            {/* Mobile hamburger */}
            {showMobileMenu && (
              <button
                className="md:hidden p-2 rounded-lg transition-colors"
                style={{ color: s.textColor || '#4b5563' }}
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle menu">
                {mobileOpen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {showMobileMenu && mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 md:hidden"
            onClick={() => setMobileOpen(false)} />
          <div className="fixed top-0 left-0 right-0 z-50 md:hidden shadow-xl border-b max-h-screen overflow-y-auto"
            style={{ backgroundColor: s.bgColor || '#ffffff', marginTop: s.height === 'lg' ? '5rem' : s.height === 'sm' ? '3rem' : '4rem' }}>
            <div className="py-2">
              {visibleItems.map((item) => (
                <MobileItem key={item.id} item={item} primaryColor={primaryColor}
                  s={s} onClose={() => setMobileOpen(false)} />
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
