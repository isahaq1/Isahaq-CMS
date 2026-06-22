'use client';

import React, { useState, useEffect } from 'react';
import type { PageBlock, BlockType } from '@group-cms/shared';
import {
  Star, Zap, Shield, ChevronLeft, ChevronRight,
  Heart, Check, Globe, Settings, Lock, Rocket, Clock,
  Users, Mail, Phone, Code, Database, Cloud, Award,
  Lightbulb, Target, TrendingUp, Layers, Box, Cpu,
  Eye, Headphones, Map, MessageCircle, Smile, Thumbsup,
  Wrench, BarChart, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function resolveText(value: unknown, lang: string): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    const obj = value as Record<string, string>;
    return obj[lang] || obj['en'] || Object.values(obj)[0] || '';
  }
  return String(value);
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Star, Zap, Shield, Heart, Check, Globe, Settings, Lock, Rocket, Clock,
  Users, Mail, Phone, Code, Database, Cloud, Award, Lightbulb, Target,
  TrendingUp, Layers, Box, Cpu, Eye, Headphones, Map, MessageCircle,
  Smile, Thumbsup, Wrench, BarChart, Search,
};

// Maps shorthand font keys to CSS font-family stacks
const FONT_FAMILY_MAP: Record<string, string> = {
  sans: 'system-ui, -apple-system, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
  mono: '"Courier New", Courier, monospace',
  inter: '"Inter", system-ui, sans-serif',
  roboto: '"Roboto", system-ui, sans-serif',
  opensans: '"Open Sans", system-ui, sans-serif',
  lato: '"Lato", system-ui, sans-serif',
  montserrat: '"Montserrat", system-ui, sans-serif',
  poppins: '"Poppins", system-ui, sans-serif',
  playfair: '"Playfair Display", Georgia, serif',
  merriweather: '"Merriweather", Georgia, serif',
};

// Google Fonts names to load dynamically
const GOOGLE_FONTS: Record<string, string> = {
  inter: 'Inter',
  roboto: 'Roboto',
  opensans: 'Open+Sans',
  lato: 'Lato',
  montserrat: 'Montserrat',
  poppins: 'Poppins',
  playfair: 'Playfair+Display',
  merriweather: 'Merriweather',
};

// Animation keyframes injected once per animation type
const ANIMATION_CSS: Record<string, string> = {
  'fade-in': `@keyframes cms-fade-in{from{opacity:0}to{opacity:1}}.cms-fade-in{animation:cms-fade-in 0.6s ease-in-out both}`,
  'slide-up': `@keyframes cms-slide-up{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}.cms-slide-up{animation:cms-slide-up 0.6s ease-out both}`,
  'slide-down': `@keyframes cms-slide-down{from{opacity:0;transform:translateY(-28px)}to{opacity:1;transform:translateY(0)}}.cms-slide-down{animation:cms-slide-down 0.6s ease-out both}`,
  'zoom-in': `@keyframes cms-zoom-in{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}.cms-zoom-in{animation:cms-zoom-in 0.5s ease-out both}`,
  'zoom-out': `@keyframes cms-zoom-out{from{opacity:0;transform:scale(1.06)}to{opacity:1;transform:scale(1)}}.cms-zoom-out{animation:cms-zoom-out 0.5s ease-out both}`,
};

function getAppearance(props: Record<string, unknown>, primaryColor: string) {
  const accent = props.accentColor ? String(props.accentColor) : primaryColor;
  const fontKey = String(props.fontFamily || '');
  const fontFamily = fontKey ? (FONT_FAMILY_MAP[fontKey] || fontKey) : undefined;
  const googleFont = fontKey ? GOOGLE_FONTS[fontKey] : undefined;

  // Heading style
  const headingStyle: React.CSSProperties = {};
  if (props.headingColor) headingStyle.color = String(props.headingColor);
  if (fontFamily) headingStyle.fontFamily = fontFamily;
  const fwMap: Record<string, number> = { normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 };
  if (fwMap[String(props.fontWeight || '')]) headingStyle.fontWeight = fwMap[String(props.fontWeight || '')];
  const hszMap: Record<string, string> = { sm: '1.125rem', base: '1.5rem', lg: '1.875rem', xl: '2.25rem', '2xl': '3rem', '3xl': '3.75rem' };
  if (hszMap[String(props.headingSize || '')]) headingStyle.fontSize = hszMap[String(props.headingSize || '')];
  const lsMap: Record<string, string> = { tight: '-0.03em', normal: '0', wide: '0.05em', wider: '0.1em', widest: '0.2em' };
  if (lsMap[String(props.letterSpacing || '')]) headingStyle.letterSpacing = lsMap[String(props.letterSpacing || '')];
  const ttVal = String(props.textTransform || '');
  if (ttVal) headingStyle.textTransform = ttVal as React.CSSProperties['textTransform'];

  // Body style
  const bodyStyle: React.CSSProperties = {};
  if (props.textColor) bodyStyle.color = String(props.textColor);
  if (fontFamily) bodyStyle.fontFamily = fontFamily;
  const lhMap: Record<string, string> = { tight: '1.25', normal: '1.5', relaxed: '1.75', loose: '2' };
  if (lhMap[String(props.lineHeight || '')]) bodyStyle.lineHeight = lhMap[String(props.lineHeight || '')];

  // Card style
  const cardStyle: React.CSSProperties = {};
  if (props.cardBg) cardStyle.backgroundColor = String(props.cardBg);
  if (props.cardBorderColor) cardStyle.border = `1px solid ${String(props.cardBorderColor)}`;
  const brMap: Record<string, string> = { none: '0', sm: '0.25rem', md: '0.5rem', lg: '0.75rem', xl: '1rem', '2xl': '1.5rem', full: '9999px' };
  if (brMap[String(props.borderRadius || '')]) cardStyle.borderRadius = brMap[String(props.borderRadius || '')];
  const shMap: Record<string, string> = {
    none: 'none',
    sm: '0 1px 3px rgba(0,0,0,0.08)',
    md: '0 4px 6px rgba(0,0,0,0.07)',
    lg: '0 10px 20px rgba(0,0,0,0.09)',
    xl: '0 20px 40px rgba(0,0,0,0.12)',
  };
  if (shMap[String(props.shadow || '')]) cardStyle.boxShadow = shMap[String(props.shadow || '')];

  // Wrapper overrides
  const wrapOverride: React.CSSProperties = {};
  const mwMap: Record<string, string> = { xs: '32rem', sm: '42rem', md: '56rem', lg: '72rem', xl: '80rem', full: '100%' };
  if (mwMap[String(props.contentMaxWidth || '')]) wrapOverride.maxWidth = mwMap[String(props.contentMaxWidth || '')];
  const cpx = Number(props.contentPaddingX);
  if (cpx) { wrapOverride.paddingLeft = `${cpx}px`; wrapOverride.paddingRight = `${cpx}px`; }
  const cpy = Number(props.contentPaddingY);
  if (cpy) { wrapOverride.paddingTop = `${cpy}px`; wrapOverride.paddingBottom = `${cpy}px`; }

  // Grid/item spacing
  const gridGap = Number(props.gridGap) ? `${Number(props.gridGap)}px` : undefined;
  const itemPadding: React.CSSProperties = {};
  const ipx = Number(props.itemPaddingX), ipy = Number(props.itemPaddingY);
  if (ipx) { itemPadding.paddingLeft = `${ipx}px`; itemPadding.paddingRight = `${ipx}px`; }
  if (ipy) { itemPadding.paddingTop = `${ipy}px`; itemPadding.paddingBottom = `${ipy}px`; }

  // Image controls
  const imageStyle: React.CSSProperties = {};
  if (props.imageObjectFit) imageStyle.objectFit = String(props.imageObjectFit) as React.CSSProperties['objectFit'];
  if (props.imageObjectPosition) imageStyle.objectPosition = String(props.imageObjectPosition);
  const imgH = Number(props.imageHeight);
  if (imgH) imageStyle.height = `${imgH}px`;
  if (!imgH) imageStyle.height = '12rem'; // default 192px

  // Block-level
  const blockOpacity = Number(props.blockOpacity) || 1;
  const ctaVariant = String(props.ctaStyle || 'filled');
  const animateOnScroll = String(props.animateOnScroll || '');
  const customCss = String(props.customCss || '');

  return { accent, fontFamily, googleFont, headingStyle, bodyStyle, cardStyle, wrapOverride, gridGap, itemPadding, imageStyle, blockOpacity, ctaVariant, animateOnScroll, customCss };
}

type AppearanceResult = ReturnType<typeof getAppearance>;
type Slide = { src: string; alt: unknown; title?: unknown; subtitle?: unknown; link?: string };

// Convert any video platform watch URL to its embeddable equivalent.
// Falls back to the URL as-is (e.g. user already provided an embed URL).
function toEmbedUrl(url: string): string {
  if (!url) return '';
  // YouTube: watch?v=, youtu.be/, shorts/, already embed/
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  // Vimeo
  const vimeo = url.match(/(?:vimeo\.com\/)(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  // Dailymotion
  const dm = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
  if (dm) return `https://www.dailymotion.com/embed/video/${dm[1]}`;
  // Wistia
  const wistia = url.match(/wistia\.(?:com|net)\/medias\/([a-zA-Z0-9]+)/);
  if (wistia) return `https://fast.wistia.net/embed/iframe/${wistia[1]}`;
  // Facebook video
  const fb = url.match(/facebook\.com\/.*\/videos\/(\d+)/);
  if (fb) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`;
  // Return as-is — covers other platforms' embed URLs and direct video files
  return url;
}

function isDirectVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

// ── Countdown Block ───────────────────────────────────────────────────────────

function CountdownBlock({ block, ap }: { block: PageBlock; ap: AppearanceResult }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);
  const target = String(block.props.targetDate || '');

  useEffect(() => {
    if (!target) return;
    const calc = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) { setExpired(true); setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setExpired(false);
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [target]);

  const units = [
    { v: timeLeft.days, label: 'Days', show: block.props.showDays !== false },
    { v: timeLeft.hours, label: 'Hours', show: block.props.showHours !== false },
    { v: timeLeft.minutes, label: 'Minutes', show: block.props.showMinutes !== false },
    { v: timeLeft.seconds, label: 'Seconds', show: block.props.showSeconds !== false },
  ].filter((u) => u.show);

  return (
    <section className="max-w-4xl mx-auto px-6 py-12 text-center" style={ap.wrapOverride}>
      {!!block.props.title && (
        <h2 className="text-3xl font-bold mb-8" style={ap.headingStyle}>
          {String(block.props.title)}
        </h2>
      )}
      {!target ? (
        <p className="text-gray-400 italic">Set a target date in the block properties to start the countdown.</p>
      ) : expired ? (
        <p className="text-3xl font-semibold" style={{ color: ap.accent }}>🎉 Time&rsquo;s up!</p>
      ) : (
        <div className="flex justify-center gap-4 flex-wrap">
          {units.map((unit) => (
            <div key={unit.label} className="flex flex-col items-center"
              style={{ minWidth: '5rem', padding: '1.5rem 1rem', ...ap.cardStyle, ...ap.itemPadding }}>
              <span className="text-5xl font-bold tabular-nums leading-none"
                style={{ color: ap.accent, fontFamily: ap.headingStyle.fontFamily }}>
                {String(unit.v).padStart(2, '0')}
              </span>
              <span className="text-xs font-medium mt-2 uppercase tracking-wide" style={{ color: ap.bodyStyle.color || '#6b7280' }}>
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      )}
      {!!block.props.subtitle && (
        <p className="mt-6 text-sm" style={ap.bodyStyle}>{String(block.props.subtitle)}</p>
      )}
    </section>
  );
}

// ── FAQ Accordion Block ───────────────────────────────────────────────────────

function FaqBlock({ block, ap, lang }: { block: PageBlock; ap: AppearanceResult; lang: string }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const items = (block.props.items as { question: unknown; answer: unknown }[]) || [];

  return (
    <section className="max-w-3xl mx-auto px-6 py-12" style={ap.wrapOverride}>
      {!!block.props.title && (
        <h2 className="text-3xl font-bold text-center mb-10" style={ap.headingStyle}>
          {resolveText(block.props.title, lang)}
        </h2>
      )}
      <div className="space-y-2">
        {items.map((item, i) => {
          const isOpen = openIdx === i;
          return (
            <div key={i} style={ap.cardStyle} className="overflow-hidden">
              <button
                className="w-full text-left flex items-center justify-between px-5 py-4 font-semibold transition-colors hover:opacity-80"
                style={{ ...ap.headingStyle, fontWeight: ap.headingStyle.fontWeight || 600 }}
                onClick={() => setOpenIdx(isOpen ? null : i)}
              >
                <span>{resolveText(item.question, lang)}</span>
                <span className="ml-4 shrink-0 text-xl leading-none transition-transform"
                  style={{ color: ap.accent, transform: isOpen ? 'rotate(45deg)' : 'none' }}>
                  +
                </span>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-sm leading-relaxed border-t"
                  style={{ borderColor: ap.cardStyle.border ? undefined : '#f3f4f6', ...ap.bodyStyle }}>
                  {resolveText(item.answer, lang)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Tabs Block ────────────────────────────────────────────────────────────────

function TabsBlock({ block, ap }: { block: PageBlock; ap: AppearanceResult }) {
  const tabs = (block.props.tabs as { label: string; content: string }[]) || [];
  const [active, setActive] = useState(0);
  const safeActive = tabs.length > 0 ? Math.min(active, tabs.length - 1) : 0;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8" style={ap.wrapOverride}>
      {!!block.props.title && (
        <h2 className="text-2xl font-bold mb-6" style={ap.headingStyle}>{String(block.props.title)}</h2>
      )}
      {/* Tab bar */}
      <div className="flex border-b overflow-x-auto" style={{ gap: '0' }}>
        {tabs.map((tab, i) => (
          <button key={i}
            className="px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px"
            style={{
              borderBottomColor: safeActive === i ? ap.accent : 'transparent',
              color: safeActive === i ? ap.accent : (ap.bodyStyle.color || '#6b7280'),
            }}
            onClick={() => setActive(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Tab content */}
      {tabs[safeActive] && (
        <div className="py-6 prose prose-sm max-w-none" style={ap.bodyStyle}
          dangerouslySetInnerHTML={{ __html: tabs[safeActive].content }} />
      )}
    </div>
  );
}

function renderButton(ap: AppearanceResult, href: string, text: string, className = '') {
  const base = `inline-block px-8 py-3 font-semibold transition hover:opacity-90 ${className}`;
  const br = ap.cardStyle.borderRadius || '0.5rem';
  if (ap.ctaVariant === 'outline') {
    return (
      <a href={href} className={base} style={{ borderRadius: br, border: `2px solid ${ap.accent}`, color: ap.accent, backgroundColor: 'transparent' }}>
        {text}
      </a>
    );
  }
  if (ap.ctaVariant === 'ghost') {
    return (
      <a href={href} className={base} style={{ color: ap.accent, textDecoration: 'underline' }}>
        {text}
      </a>
    );
  }
  return (
    <a href={href} className={base} style={{ borderRadius: br, backgroundColor: ap.accent, color: '#ffffff' }}>
      {text}
    </a>
  );
}

function renderHeroButton(ap: AppearanceResult, href: string, text: string) {
  const base = 'inline-block px-8 py-3 font-semibold transition hover:opacity-90';
  const br = ap.cardStyle.borderRadius || '0.5rem';
  if (ap.ctaVariant === 'outline') {
    return <a href={href} className={base} style={{ borderRadius: br, border: '2px solid white', color: 'white', backgroundColor: 'transparent' }}>{text}</a>;
  }
  if (ap.ctaVariant === 'ghost') {
    return <a href={href} className={base} style={{ color: 'white', textDecoration: 'underline' }}>{text}</a>;
  }
  return <a href={href} className={base} style={{ borderRadius: br, backgroundColor: 'white', color: ap.accent }}>{text}</a>;
}

function SliderBlock({
  block, isPreview, language = 'en', ap,
}: {
  block: PageBlock; isPreview?: boolean; language?: string;
  ap: AppearanceResult;
}) {
  const slides = (block.props.slides as Slide[]) || [];
  const count = slides.length;
  const [active, setActive] = useState(0);
  const safeActive = count > 0 ? active % count : 0;
  const overlayColor = String(block.props.overlayColor || '#000000');
  const overlayOpacity = Number(block.props.overlayOpacity ?? 0.4);

  useEffect(() => {
    if (!isPreview || !block.props.autoplay || count <= 1) return;
    const id = setInterval(() => setActive((a) => (a + 1) % count), Number(block.props.interval) || 4000);
    return () => clearInterval(id);
  }, [isPreview, block.props.autoplay, block.props.interval, count]);

  if (count === 0) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8" style={ap.wrapOverride}>
        <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
          No slides added
        </div>
      </div>
    );
  }

  const slide = slides[safeActive];
  const title = resolveText(slide.title, language);
  const subtitle = resolveText(slide.subtitle, language);
  const hasH = Number(ap.imageStyle.height);
  const containerStyle: React.CSSProperties = {
    ...(hasH ? { height: ap.imageStyle.height } : {}),
    ...ap.cardStyle,
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8" style={ap.wrapOverride}>
      <div className={cn('relative overflow-hidden bg-black', !hasH && 'aspect-video')} style={containerStyle}>
        <img src={slide.src} alt={resolveText(slide.alt, language)} className="w-full h-full"
          style={{ objectFit: (ap.imageStyle.objectFit as React.CSSProperties['objectFit']) || 'cover', objectPosition: ap.imageStyle.objectPosition || 'center' }} />
        {(title || subtitle) && (
          <>
            <div className="absolute inset-0" style={{ backgroundColor: overlayColor, opacity: overlayOpacity }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-8" style={{ zIndex: 1 }}>
              {title && <h2 className="text-3xl font-bold mb-2" style={ap.headingStyle}>{title}</h2>}
              {subtitle && <p className="text-xl mb-4" style={ap.bodyStyle}>{subtitle}</p>}
              {slide.link && renderHeroButton(ap, slide.link, 'Learn More')}
            </div>
          </>
        )}
        {!!block.props.showArrows && count > 1 && (
          <>
            <button onClick={() => setActive((a) => (a - 1 + count) % count)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition shadow"
              style={{ zIndex: 2 }}>
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button onClick={() => setActive((a) => (a + 1) % count)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition shadow"
              style={{ zIndex: 2 }}>
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
          </>
        )}
      </div>
      {!!block.props.showDots && count > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setActive(i)} className="w-2.5 h-2.5 rounded-full transition-opacity"
              style={{ backgroundColor: ap.accent, opacity: i === safeActive ? 1 : 0.3 }} />
          ))}
        </div>
      )}
    </div>
  );
}

interface BlockRendererProps {
  block: PageBlock;
  isPreview?: boolean;
  primaryColor?: string;
  language?: string;
}

export function BlockRenderer({ block, isPreview = false, primaryColor = '#2563eb', language = 'en' }: BlockRendererProps) {
  const { type, props } = block;
  const t = (v: unknown) => resolveText(v, language);
  const ap = getAppearance(props, primaryColor);

  // Load Google Fonts dynamically when a web font is selected
  useEffect(() => {
    if (!ap.googleFont || typeof document === 'undefined') return;
    const id = `gfont-${ap.googleFont}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${ap.googleFont}:wght@400;500;600;700;800&display=swap`;
    document.head.appendChild(link);
  }, [ap.googleFont]);

  // Section-level wrapper style
  const sectionStyle: React.CSSProperties = {};
  const bgType = String(props.sectionBgType || '');
  if (bgType === 'gradient') {
    const from = String(props.sectionGradientFrom || '#667eea');
    const to = String(props.sectionGradientTo || '#764ba2');
    const dir = String(props.sectionGradientDir || 'to bottom right');
    sectionStyle.backgroundImage = `linear-gradient(${dir}, ${from}, ${to})`;
  } else if (props.sectionBg) {
    sectionStyle.backgroundColor = String(props.sectionBg);
  }
  if (Number(props.sectionPaddingTop)) sectionStyle.paddingTop = `${Number(props.sectionPaddingTop)}px`;
  if (Number(props.sectionPaddingBottom)) sectionStyle.paddingBottom = `${Number(props.sectionPaddingBottom)}px`;
  if (Number(props.sectionMinHeight)) sectionStyle.minHeight = `${Number(props.sectionMinHeight)}px`;
  const swMap: Record<string, string> = { narrow: '48rem', wide: '80rem', full: '100%' };
  if (swMap[String(props.sectionWidth || '')]) { sectionStyle.maxWidth = swMap[String(props.sectionWidth || '')]; sectionStyle.marginLeft = 'auto'; sectionStyle.marginRight = 'auto'; }
  if (props.sectionBorderTop) sectionStyle.borderTop = `3px solid ${String(props.sectionBorderTop)}`;
  if (props.sectionBorderBottom) sectionStyle.borderBottom = `3px solid ${String(props.sectionBorderBottom)}`;
  if (ap.blockOpacity !== 1) sectionStyle.opacity = ap.blockOpacity;

  // Animation + custom CSS injection
  const animClass = ap.animateOnScroll ? `cms-${ap.animateOnScroll}` : '';
  const injectCss = (ap.animateOnScroll ? (ANIMATION_CSS[ap.animateOnScroll] || '') : '') + (ap.customCss || '');

  let content: React.ReactNode;

  switch (type as BlockType) {
    case 'hero': {
      const overlayColor = String(props.overlayColor || '#000000');
      const overlayOpacity = Number(props.overlayOpacity ?? 0.5);
      content = (
        <section
          className="relative flex items-center justify-center overflow-hidden"
          style={{
            minHeight: '400px',
            ...(props.backgroundImage
              ? { backgroundImage: `url(${props.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: `linear-gradient(135deg,${ap.accent},${ap.accent}cc)` }),
          }}
        >
          {!!props.backgroundImage && (
            <div className="absolute inset-0" style={{ backgroundColor: overlayColor, opacity: overlayOpacity }} />
          )}
          <div
            className="relative z-10 max-w-4xl w-full mx-auto px-6 py-16 text-white"
            style={{ textAlign: props.alignment === 'left' ? 'left' : 'center', ...ap.wrapOverride }}
          >
            <h1 className="text-5xl font-bold mb-4" style={ap.headingStyle}>{t(props.title)}</h1>
            <p className="text-xl opacity-90 mb-8" style={ap.bodyStyle}>{t(props.subtitle)}</p>
            {!!props.ctaText && renderHeroButton(ap, String(props.ctaLink), t(props.ctaText))}
          </div>
        </section>
      );
      break;
    }

    case 'heading': {
      const level = String(props.level || 'h2');
      const defaultSizes: Record<string, string> = { h1: '2.25rem', h2: '1.875rem', h3: '1.5rem', h4: '1.25rem' };
      const mergedH: React.CSSProperties = { fontSize: defaultSizes[level] || '1.875rem', fontWeight: 700, ...ap.headingStyle };
      const ta = (String(props.alignment || 'left')) as React.CSSProperties['textAlign'];
      const El = level as 'h1' | 'h2' | 'h3' | 'h4';
      content = (
        <div className="max-w-4xl mx-auto px-6 py-4" style={{ textAlign: ta, ...ap.wrapOverride }}>
          <El style={mergedH}>{t(props.text)}</El>
        </div>
      );
      break;
    }

    case 'text':
      content = (
        <div
          className={cn('max-w-4xl mx-auto px-6 py-4 prose prose-lg', `text-${props.alignment}`)}
          style={{ ...ap.bodyStyle, ...ap.wrapOverride }}
          dangerouslySetInnerHTML={{ __html: t(props.content) }}
        />
      );
      break;

    case 'image':
      content = (
        <figure
          className="max-w-4xl mx-auto px-6 py-4"
          style={{ ...(props.width === 'full' ? { maxWidth: '100%' } : {}), ...ap.wrapOverride }}
        >
          {props.src ? (
            <img src={String(props.src)} alt={t(props.alt)} className="w-full"
              style={{ ...ap.cardStyle, objectFit: (ap.imageStyle.objectFit as React.CSSProperties['objectFit']) || 'cover', height: ap.imageStyle.height !== '12rem' ? ap.imageStyle.height : 'auto' }} />
          ) : (
            <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400" style={ap.cardStyle}>
              No image selected
            </div>
          )}
          {!!props.caption && (
            <figcaption className="text-center text-sm mt-2" style={{ color: ap.bodyStyle.color || '#6b7280' }}>
              {t(props.caption)}
            </figcaption>
          )}
        </figure>
      );
      break;

    case 'gallery': {
      const images = (props.images as { src: string; alt: string }[]) || [];
      const cols = Number(props.columns) || 3;
      const gap = ap.gridGap || '1rem';
      const imgStyle: React.CSSProperties = { width: '100%', ...ap.imageStyle, ...ap.cardStyle };
      content = (
        <div className="max-w-6xl mx-auto px-6 py-8" style={ap.wrapOverride}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap }}>
            {images.length > 0
              ? images.map((img, i) => <img key={i} src={img.src} alt={img.alt} style={imgStyle} />)
              : Array.from({ length: cols }).map((_, i) => (
                  <div key={i} style={{ height: ap.imageStyle.height, backgroundColor: '#f3f4f6', borderRadius: ap.cardStyle.borderRadius || '0.5rem' }} />
                ))}
          </div>
        </div>
      );
      break;
    }

    case 'slider':
      content = <SliderBlock block={block} isPreview={isPreview} language={language} ap={ap} />;
      break;

    case 'video': {
      const rawVideoUrl = String(props.url || '');
      const embedVideoUrl = toEmbedUrl(rawVideoUrl);
      content = (
        <div className="max-w-4xl mx-auto px-6 py-8" style={ap.wrapOverride}>
          {rawVideoUrl ? (
            <div className="aspect-video overflow-hidden bg-black"
              style={{ borderRadius: ap.cardStyle.borderRadius || '0.75rem', boxShadow: ap.cardStyle.boxShadow }}>
              {isDirectVideoFile(rawVideoUrl) ? (
                <video src={rawVideoUrl} className="w-full h-full" controls />
              ) : (
                <iframe
                  src={embedVideoUrl}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              )}
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-400" style={ap.cardStyle}>
              No video URL
            </div>
          )}
        </div>
      );
      break;
    }

    case 'cta': {
      const ctaBg = props.cardBg ? String(props.cardBg) : ap.accent;
      const ctaCardBr = ap.cardStyle.borderRadius || '1rem';
      content = (
        <section className="max-w-4xl mx-auto px-6 py-12" style={ap.wrapOverride}>
          <div className="p-12 text-center text-white"
            style={{ backgroundColor: ctaBg, borderRadius: ctaCardBr, boxShadow: ap.cardStyle.boxShadow }}>
            <h2 className="text-3xl font-bold mb-4" style={ap.headingStyle}>{t(props.title)}</h2>
            <p className="text-lg opacity-90 mb-8" style={ap.bodyStyle}>{t(props.description)}</p>
            {renderButton(ap, String(props.buttonLink), t(props.buttonText))}
          </div>
        </section>
      );
      break;
    }

    case 'features': {
      const items = (props.items as { icon: string; title: unknown; description: unknown }[]) || [];
      const cols = Number(props.columns) || 3;
      const gap = ap.gridGap || '2rem';
      const featureCardStyle: React.CSSProperties = { padding: '1.5rem', textAlign: 'center', ...ap.cardStyle, ...ap.itemPadding };
      content = (
        <section className="max-w-6xl mx-auto px-6 py-12" style={ap.wrapOverride}>
          {!!props.title && <h2 className="text-3xl font-bold text-center mb-12" style={ap.headingStyle}>{t(props.title)}</h2>}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap }}>
            {items.map((item, i) => {
              const Icon = iconMap[item.icon] || Star;
              return (
                <div key={i} style={featureCardStyle}>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${ap.accent}20`, color: ap.accent }}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2" style={ap.headingStyle}>{resolveText(item.title, language)}</h3>
                  <p style={{ color: ap.bodyStyle.color || '#4b5563', lineHeight: ap.bodyStyle.lineHeight }}>{resolveText(item.description, language)}</p>
                </div>
              );
            })}
          </div>
        </section>
      );
      break;
    }

    case 'testimonials': {
      const items = (props.items as { name: string; role: string; company: string; text: unknown; avatar: string }[]) || [];
      const gap = ap.gridGap || '2rem';
      const cardStyle: React.CSSProperties = { backgroundColor: '#ffffff', padding: '1.5rem', ...ap.cardStyle, ...ap.itemPadding };
      content = (
        <section className="max-w-6xl mx-auto px-6 py-12" style={ap.wrapOverride}>
          {!!props.title && <h2 className="text-3xl font-bold text-center mb-12" style={ap.headingStyle}>{t(props.title)}</h2>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap }}>
            {items.map((item, i) => (
              <div key={i} style={cardStyle}>
                <p className="italic mb-4" style={{ color: ap.bodyStyle.color || '#4b5563', lineHeight: ap.bodyStyle.lineHeight }}>
                  &ldquo;{resolveText(item.text, language)}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                    {item.avatar && <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={ap.headingStyle}>{item.name}</p>
                    <p className="text-xs text-gray-500">{item.role}{item.company ? `, ${item.company}` : ''}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
      break;
    }

    case 'team': {
      const members = (props.members as { name: string; role: string; image: string }[]) || [];
      const cols = Number(props.columns) || 4;
      const gap = ap.gridGap || '2rem';
      content = (
        <section className="max-w-6xl mx-auto px-6 py-12" style={ap.wrapOverride}>
          {!!props.title && <h2 className="text-3xl font-bold text-center mb-12" style={ap.headingStyle}>{t(props.title)}</h2>}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap }}>
            {members.map((member, i) => (
              <div key={i} className="text-center p-4" style={{ ...ap.cardStyle, ...ap.itemPadding }}>
                <div className="w-32 h-32 rounded-full bg-gray-200 mx-auto mb-4 overflow-hidden">
                  {member.image && <img src={member.image} alt={member.name} className="w-full h-full object-cover" />}
                </div>
                <h3 className="font-semibold" style={ap.headingStyle}>{member.name}</h3>
                <p className="text-sm" style={{ color: ap.bodyStyle.color || '#6b7280' }}>{member.role}</p>
              </div>
            ))}
          </div>
        </section>
      );
      break;
    }

    case 'contact':
      content = (
        <section className="max-w-2xl mx-auto px-6 py-12" style={ap.wrapOverride}>
          <h2 className="text-3xl font-bold text-center mb-2" style={ap.headingStyle}>{t(props.title)}</h2>
          <p className="text-center mb-8" style={{ color: ap.bodyStyle.color || '#4b5563' }}>{t(props.description)}</p>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-4">
              <input className="input" placeholder="First Name" />
              <input className="input" placeholder="Last Name" />
            </div>
            <input className="input" type="email" placeholder="Email" />
            {!!props.showPhone && <input className="input" placeholder="Phone" />}
            {!!props.showCompany && <input className="input" placeholder="Company" />}
            <textarea className="input min-h-[120px]" placeholder="Message" />
            {renderButton(ap, '#', t(props.submitText), 'w-full justify-center')}
          </form>
        </section>
      );
      break;

    case 'map': {
      const mapHeight = Number(props.height) || 400;
      const embedUrl = String(props.embedUrl || '');
      const address = String(props.address || '');
      const lat = Number(props.lat), lng = Number(props.lng), zoom = Number(props.zoom) || 14;
      let src = embedUrl;
      if (!src && lat !== 0 && lng !== 0) src = `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
      else if (!src && address) src = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=${zoom}&output=embed`;
      content = (
        <div className="max-w-6xl mx-auto px-6 py-8" style={ap.wrapOverride}>
          {src ? (
            <iframe src={src} width="100%"
              style={{ height: mapHeight, border: 0, borderRadius: ap.cardStyle.borderRadius || '0.75rem', boxShadow: ap.cardStyle.boxShadow }}
              allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          ) : (
            <div className="bg-gray-100 flex items-center justify-center text-gray-400 text-sm"
              style={{ height: mapHeight, ...ap.cardStyle }}>
              Enter an address or paste a Google Maps embed URL in properties
            </div>
          )}
        </div>
      );
      break;
    }

    case 'divider':
      content = (
        <div
          className={cn('max-w-4xl mx-auto px-6', props.margin === 'lg' ? 'py-8' : props.margin === 'sm' ? 'py-2' : 'py-4')}
          style={ap.wrapOverride}
        >
          <hr style={{
            borderColor: String(props.color || '#e5e7eb'),
            borderStyle: String(props.style || 'solid') as 'solid' | 'dashed' | 'dotted',
            borderTopWidth: Number(props.thickness) ? `${Number(props.thickness)}px` : undefined,
          }} />
        </div>
      );
      break;

    case 'spacer':
      content = <div style={{ height: Number(props.height) || 48 }} />;
      break;

    case 'html':
      content = (
        <div className="max-w-4xl mx-auto px-6 py-4" style={ap.wrapOverride}
          dangerouslySetInnerHTML={{ __html: String(props.html) }} />
      );
      break;

    case 'countdown':
      content = <CountdownBlock block={block} ap={ap} />;
      break;

    case 'faq':
      content = <FaqBlock block={block} ap={ap} lang={language} />;
      break;

    case 'tabs':
      content = <TabsBlock block={block} ap={ap} />;
      break;

    case 'stats': {
      const statsItems = (props.items as { value: unknown; label: unknown; prefix?: unknown; suffix?: unknown }[]) || [];
      content = (
        <section className="max-w-5xl mx-auto px-6 py-12" style={ap.wrapOverride}>
          {!!props.title && (
            <h2 className="text-3xl font-bold text-center mb-10" style={ap.headingStyle}>{resolveText(props.title, language)}</h2>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {statsItems.map((item, i) => (
              <div key={i} style={{ ...ap.cardStyle, ...ap.itemPadding, padding: ap.itemPadding?.paddingTop ? undefined : '1.5rem' }}>
                <div className="text-4xl font-extrabold tabular-nums" style={{ color: ap.accent }}>
                  {!!item.prefix && <span>{String(item.prefix)}</span>}
                  {resolveText(item.value, language)}
                  {!!item.suffix && <span>{String(item.suffix)}</span>}
                </div>
                <div className="mt-1 text-sm font-medium" style={{ color: ap.bodyStyle.color || '#6b7280' }}>
                  {resolveText(item.label, language)}
                </div>
              </div>
            ))}
          </div>
        </section>
      );
      break;
    }

    case 'pricing': {
      type PricingPlan = { name: unknown; price: unknown; period?: unknown; description?: unknown; features?: unknown[]; highlighted?: boolean; ctaText?: unknown; ctaLink?: unknown };
      const plans = (props.plans as PricingPlan[]) || [];
      content = (
        <section className="max-w-6xl mx-auto px-6 py-12" style={ap.wrapOverride}>
          {!!props.title && (
            <h2 className="text-3xl font-bold text-center mb-2" style={ap.headingStyle}>{resolveText(props.title, language)}</h2>
          )}
          {!!props.subtitle && (
            <p className="text-center mb-10 text-sm" style={ap.bodyStyle}>{resolveText(props.subtitle, language)}</p>
          )}
          <div className={cn('grid gap-6', plans.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : plans.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3')}>
            {plans.map((plan, i) => (
              <div key={i}
                style={{ ...ap.cardStyle, ...(plan.highlighted ? { borderColor: ap.accent, borderWidth: 2 } : {}) }}
                className={cn('flex flex-col rounded-2xl overflow-hidden', plan.highlighted && 'ring-2')}>
                {plan.highlighted && (
                  <div className="py-1 text-center text-xs font-bold tracking-wide text-white"
                    style={{ backgroundColor: ap.accent }}>
                    MOST POPULAR
                  </div>
                )}
                <div style={ap.itemPadding} className="p-6 flex flex-col flex-1">
                  <h3 className="text-lg font-bold mb-1" style={ap.headingStyle}>{resolveText(plan.name, language)}</h3>
                  {!!plan.description && (
                    <p className="text-xs mb-4" style={{ color: ap.bodyStyle.color || '#6b7280' }}>{resolveText(plan.description, language)}</p>
                  )}
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold" style={{ color: plan.highlighted ? ap.accent : ap.headingStyle.color }}>{resolveText(plan.price, language)}</span>
                    {!!plan.period && <span className="text-sm ml-1" style={{ color: ap.bodyStyle.color || '#9ca3af' }}>/{String(plan.period)}</span>}
                  </div>
                  <ul className="space-y-2 flex-1 mb-6">
                    {((plan.features || []) as unknown[]).map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm" style={ap.bodyStyle}>
                        <span style={{ color: ap.accent }}>✓</span> {String(f)}
                      </li>
                    ))}
                  </ul>
                  {!!plan.ctaText && (
                    <a href={String(plan.ctaLink || '#')}
                      className="block text-center py-2.5 px-4 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
                      style={plan.highlighted ? { backgroundColor: ap.accent, color: '#fff' } : { border: `1px solid ${ap.accent}`, color: ap.accent }}>
                      {String(plan.ctaText)}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      );
      break;
    }

    case 'logo-bar': {
      type LogoItem = { src?: unknown; alt?: unknown; href?: unknown };
      const logos = (props.logos as LogoItem[]) || [];
      content = (
        <section className="max-w-5xl mx-auto px-6 py-10" style={ap.wrapOverride}>
          {!!props.title && (
            <p className="text-center text-xs font-semibold uppercase tracking-widest mb-6"
              style={{ color: ap.bodyStyle.color || '#9ca3af' }}>
              {resolveText(props.title, language)}
            </p>
          )}
          {logos.length === 0 ? (
            <p className="text-center text-sm text-gray-400 italic">Add logos in block properties</p>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-8">
              {logos.map((logo, i) => {
                const img = (
                  <img key={i} src={String(logo.src || '')} alt={String(logo.alt || '')}
                    className={cn('h-8 object-contain', props.grayscale !== false && 'grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all')}
                    style={{ maxWidth: '8rem' }} />
                );
                return logo.href ? (
                  <a key={i} href={String(logo.href)} target="_blank" rel="noopener noreferrer">{img}</a>
                ) : img;
              })}
            </div>
          )}
        </section>
      );
      break;
    }

    case 'columns': {
      type ColumnChild = { blockType?: string; content?: unknown; html?: unknown };
      const colChildren = (props.children as ColumnChild[]) || [];
      const numCols = Number(props.columns) || 2;
      const gapMap: Record<string, string> = { sm: 'gap-4', md: 'gap-6', lg: 'gap-8', xl: 'gap-12' };
      const gapClass = gapMap[String(props.gap || 'md')] || 'gap-6';
      const colClass = numCols === 1 ? 'grid-cols-1' : numCols === 2 ? 'grid-cols-1 md:grid-cols-2' : numCols === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4';
      content = (
        <div className="max-w-6xl mx-auto px-6 py-8" style={ap.wrapOverride}>
          {colChildren.length === 0 ? (
            <div className={cn('grid', colClass, gapClass)}>
              {Array.from({ length: numCols }).map((_, i) => (
                <div key={i} className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400 text-sm">
                  Column {i + 1}
                </div>
              ))}
            </div>
          ) : (
            <div className={cn('grid', colClass, gapClass)}>
              {colChildren.map((child, i) => (
                <div key={i}>
                  {!!child.html
                    ? <div dangerouslySetInnerHTML={{ __html: String(child.html) }} />
                    : <p className="text-sm text-gray-500">{String(child.content || '')}</p>
                  }
                </div>
              ))}
            </div>
          )}
        </div>
      );
      break;
    }

    default:
      content = <div className="p-4 bg-gray-50 text-center text-gray-400">Unknown block type: {type}</div>;
  }

  const needsWrapper = Object.keys(sectionStyle).length > 0 || !!animClass;
  const wrapper = (
    <>
      {injectCss && <style dangerouslySetInnerHTML={{ __html: injectCss }} />}
      {needsWrapper
        ? <div style={sectionStyle} className={animClass}>{content}</div>
        : content}
    </>
  );
  return wrapper;
}
