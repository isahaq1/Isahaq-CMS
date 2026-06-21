'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, GripVertical, Trash2, Save, ChevronDown, ChevronRight,
  ExternalLink, Eye, EyeOff, Settings, MoveUp, MoveDown,
  LayoutTemplate, PanelBottom, PanelLeft, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardShell, PageHeader, LoadingSpinner } from '@/components/layout/sidebar';
import { generateId, cn } from '@/lib/utils';
import { FooterTextEditor } from '@/components/builder/footer-text-editor';
import type { Site, Navigation, NavItem, NavItemType, NavPosition, NavStyle, Page } from '@group-cms/shared';

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: NavItemType; label: string; color: string }[] = [
  { value: 'link', label: 'Link', color: 'bg-blue-100 text-blue-700' },
  { value: 'dropdown', label: 'Dropdown', color: 'bg-purple-100 text-purple-700' },
  { value: 'button', label: 'Button', color: 'bg-green-100 text-green-700' },
  { value: 'separator', label: 'Separator', color: 'bg-gray-100 text-gray-500' },
];

const ICON_OPTIONS = [
  { value: '', label: 'No icon' },
  { value: 'home', label: '🏠 Home' },
  { value: 'info', label: 'ℹ️ About' },
  { value: 'phone', label: '📞 Contact' },
  { value: 'mail', label: '✉️ Email' },
  { value: 'shop', label: '🛍️ Shop' },
  { value: 'blog', label: '📝 Blog' },
  { value: 'star', label: '⭐ Star' },
  { value: 'heart', label: '❤️ Heart' },
  { value: 'globe', label: '🌐 Globe' },
  { value: 'lock', label: '🔒 Login' },
  { value: 'user', label: '👤 User' },
  { value: 'arrow', label: '→ Arrow' },
];

const ICON_EMOJI: Record<string, string> = {
  home: '🏠', info: 'ℹ️', phone: '📞', mail: '✉️', shop: '🛍️',
  blog: '📝', star: '⭐', heart: '❤️', globe: '🌐', lock: '🔒',
  user: '👤', arrow: '→',
};

const POSITION_TABS: { value: NavPosition; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'header', label: 'Header', icon: LayoutTemplate, description: 'Top navigation bar with dropdowns and CTAs' },
  { value: 'footer', label: 'Footer', icon: PanelBottom, description: 'Bottom footer links grouped by section' },
  { value: 'sidebar', label: 'Sidebar', icon: PanelLeft, description: 'Side navigation for portals or dashboards' },
];

// ── Child item editor ─────────────────────────────────────────────────────────

function ChildItemRow({
  item, index, total, pages, onChange, onDelete, onMove,
}: {
  item: NavItem; index: number; total: number; pages: Page[];
  onChange: (d: Partial<NavItem>) => void;
  onDelete: () => void; onMove: (dir: 1 | -1) => void;
}) {
  const [open, setOpen] = useState(false);
  const isSep = item.type === 'separator';

  return (
    <div className={cn('border rounded-lg bg-white', open && 'shadow-sm')}>
      <div className="flex items-center gap-2 p-2.5">
        <div className="flex flex-col gap-0.5 shrink-0">
          <button disabled={index === 0} onClick={() => onMove(-1)}
            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30">
            <MoveUp className="w-3 h-3" />
          </button>
          <button disabled={index === total - 1} onClick={() => onMove(1)}
            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30">
            <MoveDown className="w-3 h-3" />
          </button>
        </div>

        <select className="input py-1 text-xs w-28 shrink-0"
          value={item.type || 'link'}
          onChange={(e) => onChange({ type: e.target.value as NavItemType })}>
          {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        {!isSep ? (
          <>
            {item.icon && <span className="text-sm shrink-0">{ICON_EMOJI[item.icon] || ''}</span>}
            <input className="input py-1 text-xs flex-1 min-w-0" placeholder="Label"
              value={item.label} onChange={(e) => onChange({ label: e.target.value })} />
            <input className="input py-1 text-xs flex-1 min-w-0" placeholder="/url or https://…"
              value={item.url} onChange={(e) => onChange({ url: e.target.value })} />
            {pages.length > 0 && (
              <select className="input py-1 text-xs w-32 shrink-0"
                value={item.pageId || ''}
                onChange={(e) => {
                  const pg = pages.find((p) => p.id === e.target.value);
                  onChange({ pageId: e.target.value || undefined, url: pg ? `/${pg.slug}` : item.url });
                }}>
                <option value="">— page —</option>
                {pages.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            )}
          </>
        ) : (
          <span className="flex-1 text-xs text-gray-400 italic">Horizontal divider</span>
        )}

        <button onClick={() => setOpen((v) => !v)} className="p-1 text-gray-400 hover:text-gray-600 shrink-0">
          <Settings className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-1 text-red-400 hover:text-red-600 shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {open && !isSep && (
        <div className="px-3 pb-3 pt-1 border-t grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="label text-xs mb-1 block">Icon</label>
            <select className="input text-xs" value={item.icon || ''}
              onChange={(e) => onChange({ icon: e.target.value || undefined })}>
              {ICON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs mb-1 block">Badge</label>
            <input className="input text-xs" placeholder="New" value={item.badge || ''}
              onChange={(e) => onChange({ badge: e.target.value || undefined })} />
          </div>
          <div>
            <label className="label text-xs mb-1 block">Badge Color</label>
            <div className="flex gap-1">
              <input type="color" className="w-8 h-8 p-0.5 rounded border cursor-pointer"
                value={item.badgeColor || '#2563eb'}
                onChange={(e) => onChange({ badgeColor: e.target.value })} />
              <input className="input text-xs flex-1" value={item.badgeColor || ''}
                onChange={(e) => onChange({ badgeColor: e.target.value || undefined })} placeholder="#2563eb" />
            </div>
          </div>
          <div>
            <label className="label text-xs mb-1 block">CSS Class</label>
            <input className="input text-xs" placeholder="my-class" value={item.cssClass || ''}
              onChange={(e) => onChange({ cssClass: e.target.value || undefined })} />
          </div>
          <div className="col-span-2 flex gap-4">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" className="rounded" checked={!!item.openInNewTab}
                onChange={(e) => onChange({ openInNewTab: e.target.checked })} />
              Open in new tab
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" className="rounded" checked={!!item.isHidden}
                onChange={(e) => onChange({ isHidden: e.target.checked })} />
              Hidden
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sortable top-level item ───────────────────────────────────────────────────

function SortableNavItem({
  item, pages, onUpdate, onDelete,
}: {
  item: NavItem; pages: Page[];
  onUpdate: (id: string, d: Partial<NavItem>) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [childrenOpen, setChildrenOpen] = useState(false);

  const isSep = item.type === 'separator';
  const isDrop = item.type === 'dropdown';
  const children = item.children || [];
  const typeInfo = TYPE_OPTIONS.find((t) => t.value === (item.type || 'link'));

  const updateChild = (i: number, d: Partial<NavItem>) =>
    onUpdate(item.id, { children: children.map((c, idx) => (idx === i ? { ...c, ...d } : c)) });

  const deleteChild = (i: number) =>
    onUpdate(item.id, { children: children.filter((_, idx) => idx !== i) });

  const moveChild = (i: number, dir: 1 | -1) => {
    const next = [...children];
    const t = i + dir;
    if (t < 0 || t >= next.length) return;
    [next[i], next[t]] = [next[t], next[i]];
    onUpdate(item.id, { children: next });
  };

  const addChild = () => {
    onUpdate(item.id, {
      children: [...children, { id: generateId(), label: 'Sub Item', url: '/', type: 'link' }],
    });
    setChildrenOpen(true);
  };

  return (
    <div ref={setNodeRef} style={style}
      className={cn('border rounded-xl bg-white shadow-sm overflow-hidden', isDrop && 'border-purple-200')}>

      {/* Main row */}
      <div className="flex items-center gap-3 p-3">
        <button {...attributes} {...listeners} className="cursor-grab p-1 text-gray-300 hover:text-gray-500 shrink-0">
          <GripVertical className="w-5 h-5" />
        </button>

        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full shrink-0', typeInfo?.color)}>
          {typeInfo?.label || 'Link'}
        </span>

        {!isSep ? (
          <>
            {item.icon && <span className="text-base shrink-0">{ICON_EMOJI[item.icon] || ''}</span>}
            <input className="input flex-1 min-w-0" value={item.label} placeholder="Label"
              onChange={(e) => onUpdate(item.id, { label: e.target.value })} />
            <input className="input flex-1 min-w-0" value={item.url} placeholder="/url or https://…"
              onChange={(e) => onUpdate(item.id, { url: e.target.value })} />
            {pages.length > 0 && (
              <select className="input shrink-0 w-36" value={item.pageId || ''}
                onChange={(e) => {
                  const pg = pages.find((p) => p.id === e.target.value);
                  onUpdate(item.id, { pageId: e.target.value || undefined, url: pg ? `/${pg.slug}` : item.url });
                }}>
                <option value="">— page —</option>
                {pages.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            )}
            {item.badge && (
              <span className="px-1.5 py-0.5 text-xs font-bold rounded text-white shrink-0"
                style={{ backgroundColor: item.badgeColor || '#2563eb' }}>
                {item.badge}
              </span>
            )}
          </>
        ) : (
          <span className="flex-1 text-sm text-gray-400 italic">Horizontal separator</span>
        )}

        <button onClick={() => onUpdate(item.id, { isHidden: !item.isHidden })}
          title={item.isHidden ? 'Hidden' : 'Visible'}
          className={cn('p-1 shrink-0', item.isHidden ? 'text-gray-300' : 'text-gray-400 hover:text-gray-600')}>
          {item.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        {item.openInNewTab && (
          <span title="Opens in new tab" className="shrink-0 text-gray-400">
            <ExternalLink className="w-4 h-4" />
          </span>
        )}

        <button onClick={() => setSettingsOpen((v) => !v)}
          className={cn('p-1 shrink-0 transition-colors', settingsOpen ? 'text-primary' : 'text-gray-400 hover:text-gray-600')}>
          <Settings className="w-4 h-4" />
        </button>

        {(isDrop || children.length > 0) && (
          <button onClick={() => setChildrenOpen((v) => !v)}
            className={cn('p-1 shrink-0', childrenOpen ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600')}>
            {childrenOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}

        <button onClick={() => onDelete(item.id)} className="p-1 text-red-400 hover:text-red-600 shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Settings panel */}
      {settingsOpen && !isSep && (
        <div className="border-t bg-gray-50 px-4 py-3 grid grid-cols-3 gap-3 text-xs">
          <div>
            <label className="label text-xs mb-1 block">Item Type</label>
            <select className="input text-xs" value={item.type || 'link'}
              onChange={(e) => onUpdate(item.id, { type: e.target.value as NavItemType })}>
              {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs mb-1 block">Icon</label>
            <select className="input text-xs" value={item.icon || ''}
              onChange={(e) => onUpdate(item.id, { icon: e.target.value || undefined })}>
              {ICON_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs mb-1 block">CSS Class</label>
            <input className="input text-xs" placeholder="custom-class" value={item.cssClass || ''}
              onChange={(e) => onUpdate(item.id, { cssClass: e.target.value || undefined })} />
          </div>
          <div>
            <label className="label text-xs mb-1 block">Badge Text</label>
            <input className="input text-xs" placeholder="New / Hot" value={item.badge || ''}
              onChange={(e) => onUpdate(item.id, { badge: e.target.value || undefined })} />
          </div>
          <div>
            <label className="label text-xs mb-1 block">Badge Color</label>
            <div className="flex gap-1">
              <input type="color" className="w-8 h-8 p-0.5 rounded border cursor-pointer"
                value={item.badgeColor || '#2563eb'}
                onChange={(e) => onUpdate(item.id, { badgeColor: e.target.value })} />
              <input className="input text-xs flex-1" value={item.badgeColor || ''}
                placeholder="#2563eb"
                onChange={(e) => onUpdate(item.id, { badgeColor: e.target.value || undefined })} />
            </div>
          </div>
          <div className="flex flex-col justify-end gap-1">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" className="rounded" checked={!!item.openInNewTab}
                onChange={(e) => onUpdate(item.id, { openInNewTab: e.target.checked })} />
              Open in new tab
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" className="rounded" checked={!!item.isHidden}
                onChange={(e) => onUpdate(item.id, { isHidden: e.target.checked })} />
              Hide item
            </label>
          </div>
        </div>
      )}

      {/* Children panel */}
      {childrenOpen && (
        <div className="border-t bg-purple-50/40 px-4 py-3 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-purple-700">Sub-items (dropdown children)</p>
            <button onClick={addChild} className="btn-secondary btn-sm text-xs py-1 px-2">
              <Plus className="w-3 h-3" /> Add sub-item
            </button>
          </div>
          {children.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No sub-items yet.</p>
          ) : children.map((child, i) => (
            <ChildItemRow key={child.id} item={child} index={i} total={children.length}
              pages={pages}
              onChange={(d) => updateChild(i, d)}
              onDelete={() => deleteChild(i)}
              onMove={(dir) => moveChild(i, dir)} />
          ))}
        </div>
      )}

      {isDrop && !childrenOpen && children.length === 0 && (
        <div className="border-t px-3 py-1.5">
          <button onClick={addChild} className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add first sub-item
          </button>
        </div>
      )}
    </div>
  );
}

// ── Style settings helpers ────────────────────────────────────────────────────

function ColorField({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label text-xs mb-1 block">{label}</label>
      <div className="flex gap-1.5">
        <input type="color" className="w-8 h-8 p-0.5 rounded border cursor-pointer shrink-0"
          value={value || '#ffffff'} onChange={(e) => onChange(e.target.value)} />
        <input className="input text-xs flex-1 font-mono" value={value || ''}
          placeholder="#ffffff" onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function NavStyleEditor({ settings, onChange, position }: {
  settings: NavStyle;
  onChange: (s: NavStyle) => void;
  position: NavPosition;
}) {
  const set = (patch: Partial<NavStyle>) => onChange({ ...settings, ...patch });

  // ── Footer style editor ──────────────────────────────────────────────────────
  if (position === 'footer') {
    return (
      <div className="space-y-6 max-w-2xl">
        {/* Visibility */}
        <div className="p-4 border rounded-xl bg-white space-y-3">
          <h4 className="text-sm font-semibold">Visibility</h4>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="rounded" checked={settings.footerHidden !== true}
              onChange={(e) => set({ footerHidden: !e.target.checked })} />
            Show footer on site
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="rounded" checked={settings.footerDivider !== false}
              onChange={(e) => set({ footerDivider: e.target.checked })} />
            Show top border / divider
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="rounded" checked={settings.footerShowContent !== false}
              onChange={(e) => set({ footerShowContent: e.target.checked })} />
            Show main content area
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="rounded" checked={settings.footerShowCopyright !== false}
              onChange={(e) => set({ footerShowCopyright: e.target.checked })} />
            Show copyright bar
          </label>
        </div>

        {/* Background */}
        <div className="p-4 border rounded-xl bg-white space-y-3">
          <h4 className="text-sm font-semibold">Background</h4>
          <div className="grid grid-cols-2 gap-3">
            <ColorField label="Background Color" value={settings.footerBg} onChange={(v) => set({ footerBg: v })} />
          </div>
          {settings.footerDivider !== false && (
            <div className="grid grid-cols-2 gap-3">
              <ColorField label="Border Color" value={settings.footerBorderColor} onChange={(v) => set({ footerBorderColor: v })} />
            </div>
          )}
        </div>

        {/* Text */}
        <div className="p-4 border rounded-xl bg-white space-y-3">
          <h4 className="text-sm font-semibold">Text</h4>
          <div className="grid grid-cols-2 gap-3">
            <ColorField label="Body Text" value={settings.footerTextColor} onChange={(v) => set({ footerTextColor: v })} />
            <ColorField label="Section Heading" value={settings.footerHeadingColor} onChange={(v) => set({ footerHeadingColor: v })} />
            <ColorField label="Link Color" value={settings.footerLinkColor} onChange={(v) => set({ footerLinkColor: v })} />
            <ColorField label="Link Hover" value={settings.hoverTextColor} onChange={(v) => set({ hoverTextColor: v })} />
          </div>
        </div>

        {/* Bottom bar */}
        {settings.footerShowCopyright !== false && (
          <div className="p-4 border rounded-xl bg-white space-y-3">
            <h4 className="text-sm font-semibold">Bottom Bar</h4>
            <div className="grid grid-cols-2 gap-3">
              <ColorField label="Bottom Bg" value={settings.footerBottomBg} onChange={(v) => set({ footerBottomBg: v })} />
              <ColorField label="Bottom Text" value={settings.footerBottomTextColor} onChange={(v) => set({ footerBottomTextColor: v })} />
            </div>
            <div>
              <label className="label text-xs mb-1 block">Copyright Text</label>
              <input className="input text-sm" placeholder={`© ${new Date().getFullYear()}. All rights reserved.`}
                value={settings.footerText || ''}
                onChange={(e) => set({ footerText: e.target.value || undefined })} />
            </div>
          </div>
        )}

        {/* Layout */}
        <div className="p-4 border rounded-xl bg-white space-y-3">
          <h4 className="text-sm font-semibold">Layout</h4>
          <div className="flex gap-2">
            {(['columns', 'centered', 'minimal'] as const).map((l) => (
              <button key={l}
                className={cn('flex-1 py-2 text-sm rounded border capitalize transition-colors',
                  (settings.footerLayout || 'columns') === l ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 hover:bg-gray-50')}
                onClick={() => set({ footerLayout: l })}>
                {l}
              </button>
            ))}
          </div>
          <div>
            <label className="label text-xs mb-1 block">Vertical Padding</label>
            <div className="flex gap-2">
              {(['sm', 'md', 'lg'] as const).map((p) => (
                <button key={p}
                  className={cn('flex-1 py-1.5 text-sm rounded border transition-colors',
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

  // ── Header / sidebar style editor ────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Visibility */}
      <div className="p-4 border rounded-xl bg-white space-y-3">
        <h4 className="text-sm font-semibold">Visibility</h4>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" className="rounded" checked={settings.navHidden !== true}
            onChange={(e) => set({ navHidden: !e.target.checked })} />
          Show header on site
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" className="rounded" checked={settings.navShowLogo !== false}
            onChange={(e) => set({ navShowLogo: e.target.checked })} />
          Show logo / brand area
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" className="rounded" checked={settings.navShowMenu !== false}
            onChange={(e) => set({ navShowMenu: e.target.checked })} />
          Show navigation menu
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" className="rounded" checked={settings.navShowMobileMenu !== false}
            onChange={(e) => set({ navShowMobileMenu: e.target.checked })} />
          Show mobile menu button
        </label>
      </div>

      {/* Background */}
      <div className="p-4 border rounded-xl bg-white space-y-3">
        <h4 className="text-sm font-semibold">Background</h4>
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Bg Color" value={settings.bgColor} onChange={(v) => set({ bgColor: v })} />
          <div>
            <label className="label text-xs mb-1 block">Opacity ({settings.bgOpacity ?? 100}%)</label>
            <input type="range" min={0} max={100} step={5} className="w-full accent-primary"
              value={settings.bgOpacity ?? 100} onChange={(e) => set({ bgOpacity: Number(e.target.value) })} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" className="rounded" checked={!!settings.bgBlur}
            onChange={(e) => set({ bgBlur: e.target.checked })} />
          Frosted glass blur (when transparent)
        </label>
      </div>

      {/* Border & Shadow */}
      <div className="p-4 border rounded-xl bg-white space-y-3">
        <h4 className="text-sm font-semibold">Border & Shadow</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="rounded" checked={settings.borderBottom !== false}
                onChange={(e) => set({ borderBottom: e.target.checked })} />
              Bottom border
            </label>
            {settings.borderBottom !== false && (
              <ColorField label="Border Color" value={settings.borderColor} onChange={(v) => set({ borderColor: v })} />
            )}
          </div>
          <div>
            <label className="label text-xs mb-1 block">Shadow</label>
            <div className="flex gap-1">
              {(['none', 'sm', 'md', 'lg'] as const).map((sh) => (
                <button key={sh}
                  className={cn('flex-1 py-1.5 text-xs rounded border transition-colors',
                    (settings.shadow || 'none') === sh ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 hover:bg-gray-50')}
                  onClick={() => set({ shadow: sh })}>
                  {sh}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Height (header only) */}
      {position === 'header' && (
        <div className="p-4 border rounded-xl bg-white space-y-3">
          <h4 className="text-sm font-semibold">Height</h4>
          <div className="flex gap-2">
            {(['sm', 'md', 'lg'] as const).map((h) => (
              <button key={h}
                className={cn('flex-1 py-2 text-sm rounded border transition-colors',
                  (settings.height || 'md') === h ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 hover:bg-gray-50')}
                onClick={() => set({ height: h })}>
                {h === 'sm' ? 'Compact (48px)' : h === 'md' ? 'Normal (64px)' : 'Tall (80px)'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Link colors */}
      <div className="p-4 border rounded-xl bg-white space-y-3">
        <h4 className="text-sm font-semibold">Links</h4>
        <div className="grid grid-cols-3 gap-3">
          <ColorField label="Text Color" value={settings.textColor} onChange={(v) => set({ textColor: v })} />
          <ColorField label="Hover Text" value={settings.hoverTextColor} onChange={(v) => set({ hoverTextColor: v })} />
          <ColorField label="Hover Bg" value={settings.hoverBgColor} onChange={(v) => set({ hoverBgColor: v })} />
        </div>
      </div>

      {/* Logo */}
      {settings.navShowLogo !== false && (
        <div className="p-4 border rounded-xl bg-white space-y-3">
          <h4 className="text-sm font-semibold">Logo</h4>
          <div className="grid grid-cols-2 gap-3">
            <ColorField label="Logo Text Color" value={settings.logoTextColor} onChange={(v) => set({ logoTextColor: v })} />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="rounded" checked={!!settings.navShowCompanyName}
              onChange={(e) => set({ navShowCompanyName: e.target.checked })} />
            Show company name text alongside logo image
          </label>
        </div>
      )}

      {/* Behavior */}
      <div className="p-4 border rounded-xl bg-white space-y-3">
        <h4 className="text-sm font-semibold">Behavior</h4>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" className="rounded" checked={!!settings.navSticky}
            onChange={(e) => set({ navSticky: e.target.checked })} />
          Sticky header (stays fixed at top when scrolling)
        </label>
      </div>

      {/* CTA Button Items */}
      {position === 'header' && (
        <>
          <div className="p-4 border rounded-xl bg-white space-y-3">
            <h4 className="text-sm font-semibold">CTA Button Items</h4>
            <div className="grid grid-cols-3 gap-3">
              <ColorField label="Button Bg" value={settings.ctaBgColor} onChange={(v) => set({ ctaBgColor: v })} />
              <ColorField label="Button Text" value={settings.ctaTextColor} onChange={(v) => set({ ctaTextColor: v })} />
              <div>
                <label className="label text-xs mb-1 block">Border Radius</label>
                <input className="input text-xs font-mono" placeholder="0.5rem or 9999px"
                  value={settings.ctaBorderRadius || ''}
                  onChange={(e) => set({ ctaBorderRadius: e.target.value || undefined })} />
              </div>
            </div>
          </div>

          <div className="p-4 border rounded-xl bg-white space-y-3">
            <h4 className="text-sm font-semibold">Dropdown Panel</h4>
            <div className="grid grid-cols-3 gap-3">
              <ColorField label="Panel Bg" value={settings.dropdownBg} onChange={(v) => set({ dropdownBg: v })} />
              <ColorField label="Text Color" value={settings.dropdownTextColor} onChange={(v) => set({ dropdownTextColor: v })} />
              <ColorField label="Border Color" value={settings.dropdownBorderColor} onChange={(v) => set({ dropdownBorderColor: v })} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Nav editor for one position ───────────────────────────────────────────────

function NavEditor({
  siteId, position, pages,
}: {
  siteId: string;
  position: NavPosition;
  pages: Page[];
}) {
  const [navigation, setNavigation] = useState<Navigation | null>(null);
  const [items, setItems] = useState<NavItem[]>([]);
  const [settings, setSettings] = useState<NavStyle>({});
  const [innerTab, setInnerTab] = useState<'items' | 'style'>('items');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(async () => {
    setLoading(true);
    const navs = await api.getNavigations(siteId, position);
    let nav = (navs as Navigation[]).find((n) => n.position === position) ?? null;

    // Auto-create so the Style/Visibility tab is always accessible
    if (!nav) {
      const posLabel = position.charAt(0).toUpperCase() + position.slice(1);
      nav = await api.createNavigation({
        siteId, position,
        name: `${posLabel} Navigation`,
        items: [],
      }) as Navigation;
    }

    setNavigation(nav);
    setItems(nav ? (nav.items as NavItem[]) : []);
    setSettings(nav ? (nav.settings as NavStyle ?? {}) : {});
    setLoading(false);
  }, [siteId, position]);

  useEffect(() => { load(); }, [load]);

  const addItem = () =>
    setItems((prev) => [...prev, { id: generateId(), label: 'New Item', url: '/', type: 'link' }]);

  const updateItem = (id: string, data: Partial<NavItem>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));

  const deleteItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oi = prev.findIndex((i) => i.id === active.id);
        const ni = prev.findIndex((i) => i.id === over.id);
        return arrayMove(prev, oi, ni);
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus('idle');
    try {
      let nav = navigation;
      if (!nav) {
        const posLabel = position.charAt(0).toUpperCase() + position.slice(1);
        nav = await api.createNavigation({
          siteId, position,
          name: `${posLabel} Navigation`,
          items: [],
        }) as Navigation;
        setNavigation(nav);
      }
      await api.updateNavigation(nav.id, { items, settings });
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );

  const visibleCount = items.filter((i) => !i.isHidden).length;
  const hiddenCount = items.filter((i) => i.isHidden).length;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {/* Content / Style inner tabs */}
          <div className="flex rounded-lg border overflow-hidden">
            <button
              className={cn('px-4 py-1.5 text-sm font-medium transition-colors',
                innerTab === 'items' ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 hover:bg-gray-50')}
              onClick={() => setInnerTab('items')}>
              {position === 'footer' ? 'Content' : `Items${innerTab === 'items' && items.length > 0 ? ` (${visibleCount}${hiddenCount > 0 ? `+${hiddenCount}h` : ''})` : ''}`}
            </button>
            <button
              className={cn('px-4 py-1.5 text-sm font-medium transition-colors',
                innerTab === 'style' ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 hover:bg-gray-50')}
              onClick={() => setInnerTab('style')}>
              Style
            </button>
          </div>
          {/* Show item type legend only for header items tab */}
          {position !== 'footer' && innerTab === 'items' && (
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((t) => (
                <span key={t.value} className={cn('text-xs px-2 py-0.5 rounded-full font-medium', t.color)}>
                  {t.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {status === 'saved' && (
            <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          {status === 'error' && (
            <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
              <AlertCircle className="w-3.5 h-3.5" /> Save failed
            </span>
          )}
          {/* Add Item button only for header */}
          {position !== 'footer' && innerTab === 'items' && (
            <button className="btn-secondary btn-sm" onClick={addItem}>
              <Plus className="w-4 h-4" /> Add Item
            </button>
          )}
          <button className="btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Tab content */}
      {innerTab === 'items' ? (
        position === 'footer' ? (
          /* ── Footer: rich text editor + copyright ── */
          <div className="max-w-4xl space-y-4">
            <FooterTextEditor
              value={settings.footerContent || ''}
              onChange={(html) => setSettings((prev) => ({ ...prev, footerContent: html }))}
            />
            <p className="text-xs text-muted-foreground">
              Use the toolbar to format text, add headings, lists, links and colours. Changes are saved when you click Save.
            </p>

            {/* Copyright bar */}
            <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Copyright Bar</h4>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="rounded"
                    checked={settings.footerShowCopyright !== false}
                    onChange={(e) => setSettings((prev) => ({ ...prev, footerShowCopyright: e.target.checked }))} />
                  Show
                </label>
              </div>
              {settings.footerShowCopyright !== false && (
                <div>
                  <label className="label text-xs mb-1 block">Copyright text</label>
                  <input
                    className="input text-sm w-full"
                    placeholder={`© ${new Date().getFullYear()}. All rights reserved.`}
                    value={settings.footerText || ''}
                    onChange={(e) => setSettings((prev) => ({ ...prev, footerText: e.target.value || undefined }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave blank to auto-generate.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── Header / sidebar: items list ── */
          items.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
              <p className="font-medium mb-1">No items yet</p>
              <p className="text-sm mb-4">Click &quot;Add Item&quot; to start building this menu</p>
              <button className="btn-primary" onClick={addItem}>
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 max-w-4xl">
                  {items.map((item) => (
                    <SortableNavItem
                      key={item.id} item={item} pages={pages}
                      onUpdate={updateItem} onDelete={deleteItem}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )
        )
      ) : (
        <NavStyleEditor settings={settings} onChange={setSettings} position={position} />
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NavigationPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [pages, setPages] = useState<Page[]>([]);
  const [activePosition, setActivePosition] = useState<NavPosition>('header');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getSites().then((s) => {
      setSites(s as Site[]);
      if ((s as Site[]).length > 0) setSelectedSite((s as Site[])[0].id);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedSite) return;
    api.getPages(selectedSite).then((pgs) => setPages(pgs as Page[]));
  }, [selectedSite]);

  if (loading) return <DashboardShell><LoadingSpinner /></DashboardShell>;

  const selectedSiteData = sites.find((s) => s.id === selectedSite);

  return (
    <DashboardShell>
      <PageHeader
        title="Navigation"
        description="Manage header, footer, and sidebar menus per site"
      />

      {/* Site selector */}
      <div className="mb-6 p-4 bg-gray-50 border rounded-xl flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-48">
          <label className="label mb-1.5 block text-sm">Site</label>
          <select className="input" value={selectedSite} onChange={(e) => setSelectedSite(e.target.value)}>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        {selectedSiteData && (
          <div className="text-sm text-muted-foreground pb-1">
            {pages.length} page{pages.length !== 1 ? 's' : ''} available for linking
          </div>
        )}
      </div>

      {!selectedSite ? (
        <div className="text-center py-16 text-muted-foreground">Select a site to manage navigation</div>
      ) : (
        <>
          {/* Position tabs */}
          <div className="flex gap-1 border-b mb-6">
            {POSITION_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActivePosition(tab.value)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                    activePosition === tab.value
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Position description */}
          <p className="text-sm text-muted-foreground mb-5">
            {POSITION_TABS.find((t) => t.value === activePosition)?.description}
          </p>

          {/* Editor keyed by site+position so it remounts on change */}
          <NavEditor
            key={`${selectedSite}-${activePosition}`}
            siteId={selectedSite}
            position={activePosition}
            pages={pages}
          />
        </>
      )}
    </DashboardShell>
  );
}
