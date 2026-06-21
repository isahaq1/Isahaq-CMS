'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Trash2, Copy, Eye, Save, ArrowLeft, Plus,
  Layout, Type, AlignLeft, Image, Images, Film, Video, MousePointer,
  Columns, Grid, Quote, Users, Mail, MapPin, Minus, MoveVertical, Code,
  Navigation, ExternalLink, EyeOff, Settings, ChevronDown, ChevronRight,
  LayoutTemplate, PanelBottom, MoveUp, MoveDown, CheckCircle2, AlertCircle,
  Link2,
} from 'lucide-react';
import {
  BLOCK_DEFINITIONS,
  type PageBlock, type BlockType, type Language,
  type NavItem, type NavItemType, type Navigation as NavType, type NavStyle, type Page,
} from '@group-cms/shared';
import { BlockRenderer } from './block-renderer';
import { FooterTextEditor } from './footer-text-editor';
import { BlockProperties } from './block-properties';
import { SiteNavbar } from '@/components/site/site-navbar';
import { SiteFooter } from '@/components/site/site-footer';
import { resolveNavItems } from '@/lib/nav-utils';
import { generateId, cn } from '@/lib/utils';
import { api } from '@/lib/api';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Layout, Type, AlignLeft, Image, Images, Film, Video, MousePointer,
  Columns, Grid, Quote, Users, Mail, MapPin, Minus, MoveVertical, Code,
};

// ── Constants ─────────────────────────────────────────────────────────────────

const NAV_TYPE_OPTIONS: { value: NavItemType; label: string; color: string }[] = [
  { value: 'link', label: 'Link', color: 'bg-blue-100 text-blue-700' },
  { value: 'dropdown', label: 'Dropdown', color: 'bg-purple-100 text-purple-700' },
  { value: 'button', label: 'Button', color: 'bg-green-100 text-green-700' },
  { value: 'separator', label: '— Sep', color: 'bg-gray-100 text-gray-500' },
];

const ICON_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'home', label: '🏠 Home' },
  { value: 'info', label: 'ℹ️ About' },
  { value: 'phone', label: '📞 Contact' },
  { value: 'mail', label: '✉️ Email' },
  { value: 'shop', label: '🛍️ Shop' },
  { value: 'blog', label: '📝 Blog' },
  { value: 'star', label: '⭐ Star' },
  { value: 'globe', label: '🌐 Globe' },
  { value: 'lock', label: '🔒 Login' },
  { value: 'user', label: '👤 User' },
];

const ICON_EMOJI: Record<string, string> = {
  home: '🏠', info: 'ℹ️', phone: '📞', mail: '✉️', shop: '🛍️',
  blog: '📝', star: '⭐', globe: '🌐', lock: '🔒', user: '👤',
};

// ── NavItem editor: one item's full settings ───────────────────────────────────

function NavItemEditor({
  item,
  index,
  total,
  pages,
  onChange,
  onDelete,
  onMove,
}: {
  item: NavItem;
  index: number;
  total: number;
  pages: Page[];
  onChange: (d: Partial<NavItem>) => void;
  onDelete: () => void;
  onMove: (dir: 1 | -1) => void;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [childrenOpen, setChildrenOpen] = useState(false);
  const isSep = item.type === 'separator';
  const isDrop = item.type === 'dropdown';
  const children = item.children || [];
  const typeInfo = NAV_TYPE_OPTIONS.find((t) => t.value === (item.type || 'link'));

  const updateChild = (i: number, d: Partial<NavItem>) =>
    onChange({ children: children.map((c, idx) => (idx === i ? { ...c, ...d } : c)) });
  const deleteChild = (i: number) =>
    onChange({ children: children.filter((_, idx) => idx !== i) });
  const moveChild = (i: number, dir: 1 | -1) => {
    const next = [...children];
    const t = i + dir;
    if (t < 0 || t >= next.length) return;
    [next[i], next[t]] = [next[t], next[i]];
    onChange({ children: next });
  };
  const addChild = () => {
    onChange({ children: [...children, { id: generateId(), label: 'Sub Item', url: '/', type: 'link' }] });
    setChildrenOpen(true);
  };

  return (
    <div className={cn(
      'rounded-lg border bg-white overflow-hidden shadow-sm',
      item.isHidden && 'opacity-60',
      isDrop && 'border-purple-200',
    )}>
      {/* Main row */}
      <div className="flex items-center gap-1.5 p-2">
        {/* Reorder */}
        <div className="flex flex-col gap-px shrink-0">
          <button disabled={index === 0} onClick={() => onMove(-1)}
            className="p-0.5 text-gray-300 hover:text-gray-500 disabled:opacity-20">
            <MoveUp className="w-3 h-3" />
          </button>
          <button disabled={index === total - 1} onClick={() => onMove(1)}
            className="p-0.5 text-gray-300 hover:text-gray-500 disabled:opacity-20">
            <MoveDown className="w-3 h-3" />
          </button>
        </div>

        {/* Type pill */}
        <select
          className={cn('text-xs font-medium px-1.5 py-0.5 rounded-full border-0 cursor-pointer shrink-0', typeInfo?.color)}
          value={item.type || 'link'}
          onChange={(e) => onChange({ type: e.target.value as NavItemType })}
          style={{ appearance: 'none', WebkitAppearance: 'none' }}
          title="Item type"
        >
          {NAV_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {!isSep ? (
          <>
            {item.icon && <span className="text-xs shrink-0">{ICON_EMOJI[item.icon] || ''}</span>}
            <input
              className="input h-6 py-0 text-xs flex-1 min-w-0"
              value={item.label}
              placeholder="Label"
              onChange={(e) => onChange({ label: e.target.value })}
            />
          </>
        ) : (
          <span className="flex-1 text-xs text-gray-400 italic">Horizontal divider</span>
        )}

        {/* Visibility */}
        <button onClick={() => onChange({ isHidden: !item.isHidden })}
          className="shrink-0 text-gray-400 hover:text-gray-600" title={item.isHidden ? 'Show' : 'Hide'}>
          {item.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>

        {/* Settings toggle */}
        {!isSep && (
          <button onClick={() => setSettingsOpen((v) => !v)}
            className={cn('shrink-0', settingsOpen ? 'text-primary' : 'text-gray-400 hover:text-gray-600')}>
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Children toggle (dropdown) */}
        {(isDrop || children.length > 0) && (
          <button onClick={() => setChildrenOpen((v) => !v)}
            className={cn('shrink-0', childrenOpen ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600')}>
            {childrenOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        )}

        <button onClick={onDelete} className="shrink-0 text-red-400 hover:text-red-600">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* URL + page picker row */}
      {!isSep && !isDrop && (
        <div className="flex gap-1.5 px-2 pb-2">
          <input
            className="input h-6 py-0 text-xs flex-1 min-w-0"
            value={item.url}
            placeholder="/url or https://…"
            onChange={(e) => onChange({ url: e.target.value })}
          />
          {pages.length > 0 && (
            <select
              className="input h-6 py-0 text-xs shrink-0 w-24"
              value={item.pageId || ''}
              onChange={(e) => {
                const pg = pages.find((p) => p.id === e.target.value);
                onChange({ pageId: e.target.value || undefined, url: pg ? `/${pg.slug}` : item.url });
              }}
              title="Link to page"
            >
              <option value="">— page</option>
              {pages.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          )}
        </div>
      )}

      {/* Settings panel */}
      {settingsOpen && !isSep && (
        <div className="border-t bg-gray-50 px-2 py-2 space-y-2">
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Icon</p>
              <select className="input text-xs h-6 py-0"
                value={item.icon || ''}
                onChange={(e) => onChange({ icon: e.target.value || undefined })}>
                {ICON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Badge</p>
              <input className="input text-xs h-6 py-0" placeholder="New" value={item.badge || ''}
                onChange={(e) => onChange({ badge: e.target.value || undefined })} />
            </div>
            {item.badge && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-0.5">Badge Color</p>
                <div className="flex gap-1">
                  <input type="color" className="w-6 h-6 p-0.5 rounded border cursor-pointer shrink-0"
                    value={item.badgeColor || '#2563eb'}
                    onChange={(e) => onChange({ badgeColor: e.target.value })} />
                  <input className="input text-xs h-6 py-0 flex-1" value={item.badgeColor || ''}
                    placeholder="#2563eb"
                    onChange={(e) => onChange({ badgeColor: e.target.value || undefined })} />
                </div>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500 mb-0.5">CSS Class</p>
              <input className="input text-xs h-6 py-0" placeholder="custom-class" value={item.cssClass || ''}
                onChange={(e) => onChange({ cssClass: e.target.value || undefined })} />
            </div>
            <div className="flex flex-col justify-end gap-1">
              <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="checkbox" className="rounded" checked={!!item.openInNewTab}
                  onChange={(e) => onChange({ openInNewTab: e.target.checked })} />
                New tab
              </label>
              {item.openInNewTab && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Will open externally
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Children (dropdown sub-items) */}
      {childrenOpen && (
        <div className="border-t bg-purple-50/50 px-2 py-2 space-y-1.5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-purple-700">Sub-items</p>
            <button onClick={addChild}
              className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-0.5">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          {children.length === 0 && (
            <p className="text-xs text-gray-400 italic">No sub-items.</p>
          )}
          {children.map((child, i) => (
            <div key={child.id} className="rounded border bg-white p-1.5 space-y-1">
              <div className="flex items-center gap-1">
                <div className="flex flex-col gap-px shrink-0">
                  <button disabled={i === 0} onClick={() => moveChild(i, -1)}
                    className="p-0.5 text-gray-300 hover:text-gray-500 disabled:opacity-20">
                    <MoveUp className="w-2.5 h-2.5" />
                  </button>
                  <button disabled={i === children.length - 1} onClick={() => moveChild(i, 1)}
                    className="p-0.5 text-gray-300 hover:text-gray-500 disabled:opacity-20">
                    <MoveDown className="w-2.5 h-2.5" />
                  </button>
                </div>
                <input className="input h-5 py-0 text-xs flex-1 min-w-0" value={child.label}
                  placeholder="Label" onChange={(e) => updateChild(i, { label: e.target.value })} />
                <button onClick={() => deleteChild(i)} className="text-red-400 hover:text-red-600 shrink-0">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <div className="flex gap-1">
                <input className="input h-5 py-0 text-xs flex-1 min-w-0" value={child.url}
                  placeholder="/url" onChange={(e) => updateChild(i, { url: e.target.value })} />
                {pages.length > 0 && (
                  <select className="input h-5 py-0 text-xs shrink-0 w-20"
                    value={child.pageId || ''}
                    onChange={(e) => {
                      const pg = pages.find((p) => p.id === e.target.value);
                      updateChild(i, { pageId: e.target.value || undefined, url: pg ? `/${pg.slug}` : child.url });
                    }}>
                    <option value="">— pg</option>
                    {pages.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick "add sub-item" shortcut when dropdown but panel closed */}
      {isDrop && !childrenOpen && children.length === 0 && (
        <div className="border-t px-2 py-1">
          <button onClick={addChild}
            className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add first sub-item
          </button>
        </div>
      )}
    </div>
  );
}

// ── Full nav panel: position tabs + item list + style settings ───────────────

type NavPosition = 'header' | 'footer';

// ── ColorRow helper ────────────────────────────────────────────────────────────
function ColorRow({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <div className="flex gap-1">
        <input type="color" className="w-6 h-6 p-0.5 rounded border cursor-pointer shrink-0"
          value={value || '#ffffff'}
          onChange={(e) => onChange(e.target.value)} />
        <input className="input text-xs h-6 py-0 flex-1 font-mono" value={value || ''}
          placeholder="#ffffff"
          onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

// ── StylePanel: style settings for a single nav position ──────────────────────
function StylePanel({ settings, onChange, pos }: {
  settings: NavStyle;
  onChange: (s: NavStyle) => void;
  pos: NavPosition;
}) {
  const set = (patch: Partial<NavStyle>) => onChange({ ...settings, ...patch });

  // ── Footer style panel ───────────────────────────────────────────────────────
  if (pos === 'footer') {
    return (
      <div className="space-y-3">
        {/* Visibility */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Visibility</p>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" className="rounded" checked={settings.footerHidden !== true}
              onChange={(e) => set({ footerHidden: !e.target.checked })} />
            Show footer on site
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" className="rounded" checked={settings.footerDivider !== false}
              onChange={(e) => set({ footerDivider: e.target.checked })} />
            Show top border / divider
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" className="rounded" checked={settings.footerShowContent !== false}
              onChange={(e) => set({ footerShowContent: e.target.checked })} />
            Show main content area
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" className="rounded" checked={settings.footerShowCopyright !== false}
              onChange={(e) => set({ footerShowCopyright: e.target.checked })} />
            Show copyright bar
          </label>
        </div>

        {/* Background */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Background</p>
          <ColorRow label="Background Color" value={settings.footerBg} onChange={(v) => set({ footerBg: v })} />
          {settings.footerDivider !== false && (
            <ColorRow label="Border Color" value={settings.footerBorderColor} onChange={(v) => set({ footerBorderColor: v })} />
          )}
        </div>

        {/* Text */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Text</p>
          <ColorRow label="Body Text" value={settings.footerTextColor} onChange={(v) => set({ footerTextColor: v })} />
          <ColorRow label="Section Heading" value={settings.footerHeadingColor} onChange={(v) => set({ footerHeadingColor: v })} />
          <ColorRow label="Link Color" value={settings.footerLinkColor} onChange={(v) => set({ footerLinkColor: v })} />
          <ColorRow label="Link Hover" value={settings.hoverTextColor} onChange={(v) => set({ hoverTextColor: v })} />
        </div>

        {/* Bottom bar */}
        {settings.footerShowCopyright !== false && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Bottom Bar</p>
            <ColorRow label="Bottom Bg" value={settings.footerBottomBg} onChange={(v) => set({ footerBottomBg: v })} />
            <ColorRow label="Bottom Text" value={settings.footerBottomTextColor} onChange={(v) => set({ footerBottomTextColor: v })} />
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Copyright Text</p>
              <input className="input text-xs h-6 py-0 w-full"
                placeholder={`© ${new Date().getFullYear()}. All rights reserved.`}
                value={settings.footerText || ''}
                onChange={(e) => set({ footerText: e.target.value || undefined })} />
            </div>
          </div>
        )}

        {/* Layout */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Layout</p>
          <div className="flex gap-1">
            {(['columns', 'centered', 'minimal'] as const).map((l) => (
              <button key={l}
                className={cn('flex-1 py-1 text-xs rounded border capitalize transition-colors',
                  (settings.footerLayout || 'columns') === l ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 hover:bg-gray-50')}
                onClick={() => set({ footerLayout: l })}>
                {l}
              </button>
            ))}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Vertical Padding</p>
            <div className="flex gap-1">
              {(['sm', 'md', 'lg'] as const).map((p) => (
                <button key={p}
                  className={cn('flex-1 py-1 text-xs rounded border transition-colors',
                    (settings.footerPaddingY || 'md') === p ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 hover:bg-gray-50')}
                  onClick={() => set({ footerPaddingY: p })}>
                  {p === 'sm' ? 'Tight' : p === 'md' ? 'Normal' : 'Spacious'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Header style panel ───────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Visibility */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Visibility</p>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" className="rounded" checked={settings.navHidden !== true}
            onChange={(e) => set({ navHidden: !e.target.checked })} />
          Show header on site
        </label>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" className="rounded" checked={settings.navShowLogo !== false}
            onChange={(e) => set({ navShowLogo: e.target.checked })} />
          Show logo / brand area
        </label>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" className="rounded" checked={settings.navShowMenu !== false}
            onChange={(e) => set({ navShowMenu: e.target.checked })} />
          Show navigation menu
        </label>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" className="rounded" checked={settings.navShowMobileMenu !== false}
            onChange={(e) => set({ navShowMobileMenu: e.target.checked })} />
          Show mobile menu button
        </label>
      </div>

      {/* Background */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Background</p>
        <ColorRow label="Bg Color" value={settings.bgColor} onChange={(v) => set({ bgColor: v })} />
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Opacity ({settings.bgOpacity ?? 100}%)</p>
          <input type="range" min={0} max={100} step={5}
            className="w-full h-1.5 accent-primary"
            value={settings.bgOpacity ?? 100}
            onChange={(e) => set({ bgOpacity: Number(e.target.value) })} />
        </div>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" className="rounded" checked={!!settings.bgBlur}
            onChange={(e) => set({ bgBlur: e.target.checked })} />
          Frosted glass blur (when transparent)
        </label>
      </div>

      {/* Border & Shadow */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Border & Shadow</p>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" className="rounded" checked={settings.borderBottom !== false}
            onChange={(e) => set({ borderBottom: e.target.checked })} />
          Bottom border
        </label>
        {settings.borderBottom !== false && (
          <ColorRow label="Border Color" value={settings.borderColor} onChange={(v) => set({ borderColor: v })} />
        )}
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Shadow</p>
          <div className="flex gap-1">
            {(['none', 'sm', 'md', 'lg'] as const).map((sh) => (
              <button key={sh}
                className={cn('flex-1 py-1 text-xs rounded border transition-colors',
                  (settings.shadow || 'none') === sh ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 hover:bg-gray-50')}
                onClick={() => set({ shadow: sh })}>
                {sh}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Height */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Height</p>
        <div className="flex gap-1">
          {(['sm', 'md', 'lg'] as const).map((h) => (
            <button key={h}
              className={cn('flex-1 py-1 text-xs rounded border transition-colors',
                (settings.height || 'md') === h ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 hover:bg-gray-50')}
              onClick={() => set({ height: h })}>
              {h === 'sm' ? 'Compact' : h === 'md' ? 'Normal' : 'Tall'}
            </button>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Links</p>
        <ColorRow label="Text Color" value={settings.textColor} onChange={(v) => set({ textColor: v })} />
        <ColorRow label="Hover Text" value={settings.hoverTextColor} onChange={(v) => set({ hoverTextColor: v })} />
        <ColorRow label="Hover Bg" value={settings.hoverBgColor} onChange={(v) => set({ hoverBgColor: v })} />
      </div>

      {/* Logo */}
      {settings.navShowLogo !== false && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Logo</p>
          <ColorRow label="Logo Text Color" value={settings.logoTextColor} onChange={(v) => set({ logoTextColor: v })} />
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" className="rounded" checked={!!settings.navShowCompanyName}
              onChange={(e) => set({ navShowCompanyName: e.target.checked })} />
            Show company name text alongside logo image
          </label>
        </div>
      )}

      {/* Behavior */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Behavior</p>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox" className="rounded" checked={!!settings.navSticky}
            onChange={(e) => set({ navSticky: e.target.checked })} />
          Sticky (stays fixed at top on scroll)
        </label>
      </div>

      {/* CTA Button */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">CTA Button</p>
        <ColorRow label="Bg Color" value={settings.ctaBgColor} onChange={(v) => set({ ctaBgColor: v })} />
        <ColorRow label="Text Color" value={settings.ctaTextColor} onChange={(v) => set({ ctaTextColor: v })} />
        <div>
          <p className="text-xs text-gray-500 mb-0.5">Border Radius</p>
          <input className="input text-xs h-6 py-0 w-full font-mono"
            placeholder="0.5rem or 9999px"
            value={settings.ctaBorderRadius || ''}
            onChange={(e) => set({ ctaBorderRadius: e.target.value || undefined })} />
        </div>
      </div>

      {/* Dropdown */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Dropdown</p>
        <ColorRow label="Panel Bg" value={settings.dropdownBg} onChange={(v) => set({ dropdownBg: v })} />
        <ColorRow label="Text Color" value={settings.dropdownTextColor} onChange={(v) => set({ dropdownTextColor: v })} />
        <ColorRow label="Border Color" value={settings.dropdownBorderColor} onChange={(v) => set({ dropdownBorderColor: v })} />
      </div>
    </div>
  );
}

function NavPanel({
  siteId,
  pages,
  primaryColor,
  activePos,
  onPosChange,
  onLiveChange,
  onSave,
}: {
  siteId: string;
  pages: Page[];
  primaryColor: string;
  activePos: NavPosition;
  onPosChange: (pos: NavPosition) => void;
  onLiveChange?: (pos: NavPosition, items: NavItem[], settings: NavStyle) => void;
  onSave?: (pos: NavPosition, items: NavItem[], settings: NavStyle) => void;
}) {
  const [innerTab, setInnerTab] = useState<'items' | 'style'>('items');
  const [navs, setNavs] = useState<Record<NavPosition, NavType | null>>({ header: null, footer: null });
  const [items, setItems] = useState<Record<NavPosition, NavItem[]>>({ header: [], footer: [] });
  const [settings, setSettings] = useState<Record<NavPosition, NavStyle>>({ header: {}, footer: {} });
  const [saving, setSaving] = useState<NavPosition | null>(null);
  const [saveStatus, setSaveStatus] = useState<Record<NavPosition, 'idle' | 'ok' | 'err'>>({ header: 'idle', footer: 'idle' });
  const [creating, setCreating] = useState(false);
  const [loadDone, setLoadDone] = useState(false);

  useEffect(() => {
    if (!siteId) return;
    const ensurePosition = async (position: NavPosition, navs: NavType[]) => {
      const existing = navs[0] ?? null;
      if (existing) return existing;
      const label = position === 'header' ? 'Header Navigation' : 'Footer Navigation';
      return await api.createNavigation({ siteId, position, name: label, items: [] }) as NavType;
    };
    Promise.all([
      api.getNavigations(siteId, 'header'),
      api.getNavigations(siteId, 'footer'),
    ]).then(async ([hNavs, fNavs]) => {
      const h = await ensurePosition('header', hNavs as NavType[]);
      const f = await ensurePosition('footer', fNavs as NavType[]);
      setNavs({ header: h, footer: f });
      setItems({ header: h ? (h.items as NavItem[]) : [], footer: f ? (f.items as NavItem[]) : [] });
      setSettings({ header: h ? (h.settings as NavStyle ?? {}) : {}, footer: f ? (f.settings as NavStyle ?? {}) : {} });
      setLoadDone(true);
    }).catch(() => setLoadDone(true));
  }, [siteId]);

  const ensureNav = async (pos: NavPosition) => {
    if (navs[pos]) return navs[pos]!;
    setCreating(true);
    try {
      const label = pos === 'header' ? 'Header Menu' : 'Footer Links';
      const nav = await api.createNavigation({ siteId, name: label, position: pos, items: [] });
      const created = nav as NavType;
      setNavs((prev) => ({ ...prev, [pos]: created }));
      return created;
    } finally {
      setCreating(false);
    }
  };

  const currentItems = items[activePos];
  const currentSettings = settings[activePos];

  const addItem = async () => {
    await ensureNav(activePos);
    const newItems = [...currentItems, { id: generateId(), label: 'New Item', url: '/', type: 'link' as const }];
    setItems((prev) => ({ ...prev, [activePos]: newItems }));
    onLiveChange?.(activePos, newItems, currentSettings);
  };

  const updateItem = (id: string, data: Partial<NavItem>) => {
    const newItems = currentItems.map((i) => (i.id === id ? { ...i, ...data } : i));
    setItems((prev) => ({ ...prev, [activePos]: newItems }));
    onLiveChange?.(activePos, newItems, currentSettings);
  };

  const deleteItem = (id: string) => {
    const newItems = currentItems.filter((i) => i.id !== id);
    setItems((prev) => ({ ...prev, [activePos]: newItems }));
    onLiveChange?.(activePos, newItems, currentSettings);
  };

  const moveItem = (index: number, dir: 1 | -1) => {
    const list = [...currentItems];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    setItems((prev) => ({ ...prev, [activePos]: list }));
    onLiveChange?.(activePos, list, currentSettings);
  };

  const updateSettings = (s: NavStyle) => {
    setSettings((prev) => ({ ...prev, [activePos]: s }));
    onLiveChange?.(activePos, currentItems, s);
  };

  const handleSave = async () => {
    const nav = await ensureNav(activePos);
    if (!nav) return;
    setSaving(activePos);
    const itemsToSave = items[activePos];
    const settingsToSave = settings[activePos];
    try {
      await api.updateNavigation(nav.id, { items: itemsToSave, settings: settingsToSave });
      setNavs((prev) => ({ ...prev, [activePos]: { ...nav } }));
      setSaveStatus((prev) => ({ ...prev, [activePos]: 'ok' }));
      onSave?.(activePos, itemsToSave, settingsToSave);
      setTimeout(() => setSaveStatus((prev) => ({ ...prev, [activePos]: 'idle' })), 2500);
    } catch {
      setSaveStatus((prev) => ({ ...prev, [activePos]: 'err' }));
    } finally {
      setSaving(null);
    }
  };

  const TABS: { pos: NavPosition; icon: React.ElementType; label: string }[] = [
    { pos: 'header', icon: LayoutTemplate, label: 'Header' },
    { pos: 'footer', icon: PanelBottom, label: 'Footer' },
  ];

  if (!loadDone) return (
    <div className="flex items-center justify-center py-10">
      <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const status = saveStatus[activePos];
  const isSaving = saving === activePos;
  const visibleCount = currentItems.filter((i) => !i.isHidden).length;
  const hiddenCount = currentItems.filter((i) => i.isHidden).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Navigation</span>
        </div>
        <a href="/dashboard/navigation" target="_blank" rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1">
          Full editor <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Position tabs */}
      <div className="flex rounded-lg border overflow-hidden">
        {TABS.map(({ pos, icon: Icon, label }) => (
          <button key={pos} onClick={() => onPosChange(pos)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium transition-colors',
              activePos === pos ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
            )}>
            <Icon className="w-3.5 h-3.5" />
            {label}
            {/* Only show item count badge for header */}
            {pos === 'header' && navs[pos] && items[pos].length > 0 && (
              <span className={cn(
                'ml-0.5 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold',
                activePos === pos ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              )}>
                {items[pos].filter((i) => !i.isHidden).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content / Style inner tabs — label changes per position */}
      <div className="flex rounded border overflow-hidden text-xs">
        <button
          className={cn('flex-1 py-1 font-medium transition-colors',
            innerTab === 'items' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-400 hover:bg-gray-50')}
          onClick={() => setInnerTab('items')}>
          {activePos === 'footer' ? 'Content' : 'Items'}
        </button>
        <button
          className={cn('flex-1 py-1 font-medium transition-colors',
            innerTab === 'style' ? 'bg-gray-100 text-gray-800' : 'bg-white text-gray-400 hover:bg-gray-50')}
          onClick={() => setInnerTab('style')}>
          Style
        </button>
      </div>

      {/* Save row */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {innerTab === 'style' ? (
            <span className="italic">Visual settings</span>
          ) : activePos === 'footer' ? (
            <span className="italic">Rich text content</span>
          ) : currentItems.length > 0 ? (
            <>{visibleCount} visible{hiddenCount > 0 && <span className="text-amber-500 ml-1">{hiddenCount} hidden</span>}</>
          ) : (
            <span className="italic">No items yet</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {status === 'ok' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
          {status === 'err' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
          <button onClick={handleSave} disabled={isSaving || creating}
            className="btn-primary btn-sm py-1 px-2.5 text-xs">
            <Save className="w-3 h-3" />
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Tab content */}
      {innerTab === 'items' ? (
        activePos === 'footer' ? (
          /* ── Footer: rich text editor + copyright ── */
          <div className="space-y-3 overflow-y-auto">
            <FooterTextEditor
              compact
              value={currentSettings.footerContent || ''}
              onChange={(html) => updateSettings({ ...currentSettings, footerContent: html })}
            />
            {/* Copyright bar */}
            <div className="border rounded-lg p-2.5 space-y-2 bg-gray-50">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Copyright Bar</p>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="checkbox" className="rounded" checked={currentSettings.footerShowCopyright !== false}
                    onChange={(e) => updateSettings({ ...currentSettings, footerShowCopyright: e.target.checked })} />
                  Show
                </label>
              </div>
              {currentSettings.footerShowCopyright !== false && (
                <input
                  className="input text-xs h-6 py-0 w-full"
                  placeholder={`© ${new Date().getFullYear()}. All rights reserved.`}
                  value={currentSettings.footerText || ''}
                  onChange={(e) => updateSettings({ ...currentSettings, footerText: e.target.value || undefined })}
                />
              )}
            </div>
          </div>
        ) : (
          /* ── Header: items list ── */
          <>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-0.5">
              {currentItems.length === 0 && (
                <div className="border-2 border-dashed rounded-lg text-center py-6 text-muted-foreground">
                  <Link2 className="w-6 h-6 mx-auto mb-1.5 opacity-30" />
                  <p className="text-xs">No header nav items.</p>
                  <p className="text-xs">Click &quot;Add Item&quot; to start.</p>
                </div>
              )}
              {currentItems.map((item, i) => (
                <NavItemEditor
                  key={item.id}
                  item={item}
                  index={i}
                  total={currentItems.length}
                  pages={pages}
                  onChange={(data) => updateItem(item.id, data)}
                  onDelete={() => deleteItem(item.id)}
                  onMove={(dir) => moveItem(i, dir)}
                />
              ))}
            </div>
            <button onClick={addItem} disabled={creating}
              className="btn-secondary w-full btn-sm text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          </>
        )
      ) : (
        <div className="max-h-[55vh] overflow-y-auto pr-0.5">
          <StylePanel settings={currentSettings} onChange={updateSettings} pos={activePos} />
        </div>
      )}

      {/* Accent preview */}
      <div className="pt-2 border-t">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: primaryColor }} />
          Accent: <span className="font-mono">{primaryColor}</span>
        </div>
      </div>
    </div>
  );
}

// ── Sortable block ─────────────────────────────────────────────────────────────

interface PageBuilderProps {
  pageId: string;
  initialBlocks: PageBlock[];
  pageTitle: string;
  onBack: () => void;
  primaryColor?: string;
  companyId?: string;
  siteId?: string;
}

function SortableBlock({
  block, isSelected, onSelect, onDelete, onDuplicate, primaryColor, language,
}: {
  block: PageBlock; isSelected: boolean;
  onSelect: (e?: React.MouseEvent) => void;
  onDelete: () => void; onDuplicate: () => void;
  primaryColor?: string; language?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style}
      className={cn('builder-block group', isSelected && 'selected', isDragging && 'dragging')}
      onClick={onSelect}>
      <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-1.5 bg-white rounded-md shadow border hover:bg-gray-50"
          {...attributes} {...listeners}>
          <GripVertical className="w-4 h-4 text-gray-400" />
        </button>
        <button className="p-1.5 bg-white rounded-md shadow border hover:bg-gray-50"
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
          <Copy className="w-4 h-4 text-gray-400" />
        </button>
        <button className="p-1.5 bg-white rounded-md shadow border hover:bg-red-50"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>
      <BlockRenderer block={block} primaryColor={primaryColor} language={language} />
    </div>
  );
}

function PaletteItem({ type, label, icon }: { type: BlockType; label: string; icon: string }) {
  const Icon = iconMap[icon] || Layout;
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-white cursor-grab hover:border-primary/50 hover:shadow-sm transition-all active:cursor-grabbing"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('blockType', type);
        e.dataTransfer.effectAllowed = 'copy';
      }}
    >
      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

// ── Main PageBuilder ──────────────────────────────────────────────────────────

export function PageBuilder({ pageId, initialBlocks, pageTitle, onBack, primaryColor, companyId, siteId }: PageBuilderProps) {
  const [blocks, setBlocks] = useState<PageBlock[]>(initialBlocks);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Language
  const [languages, setLanguages] = useState<Language[]>([]);
  const [currentLang, setCurrentLang] = useState('en');

  // Nav state (for canvas preview + preview mode)
  const [headerNavItems, setHeaderNavItems] = useState<NavItem[]>([]);
  const [footerNavItems, setFooterNavItems] = useState<NavItem[]>([]);
  const [headerNavSettings, setHeaderNavSettings] = useState<NavStyle>({});
  const [footerNavSettings, setFooterNavSettings] = useState<NavStyle>({});
  const [navSelected, setNavSelected] = useState(false);
  const [navActivePos, setNavActivePos] = useState<'header' | 'footer'>('header');

  // Pages (for nav page picker)
  const [pages, setPages] = useState<Page[]>([]);

  // Company / branding
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');

  const accentColor = primaryColor || '#2563eb';

  useEffect(() => {
    api.getLanguages().then((data) => {
      const langs = (data as Language[]).filter((l) => l.isActive);
      setLanguages(langs);
      const def = langs.find((l) => l.isDefault);
      if (def) setCurrentLang(def.code);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!siteId) return;
    // Load header + footer navs for canvas preview
    Promise.all([
      api.getNavigations(siteId, 'header'),
      api.getNavigations(siteId, 'footer'),
    ]).then(([hNavs, fNavs]) => {
      const h = (hNavs as NavType[])[0];
      const f = (fNavs as NavType[])[0];
      setHeaderNavItems(h ? (h.items as NavItem[]) : []);
      setFooterNavItems(f ? (f.items as NavItem[]) : []);
      setHeaderNavSettings(h ? (h.settings as NavStyle ?? {}) : {});
      setFooterNavSettings(f ? (f.settings as NavStyle ?? {}) : {});
    }).catch(() => {});
    // Load pages for nav page picker
    api.getPages(siteId).then((pgs) => setPages(pgs as Page[])).catch(() => {});
  }, [siteId]);

  useEffect(() => {
    if (!companyId) return;
    api.getCompany(companyId).then((co) => {
      const c = co as { name?: string; logo?: string };
      setCompanyName(c.name || '');
      setCompanyLogo(c.logo || '');
    }).catch(() => {});
  }, [companyId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const selectedBlock = blocks.find((b) => b.id === selectedId);

  const selectBlock = (id: string) => { setSelectedId(id); setNavSelected(false); };
  const selectNav = (pos: 'header' | 'footer' = navActivePos) => { setSelectedId(null); setNavSelected(true); setNavActivePos(pos); };
  const deselectAll = () => { setSelectedId(null); setNavSelected(false); };

  const addBlock = useCallback((type: BlockType) => {
    const def = BLOCK_DEFINITIONS.find((d) => d.type === type);
    if (!def) return;
    const newBlock: PageBlock = { id: generateId(), type, props: { ...def.defaultProps } };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedId(newBlock.id);
    setNavSelected(false);
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const duplicateBlock = useCallback((id: string) => {
    const block = blocks.find((b) => b.id === id);
    if (!block) return;
    const newBlock = { ...block, id: generateId(), props: { ...block.props } };
    const index = blocks.findIndex((b) => b.id === id);
    setBlocks((prev) => { const next = [...prev]; next.splice(index + 1, 0, newBlock); return next; });
    setSelectedId(newBlock.id);
  }, [blocks]);

  const updateBlockProps = useCallback((id: string, props: Record<string, unknown>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, props } : b)));
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oi = items.findIndex((i) => i.id === active.id);
        const ni = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oi, ni);
      });
    }
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const blockType = e.dataTransfer.getData('blockType') as BlockType;
    if (blockType) addBlock(blockType);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.updatePageBlocks(pageId, blocks);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const categories = ['layout', 'content', 'media', 'interactive'] as const;
  const basePath = siteId ? `/preview/${siteId}` : '';

  // ── Preview mode ──────────────────────────────────────────────────────────────
  if (preview) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <div className="sticky top-0 z-50 bg-white border-b px-6 py-2 flex items-center justify-between shadow-sm">
          <button onClick={() => setPreview(false)} className="btn-ghost btn-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Editor
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">Preview</span>
            <span className="text-sm text-muted-foreground">{pageTitle}</span>
          </div>
        </div>
        <SiteNavbar
          items={resolveNavItems(headerNavItems.filter((i) => !i.isHidden), basePath)}
          logo={companyLogo}
          companyName={companyName || pageTitle}
          primaryColor={accentColor}
          sticky
          settings={headerNavSettings}
        />
        <main className="flex-1">
          {blocks.map((block) => (
            <BlockRenderer key={block.id} block={block} isPreview primaryColor={primaryColor} language={currentLang} />
          ))}
        </main>
        <SiteFooter
          items={resolveNavItems(footerNavItems.filter((i) => !i.isHidden), basePath)}
          primaryColor={accentColor}
          settings={footerNavSettings}
        />
      </div>
    );
  }

  // ── Editor mode ───────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-gray-100" onClick={deselectAll}>
      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="btn-ghost btn-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="h-6 w-px bg-border" />
          <h2 className="font-semibold">{pageTitle}</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          {languages.length > 1 && (
            <div className="flex items-center gap-1 border rounded-lg p-1 bg-gray-50">
              {languages.map((lang) => (
                <button key={lang.code} onClick={() => setCurrentLang(lang.code)}
                  className={cn(
                    'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                    currentLang === lang.code ? 'bg-white shadow text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                  title={lang.name}>
                  {lang.code.toUpperCase()}
                </button>
              ))}
            </div>
          )}

          {/* Nav quick-select */}
          <button
            onClick={(e) => { e.stopPropagation(); navSelected ? deselectAll() : selectNav(); }}
            className={cn('btn-sm flex items-center gap-1.5', navSelected ? 'btn-primary' : 'btn-secondary')}
            title="Edit navigation">
            <Navigation className="w-4 h-4" />
            Nav
          </button>

          <button onClick={() => setPreview(true)} className="btn-secondary btn-sm">
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button onClick={handleSave} className="btn-primary btn-sm" disabled={saving}>
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Block Palette */}
        <div className="w-64 bg-white border-r overflow-y-auto shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className="p-4">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3">Blocks</h3>
            {categories.map((cat) => (
              <div key={cat} className="mb-4">
                <p className="text-xs text-muted-foreground mb-2 capitalize">{cat}</p>
                <div className="space-y-2">
                  {BLOCK_DEFINITIONS.filter((d) => d.category === cat).map((def) => (
                    <PaletteItem key={def.type} type={def.type} label={def.label} icon={def.icon} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-8"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleCanvasDrop}
          onClick={(e) => { e.stopPropagation(); deselectAll(); }}>
          <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm min-h-[600px] overflow-hidden">

            {/* ── Header Nav Preview ── */}
            {(() => {
              const headerActive = navSelected && navActivePos === 'header';
              return (
                <div
                  className={cn(
                    'relative group/nav cursor-pointer transition-all',
                    headerActive ? 'ring-2 ring-primary ring-offset-0' : 'hover:ring-2 hover:ring-primary/30',
                  )}
                  onClick={(e) => { e.stopPropagation(); selectNav('header'); }}>
                  <div className="pointer-events-none select-none">
                    <SiteNavbar
                      items={headerNavItems.filter((i) => !i.isHidden)}
                      logo={companyLogo}
                      companyName={companyName || pageTitle}
                      primaryColor={accentColor}
                      sticky={false}
                      settings={headerNavSettings}
                    />
                  </div>
                  <div className={cn(
                    'absolute inset-0 flex items-center justify-end pr-4 transition-opacity pointer-events-none',
                    headerActive ? 'opacity-100' : 'opacity-0 group-hover/nav:opacity-100',
                  )}>
                    <span className={cn(
                      'text-xs px-2.5 py-1 rounded-full font-medium shadow',
                      headerActive ? 'bg-primary text-white' : 'bg-white border border-primary/40 text-primary'
                    )}>
                      {headerActive ? '✓ Editing Header' : '✎ Edit Header Nav'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* ── Blocks ── */}
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground"
                onClick={(e) => { e.stopPropagation(); deselectAll(); }}>
                <Plus className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-lg font-medium">Drag blocks here to start building</p>
                <p className="text-sm mt-1">Or drag from the blocks panel on the left</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter}
                onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
                onDragEnd={handleDragEnd}>
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  {blocks.map((block) => (
                    <SortableBlock
                      key={block.id} block={block}
                      isSelected={selectedId === block.id}
                      onSelect={(e?: React.MouseEvent) => { e?.stopPropagation(); selectBlock(block.id); }}
                      onDelete={() => deleteBlock(block.id)}
                      onDuplicate={() => duplicateBlock(block.id)}
                      primaryColor={primaryColor}
                      language={currentLang}
                    />
                  ))}
                </SortableContext>
                <DragOverlay>
                  {activeId ? (
                    <div className="opacity-80 shadow-2xl">
                      <BlockRenderer block={blocks.find((b) => b.id === activeId)!}
                        primaryColor={primaryColor} language={currentLang} />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}

            {/* ── Footer Nav Preview ── */}
            {(() => {
              const footerActive = navSelected && navActivePos === 'footer';
              return (
                <div
                  className={cn(
                    'relative group/fnav cursor-pointer transition-all',
                    footerActive ? 'ring-2 ring-primary ring-offset-0' : 'hover:ring-2 hover:ring-primary/30',
                  )}
                  onClick={(e) => { e.stopPropagation(); selectNav('footer'); }}>
                  <div className="pointer-events-none select-none">
                    <SiteFooter
                      items={footerNavItems.filter((i) => !i.isHidden)}
                      primaryColor={accentColor}
                      settings={footerNavSettings}
                    />
                  </div>
                  <div className={cn(
                    'absolute inset-0 flex items-center justify-end pr-4 transition-opacity pointer-events-none',
                    footerActive ? 'opacity-100' : 'opacity-0 group-hover/fnav:opacity-100',
                  )}>
                    <span className={cn(
                      'text-xs px-2.5 py-1 rounded-full font-medium shadow',
                      footerActive ? 'bg-primary text-white' : 'bg-white border border-primary/40 text-primary'
                    )}>
                      {footerActive ? '✓ Editing Footer' : '✎ Edit Footer Nav'}
                    </span>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-72 bg-white border-l overflow-y-auto shrink-0" onClick={(e) => e.stopPropagation()}>
          <div className="p-4">
            {selectedBlock ? (
              <BlockProperties
                block={selectedBlock}
                onChange={(props) => updateBlockProps(selectedBlock.id, props)}
                companyId={companyId}
                currentLang={currentLang}
              />
            ) : navSelected && siteId ? (
              <NavPanel
                key={siteId}
                siteId={siteId}
                pages={pages}
                primaryColor={accentColor}
                activePos={navActivePos}
                onPosChange={setNavActivePos}
                onLiveChange={(pos, newItems, newSettings) => {
                  if (pos === 'header') {
                    setHeaderNavItems(newItems);
                    setHeaderNavSettings(newSettings);
                  } else {
                    setFooterNavItems(newItems);
                    setFooterNavSettings(newSettings);
                  }
                }}
                onSave={(pos, newItems, newSettings) => {
                  if (pos === 'header') {
                    setHeaderNavItems(newItems);
                    setHeaderNavSettings(newSettings);
                  } else {
                    setFooterNavItems(newItems);
                    setFooterNavSettings(newSettings);
                  }
                }}
              />
            ) : (
              <div className="text-center text-muted-foreground py-12 space-y-3">
                <Navigation className="w-8 h-8 mx-auto opacity-30" />
                <div>
                  <p className="text-sm font-medium">Nothing selected</p>
                  <p className="text-xs mt-1">Click a block or the navigation bar to edit</p>
                </div>
                <button onClick={() => selectNav()}
                  className="btn-secondary btn-sm mx-auto flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5" /> Edit Navigation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
