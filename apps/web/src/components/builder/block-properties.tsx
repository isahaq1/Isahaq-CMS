'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, Plus, X } from 'lucide-react';
import type { PageBlock } from '@group-cms/shared';
import { MediaPicker } from './media-picker';
import { FooterTextEditor } from './footer-text-editor';
import { cn } from '@/lib/utils';

interface BlockPropertiesProps {
  block: PageBlock;
  onChange: (props: Record<string, unknown>) => void;
  companyId?: string;
  currentLang?: string;
}

const TRANSLATABLE_KEYS = new Set([
  'title', 'subtitle', 'text', 'content', 'description',
  'caption', 'ctaText', 'buttonText', 'submitText',
]);

// All keys managed by Style / Layout / Advanced tabs — skip in Content tab
const MANAGED_KEYS = new Set([
  // Style
  'headingColor', 'textColor', 'headingSize', 'fontWeight', 'lineHeight',
  'letterSpacing', 'textTransform',
  'accentColor', 'cardBg', 'cardBorderColor', 'borderRadius', 'shadow',
  'overlayColor', 'overlayOpacity',
  // Layout
  'sectionBgType', 'sectionBg', 'sectionGradientFrom', 'sectionGradientTo', 'sectionGradientDir',
  'sectionPaddingTop', 'sectionPaddingBottom', 'sectionMinHeight', 'sectionWidth',
  'sectionBorderTop', 'sectionBorderBottom',
  'contentMaxWidth', 'contentPaddingX', 'contentPaddingY',
  'gridGap', 'itemPaddingX', 'itemPaddingY',
  'imageHeight', 'imageObjectFit', 'imageObjectPosition',
  'blockOpacity',
  // Advanced
  'fontFamily', 'ctaStyle', 'animateOnScroll', 'customCss',
]);

const IMAGE_URL_KEYS = new Set(['src', 'backgroundImage']);

type Tab = 'content' | 'style' | 'layout' | 'advanced';
type GalleryImage = { src: string; alt: string };
type Slide = { src: string; alt: string; title: string; subtitle: string; link: string };
type FeatureItem   = { icon: string; title: string; description: string };
type TabItem       = { label: string; content: string };
type TestimonialItem = { name: string; role: string; company: string; text: string; avatar: string };
type FaqItem       = { question: string; answer: string };
type PricingPlan   = { name: string; price: string; period: string; description: string; features: string[]; highlighted: boolean; ctaText: string; ctaLink: string };
type TeamMember    = { name: string; role: string; image: string; bio: string };
type StatItem      = { value: string; label: string; prefix: string; suffix: string };
type LogoItem      = { src: string; alt: string; href: string };
type ColumnChild   = { html: string };

const FEATURE_ICONS = [
  'Star', 'Zap', 'Shield', 'Heart', 'Check', 'Globe', 'Settings', 'Lock',
  'Rocket', 'Clock', 'Users', 'Mail', 'Phone', 'Code', 'Database', 'Cloud',
  'Award', 'Lightbulb', 'Target', 'TrendingUp', 'Layers', 'Box', 'Cpu',
  'Eye', 'Headphones', 'Map', 'MessageCircle', 'Smile', 'ThumbsUp',
  'Wrench', 'BarChart', 'Search',
];

function FeaturesItemsEditor({
  items,
  onChange,
}: {
  items: FeatureItem[];
  onChange: (next: FeatureItem[]) => void;
}) {
  const update = (i: number, field: keyof FeatureItem, value: string) => {
    const next = items.map((item, idx) => idx === i ? { ...item, [field]: value } : item);
    onChange(next);
  };

  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  const add = () =>
    onChange([...items, { icon: 'Star', title: 'New Feature', description: 'Feature description' }]);

  return (
    <div className="space-y-3">
      <label className="label">Items</label>
      {items.map((item, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-2 bg-gray-50">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
            <button
              type="button"
              className="text-red-400 hover:text-red-600 p-1 rounded"
              onClick={() => remove(i)}
              title="Remove item"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <label className="label text-xs">Icon</label>
            <select
              className="input text-sm"
              value={item.icon}
              onChange={(e) => update(i, 'icon', e.target.value)}
            >
              {FEATURE_ICONS.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="label text-xs">Title</label>
            <input
              className="input text-sm"
              placeholder="Feature title"
              value={item.title}
              onChange={(e) => update(i, 'title', e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="label text-xs">Description</label>
            <FooterTextEditor value={item.description} onChange={(html) => update(i, 'description', html)} compact />
          </div>
        </div>
      ))}

      <button
        type="button"
        className="btn-secondary w-full btn-sm"
        onClick={add}
      >
        <Plus className="w-4 h-4" /> Add Item
      </button>
    </div>
  );
}

function TabsEditor({
  tabs,
  onChange,
}: {
  tabs: TabItem[];
  onChange: (next: TabItem[]) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(tabs.length > 0 ? 0 : null);

  const updateTab = (i: number, field: keyof TabItem, value: string) => {
    const next = tabs.map((tab, idx) => idx === i ? { ...tab, [field]: value } : tab);
    onChange(next);
  };

  const removeTab = (i: number) => {
    const next = tabs.filter((_, idx) => idx !== i);
    onChange(next);
    setOpenIndex(next.length > 0 ? Math.max(0, i - 1) : null);
  };

  const addTab = () => {
    const next = [...tabs, { label: `Tab ${tabs.length + 1}`, content: '<p>Tab content goes here.</p>' }];
    onChange(next);
    setOpenIndex(next.length - 1);
  };

  const moveTab = (from: number, to: number) => {
    const next = [...tabs];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
    setOpenIndex(to);
  };

  return (
    <div className="space-y-2">
      <label className="label">Tabs</label>

      {tabs.map((tab, i) => (
        <div key={i} className="border rounded-lg overflow-hidden">
          {/* Tab header row */}
          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1.5 border-b">
            <div className="flex gap-0.5">
              <button
                type="button"
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded"
                onClick={() => moveTab(i, i - 1)}
                disabled={i === 0}
                title="Move left"
              >
                ◀
              </button>
              <button
                type="button"
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded"
                onClick={() => moveTab(i, i + 1)}
                disabled={i === tabs.length - 1}
                title="Move right"
              >
                ▶
              </button>
            </div>
            <button
              type="button"
              className="flex-1 text-left text-xs font-medium px-1 truncate"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              {tab.label || `Tab ${i + 1}`}
            </button>
            <button
              type="button"
              className="text-red-400 hover:text-red-600 p-1 rounded shrink-0"
              onClick={() => removeTab(i)}
              title="Remove tab"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Expanded fields */}
          {openIndex === i && (
            <div className="p-3 space-y-3">
              <div className="space-y-1">
                <label className="label text-xs">Tab Label</label>
                <input
                  className="input text-sm"
                  placeholder="Tab label"
                  value={tab.label}
                  onChange={(e) => updateTab(i, 'label', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="label text-xs">Content</label>
                <FooterTextEditor
                  value={tab.content}
                  onChange={(html) => updateTab(i, 'content', html)}
                  compact
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        className="btn-secondary w-full btn-sm"
        onClick={addTab}
      >
        <Plus className="w-4 h-4" /> Add Tab
      </button>
    </div>
  );
}

// ── FAQ Editor ────────────────────────────────────────────────────────────────

function FaqEditor({ items, onChange }: { items: FaqItem[]; onChange: (next: FaqItem[]) => void }) {
  const [open, setOpen] = useState<number | null>(0);
  const upd = (i: number, f: keyof FaqItem, v: string) =>
    onChange(items.map((it, idx) => idx === i ? { ...it, [f]: v } : it));
  const add = () => { onChange([...items, { question: 'New Question', answer: '' }]); setOpen(items.length); };
  const del = (i: number) => { onChange(items.filter((_, idx) => idx !== i)); setOpen(null); };
  return (
    <div className="space-y-2">
      <label className="label">FAQ Items</label>
      {items.map((item, i) => (
        <div key={i} className="border rounded-lg overflow-hidden">
          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1.5">
            <button type="button" className="flex-1 text-left text-xs font-medium px-1 truncate" onClick={() => setOpen(open === i ? null : i)}>
              {open === i ? '▾' : '▸'} {item.question || `Question ${i + 1}`}
            </button>
            <button type="button" className="text-red-400 hover:text-red-600 p-1 rounded" onClick={() => del(i)}><X className="w-3.5 h-3.5" /></button>
          </div>
          {open === i && (
            <div className="p-3 space-y-2 border-t">
              <div className="space-y-1">
                <label className="label text-xs">Question</label>
                <textarea className="input text-sm min-h-[52px] resize-y" value={item.question} onChange={(e) => upd(i, 'question', e.target.value)} placeholder="Question text" />
              </div>
              <div className="space-y-1">
                <label className="label text-xs">Answer</label>
                <FooterTextEditor value={item.answer} onChange={(html) => upd(i, 'answer', html)} compact />
              </div>
            </div>
          )}
        </div>
      ))}
      <button type="button" className="btn-secondary w-full btn-sm" onClick={add}><Plus className="w-4 h-4" /> Add FAQ</button>
    </div>
  );
}

// ── Stats Editor ──────────────────────────────────────────────────────────────

function StatsEditor({ items, onChange }: { items: StatItem[]; onChange: (next: StatItem[]) => void }) {
  const upd = (i: number, f: keyof StatItem, v: string) =>
    onChange(items.map((it, idx) => idx === i ? { ...it, [f]: v } : it));
  const add = () => onChange([...items, { value: '0', label: 'Stat', prefix: '', suffix: '' }]);
  const del = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      <label className="label">Stats</label>
      {items.map((item, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-2 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Stat {i + 1}</span>
            <button type="button" className="text-red-400 hover:text-red-600 p-1 rounded" onClick={() => del(i)}><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="label text-xs">Value</label>
              <input className="input text-sm font-bold" value={item.value} onChange={(e) => upd(i, 'value', e.target.value)} placeholder="100" />
            </div>
            <div className="space-y-1">
              <label className="label text-xs">Label</label>
              <input className="input text-sm" value={item.label} onChange={(e) => upd(i, 'label', e.target.value)} placeholder="Users" />
            </div>
            <div className="space-y-1">
              <label className="label text-xs">Prefix</label>
              <input className="input text-sm" value={item.prefix} onChange={(e) => upd(i, 'prefix', e.target.value)} placeholder="$" />
            </div>
            <div className="space-y-1">
              <label className="label text-xs">Suffix</label>
              <input className="input text-sm" value={item.suffix} onChange={(e) => upd(i, 'suffix', e.target.value)} placeholder="+" />
            </div>
          </div>
        </div>
      ))}
      <button type="button" className="btn-secondary w-full btn-sm" onClick={add}><Plus className="w-4 h-4" /> Add Stat</button>
    </div>
  );
}

// ── Testimonials Editor ───────────────────────────────────────────────────────

function TestimonialsEditor({ items, onChange, companyId }: { items: TestimonialItem[]; onChange: (next: TestimonialItem[]) => void; companyId?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  const [pickerIdx, setPickerIdx] = useState<number | null>(null);
  const upd = (i: number, f: keyof TestimonialItem, v: string) =>
    onChange(items.map((it, idx) => idx === i ? { ...it, [f]: v } : it));
  const add = () => { onChange([...items, { name: 'New Person', role: '', company: '', text: '', avatar: '' }]); setOpen(items.length); };
  const del = (i: number) => { onChange(items.filter((_, idx) => idx !== i)); setOpen(null); };
  return (
    <div className="space-y-2">
      <label className="label">Testimonials</label>
      {items.map((item, i) => (
        <div key={i} className="border rounded-lg overflow-hidden">
          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1.5">
            <button type="button" className="flex-1 text-left text-xs font-medium px-1 truncate" onClick={() => setOpen(open === i ? null : i)}>
              {open === i ? '▾' : '▸'} {item.name || `Person ${i + 1}`}
            </button>
            <button type="button" className="text-red-400 hover:text-red-600 p-1 rounded" onClick={() => del(i)}><X className="w-3.5 h-3.5" /></button>
          </div>
          {open === i && (
            <div className="p-3 space-y-2 border-t">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="label text-xs">Name</label>
                  <input className="input text-sm" value={item.name} onChange={(e) => upd(i, 'name', e.target.value)} placeholder="John Doe" />
                </div>
                <div className="space-y-1">
                  <label className="label text-xs">Role</label>
                  <input className="input text-sm" value={item.role} onChange={(e) => upd(i, 'role', e.target.value)} placeholder="CEO" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="label text-xs">Company</label>
                <input className="input text-sm" value={item.company} onChange={(e) => upd(i, 'company', e.target.value)} placeholder="Acme Corp" />
              </div>
              <div className="space-y-1">
                <label className="label text-xs">Quote</label>
                <FooterTextEditor value={item.text} onChange={(html) => upd(i, 'text', html)} compact />
              </div>
              <div className="space-y-1">
                <label className="label text-xs">Avatar</label>
                {companyId ? (
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center border">
                      {item.avatar
                        ? <img src={item.avatar} alt={item.name} className="w-full h-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                        : <ImageIcon className="w-5 h-5 text-gray-400" />}
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <button type="button" className="btn-secondary btn-sm w-full" onClick={() => setPickerIdx(i)}>
                        <ImageIcon className="w-3.5 h-3.5" /> {item.avatar ? 'Change Photo' : 'Upload Photo'}
                      </button>
                      {item.avatar && (
                        <button type="button" className="text-xs text-red-400 hover:text-red-600" onClick={() => upd(i, 'avatar', '')}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <input className="input text-sm" value={item.avatar} onChange={(e) => upd(i, 'avatar', e.target.value)} placeholder="https://…" />
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      <button type="button" className="btn-secondary w-full btn-sm" onClick={add}><Plus className="w-4 h-4" /> Add Testimonial</button>

      {pickerIdx !== null && companyId && (
        <MediaPicker
          companyId={companyId}
          onSelect={(url) => { upd(pickerIdx, 'avatar', url); setPickerIdx(null); }}
          onClose={() => setPickerIdx(null)}
        />
      )}
    </div>
  );
}

// ── Team Editor ───────────────────────────────────────────────────────────────

function TeamEditor({ members, onChange, companyId }: { members: TeamMember[]; onChange: (next: TeamMember[]) => void; companyId?: string }) {
  const [open, setOpen] = useState<number | null>(0);
  const [pickerIdx, setPickerIdx] = useState<number | null>(null);
  const upd = (i: number, f: keyof TeamMember, v: string) =>
    onChange(members.map((m, idx) => idx === i ? { ...m, [f]: v } : m));
  const add = () => { onChange([...members, { name: 'New Member', role: '', image: '', bio: '' }]); setOpen(members.length); };
  const del = (i: number) => { onChange(members.filter((_, idx) => idx !== i)); setOpen(null); };
  return (
    <div className="space-y-2">
      <label className="label">Team Members</label>
      {members.map((member, i) => (
        <div key={i} className="border rounded-lg overflow-hidden">
          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1.5">
            <button type="button" className="flex-1 text-left text-xs font-medium px-1 truncate" onClick={() => setOpen(open === i ? null : i)}>
              {open === i ? '▾' : '▸'} {member.name || `Member ${i + 1}`}{member.role ? ` — ${member.role}` : ''}
            </button>
            <button type="button" className="text-red-400 hover:text-red-600 p-1 rounded" onClick={() => del(i)}><X className="w-3.5 h-3.5" /></button>
          </div>
          {open === i && (
            <div className="p-3 space-y-2 border-t">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="label text-xs">Name</label>
                  <input className="input text-sm" value={member.name} onChange={(e) => upd(i, 'name', e.target.value)} placeholder="Jane Smith" />
                </div>
                <div className="space-y-1">
                  <label className="label text-xs">Role</label>
                  <input className="input text-sm" value={member.role} onChange={(e) => upd(i, 'role', e.target.value)} placeholder="Director" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="label text-xs">Photo</label>
                {companyId ? (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center border">
                      {member.image
                        ? <img src={member.image} alt={member.name} className="w-full h-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                        : <ImageIcon className="w-6 h-6 text-gray-400" />}
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <button type="button" className="btn-secondary btn-sm w-full" onClick={() => setPickerIdx(i)}>
                        <ImageIcon className="w-3.5 h-3.5" /> {member.image ? 'Change Photo' : 'Upload Photo'}
                      </button>
                      {member.image && (
                        <button type="button" className="text-xs text-red-400 hover:text-red-600" onClick={() => upd(i, 'image', '')}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <input className="input text-sm" value={member.image} onChange={(e) => upd(i, 'image', e.target.value)} placeholder="https://…" />
                )}
              </div>
              <div className="space-y-1">
                <label className="label text-xs">Bio</label>
                <FooterTextEditor value={member.bio} onChange={(html) => upd(i, 'bio', html)} compact />
              </div>
            </div>
          )}
        </div>
      ))}
      <button type="button" className="btn-secondary w-full btn-sm" onClick={add}><Plus className="w-4 h-4" /> Add Member</button>

      {pickerIdx !== null && companyId && (
        <MediaPicker
          companyId={companyId}
          onSelect={(url) => { upd(pickerIdx, 'image', url); setPickerIdx(null); }}
          onClose={() => setPickerIdx(null)}
        />
      )}
    </div>
  );
}

// ── Pricing Editor ────────────────────────────────────────────────────────────

function PricingEditor({ plans, onChange }: { plans: PricingPlan[]; onChange: (next: PricingPlan[]) => void }) {
  const [open, setOpen] = useState<number | null>(0);
  const upd = (i: number, f: keyof PricingPlan, v: unknown) =>
    onChange(plans.map((p, idx) => idx === i ? { ...p, [f]: v } : p));
  const add = () => {
    onChange([...plans, { name: 'New Plan', price: '0', period: 'mo', description: '', features: [], highlighted: false, ctaText: 'Get Started', ctaLink: '#' }]);
    setOpen(plans.length);
  };
  const del = (i: number) => { onChange(plans.filter((_, idx) => idx !== i)); setOpen(null); };
  return (
    <div className="space-y-2">
      <label className="label">Pricing Plans</label>
      {plans.map((plan, i) => (
        <div key={i} className="border rounded-lg overflow-hidden">
          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1.5">
            <button type="button" className="flex-1 text-left text-xs font-medium px-1 truncate" onClick={() => setOpen(open === i ? null : i)}>
              {open === i ? '▾' : '▸'} {plan.name || `Plan ${i + 1}`}{plan.price ? ` — ${plan.price}` : ''}{plan.highlighted ? ' ⭐' : ''}
            </button>
            <button type="button" className="text-red-400 hover:text-red-600 p-1 rounded" onClick={() => del(i)}><X className="w-3.5 h-3.5" /></button>
          </div>
          {open === i && (
            <div className="p-3 space-y-2 border-t">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 col-span-1">
                  <label className="label text-xs">Name</label>
                  <input className="input text-sm" value={plan.name} onChange={(e) => upd(i, 'name', e.target.value)} placeholder="Starter" />
                </div>
                <div className="space-y-1">
                  <label className="label text-xs">Price</label>
                  <input className="input text-sm" value={plan.price} onChange={(e) => upd(i, 'price', e.target.value)} placeholder="9" />
                </div>
                <div className="space-y-1">
                  <label className="label text-xs">Period</label>
                  <input className="input text-sm" value={plan.period} onChange={(e) => upd(i, 'period', e.target.value)} placeholder="mo" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="label text-xs">Description</label>
                <FooterTextEditor value={plan.description} onChange={(html) => upd(i, 'description', html)} compact />
              </div>
              <div className="space-y-1">
                <label className="label text-xs">Features <span className="font-normal text-muted-foreground">(one per line)</span></label>
                <textarea className="input text-sm font-mono min-h-[80px] resize-y"
                  value={(plan.features || []).join('\n')}
                  onChange={(e) => upd(i, 'features', e.target.value.split('\n').filter((f) => f.trim()))}
                  placeholder={"5 Projects\n10 GB Storage\nBasic Support"} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="label text-xs">Button Text</label>
                  <input className="input text-sm" value={plan.ctaText} onChange={(e) => upd(i, 'ctaText', e.target.value)} placeholder="Get Started" />
                </div>
                <div className="space-y-1">
                  <label className="label text-xs">Button Link</label>
                  <input className="input text-sm" value={plan.ctaLink} onChange={(e) => upd(i, 'ctaLink', e.target.value)} placeholder="#" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!plan.highlighted} onChange={(e) => upd(i, 'highlighted', e.target.checked)} className="rounded" />
                <span className="label text-xs">Mark as Most Popular</span>
              </label>
            </div>
          )}
        </div>
      ))}
      <button type="button" className="btn-secondary w-full btn-sm" onClick={add}><Plus className="w-4 h-4" /> Add Plan</button>
    </div>
  );
}

// ── Logo Bar Editor ───────────────────────────────────────────────────────────

function LogoBarEditor({ logos, onChange }: { logos: LogoItem[]; onChange: (next: LogoItem[]) => void }) {
  const upd = (i: number, f: keyof LogoItem, v: string) =>
    onChange(logos.map((l, idx) => idx === i ? { ...l, [f]: v } : l));
  const add = () => onChange([...logos, { src: '', alt: '', href: '' }]);
  const del = (i: number) => onChange(logos.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      <label className="label">Logos</label>
      {logos.map((logo, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-2 bg-gray-50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {logo.src && (
                <img src={logo.src} alt={logo.alt} className="h-7 w-auto object-contain bg-white rounded p-0.5 shrink-0"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              )}
              <span className="text-xs font-medium text-muted-foreground truncate">{logo.alt || `Logo ${i + 1}`}</span>
            </div>
            <button type="button" className="text-red-400 hover:text-red-600 p-1 rounded shrink-0" onClick={() => del(i)}><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="space-y-1">
            <label className="label text-xs">Image URL</label>
            <input className="input text-sm" value={logo.src} onChange={(e) => upd(i, 'src', e.target.value)} placeholder="https://…" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="label text-xs">Alt Text</label>
              <input className="input text-sm" value={logo.alt} onChange={(e) => upd(i, 'alt', e.target.value)} placeholder="Company name" />
            </div>
            <div className="space-y-1">
              <label className="label text-xs">Link (optional)</label>
              <input className="input text-sm" value={logo.href} onChange={(e) => upd(i, 'href', e.target.value)} placeholder="https://…" />
            </div>
          </div>
        </div>
      ))}
      <button type="button" className="btn-secondary w-full btn-sm" onClick={add}><Plus className="w-4 h-4" /> Add Logo</button>
    </div>
  );
}

// ── Columns Children Editor ───────────────────────────────────────────────────

function ColumnsChildrenEditor({ children, onChange }: { children: ColumnChild[]; onChange: (next: ColumnChild[]) => void }) {
  const [open, setOpen] = useState<number | null>(0);
  const upd = (i: number, v: string) =>
    onChange(children.map((c, idx) => idx === i ? { ...c, html: v } : c));
  const add = () => { onChange([...children, { html: '<p>Column content here.</p>' }]); setOpen(children.length); };
  const del = (i: number) => { onChange(children.filter((_, idx) => idx !== i)); setOpen(null); };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="label">Column Content</label>
        <span className="text-xs text-muted-foreground">{children.length} block{children.length !== 1 ? 's' : ''}</span>
      </div>
      <p className="text-xs text-muted-foreground">Set column count above. One HTML block per column.</p>
      {children.map((child, i) => (
        <div key={i} className="border rounded-lg overflow-hidden">
          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1.5">
            <button type="button" className="flex-1 text-left text-xs font-medium px-1" onClick={() => setOpen(open === i ? null : i)}>
              {open === i ? '▾' : '▸'} Column {i + 1}
            </button>
            <button type="button" className="text-red-400 hover:text-red-600 p-1 rounded" onClick={() => del(i)}><X className="w-3.5 h-3.5" /></button>
          </div>
          {open === i && (
            <div className="p-3 border-t space-y-1">
              <label className="label text-xs">Content</label>
              <FooterTextEditor
                value={child.html || ''}
                onChange={(html) => upd(i, html)}
                compact
              />
            </div>
          )}
        </div>
      ))}
      <button type="button" className="btn-secondary w-full btn-sm" onClick={add}><Plus className="w-4 h-4" /> Add Column</button>
    </div>
  );
}

function getLangValue(value: unknown, lang: string): string {
  if (!value) return '';
  if (typeof value === 'string') return lang === 'en' ? value : '';
  if (typeof value === 'object') return (value as Record<string, string>)[lang] ?? '';
  return '';
}

function setLangValue(current: unknown, lang: string, text: string): unknown {
  if (typeof current === 'string') return lang === 'en' ? text : { en: current, [lang]: text };
  if (typeof current === 'object' && current !== null) return { ...(current as object), [lang]: text };
  return lang === 'en' ? text : { en: '', [lang]: text };
}

function ColorRow({ label, propKey, value, onChange, placeholder = 'inherit' }: {
  label: string; propKey: string; value: unknown;
  onChange: (key: string, val: string) => void; placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="label text-xs">{label}</label>
      <div className="flex gap-2">
        <input type="color" className="w-10 h-9 rounded border cursor-pointer p-0.5 shrink-0"
          value={String(value || '#000000')}
          onChange={(e) => onChange(propKey, e.target.value)} />
        <input className="input flex-1" placeholder={placeholder}
          value={String(value || '')}
          onChange={(e) => onChange(propKey, e.target.value)} />
      </div>
    </div>
  );
}

function SelectRow({ label, propKey, value, options, onChange }: {
  label: string; propKey: string; value: unknown;
  options: { value: string; label: string }[];
  onChange: (key: string, val: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="label text-xs">{label}</label>
      <select className="input" value={String(value || '')} onChange={(e) => onChange(propKey, e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function NumRow({ label, propKey, value, onChange, min = 0 }: {
  label: string; propKey: string; value: unknown;
  onChange: (key: string, val: number) => void; min?: number;
}) {
  return (
    <div className="space-y-1">
      <label className="label text-xs">{label}</label>
      <input type="number" className="input" min={min}
        value={Number(value) || ''}
        onChange={(e) => onChange(propKey, Number(e.target.value) || 0)} />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-muted-foreground pt-2 pb-1 uppercase tracking-wide">{children}</p>;
}

export function BlockProperties({ block, onChange, companyId, currentLang }: BlockPropertiesProps) {
  const [pickerField, setPickerField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('content');

  const update = (key: string, value: unknown) => onChange({ ...block.props, [key]: value });
  const p = block.props;

  const renderField = (key: string, value: unknown) => {
    if (MANAGED_KEYS.has(key)) return null;

    if (TRANSLATABLE_KEYS.has(key) && currentLang) {
      const langVal = getLangValue(value, currentLang);
      const isArea = key === 'content' || key === 'description' || key === 'subtitle';
      return (
        <div key={key} className="space-y-1">
          <label className="label capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
          {isArea
            ? <FooterTextEditor value={langVal} onChange={(html) => update(key, setLangValue(value, currentLang, html))} compact />
            : <input className="input" value={langVal}
                onChange={(e) => update(key, setLangValue(value, currentLang, e.target.value))} />}
        </div>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <label key={key} className="flex items-center gap-2">
          <input type="checkbox" checked={value} onChange={(e) => update(key, e.target.checked)} className="rounded" />
          <span className="label capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
        </label>
      );
    }

    if (key === 'html') {
      return (
        <div key={key} className="space-y-1">
          <label className="label capitalize">{key}</label>
          <FooterTextEditor value={String(value || '')} onChange={(html) => update(key, html)} compact />
        </div>
      );
    }

    if (key === 'items' && block.type === 'features') {
      return (
        <FeaturesItemsEditor
          key={key}
          items={(value as FeatureItem[]) || []}
          onChange={(next) => update(key, next)}
        />
      );
    }

    if (key === 'tabs') {
      return (
        <TabsEditor
          key={key}
          tabs={(value as TabItem[]) || []}
          onChange={(next) => update(key, next)}
        />
      );
    }

    if (key === 'items' && block.type === 'testimonials') {
      return <TestimonialsEditor key={key} items={(value as TestimonialItem[]) || []} onChange={(next) => update(key, next)} companyId={companyId} />;
    }

    if (key === 'items' && block.type === 'faq') {
      return <FaqEditor key={key} items={(value as FaqItem[]) || []} onChange={(next) => update(key, next)} />;
    }

    if (key === 'items' && block.type === 'stats') {
      return <StatsEditor key={key} items={(value as StatItem[]) || []} onChange={(next) => update(key, next)} />;
    }

    if (key === 'plans') {
      return <PricingEditor key={key} plans={(value as PricingPlan[]) || []} onChange={(next) => update(key, next)} />;
    }

    if (key === 'members') {
      return <TeamEditor key={key} members={(value as TeamMember[]) || []} onChange={(next) => update(key, next)} companyId={companyId} />;
    }

    if (key === 'logos') {
      return <LogoBarEditor key={key} logos={(value as LogoItem[]) || []} onChange={(next) => update(key, next)} />;
    }

    if (key === 'children' && block.type === 'columns') {
      return <ColumnsChildrenEditor key={key} children={(value as ColumnChild[]) || []} onChange={(next) => update(key, next)} />;
    }

    if (key === 'gap' && block.type === 'columns') {
      return (
        <div key={key} className="space-y-1">
          <label className="label">Column Gap</label>
          <select className="input" value={String(value || 'md')} onChange={(e) => update(key, e.target.value)}>
            <option value="sm">Small (16px)</option>
            <option value="md">Medium (24px)</option>
            <option value="lg">Large (32px)</option>
            <option value="xl">X-Large (48px)</option>
          </select>
        </div>
      );
    }

    if (key === 'items' || key === 'members') {
      return (
        <div key={key} className="space-y-1">
          <label className="label capitalize">{key} (JSON)</label>
          <textarea className="input min-h-[100px] font-mono text-xs" value={JSON.stringify(value, null, 2)}
            onChange={(e) => { try { update(key, JSON.parse(e.target.value)); } catch { /* ignore */ } }} />
        </div>
      );
    }

    if (key === 'images') {
      const images = (value as GalleryImage[]) || [];
      return (
        <div key={key} className="space-y-2">
          <label className="label">Images</label>
          {images.map((img, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 shrink-0">
                {img.src && <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />}
              </div>
              <input className="input flex-1 text-xs" placeholder="Alt text" value={img.alt}
                onChange={(e) => { const next = [...images]; next[i] = { ...next[i], alt: e.target.value }; update(key, next); }} />
              <button type="button" className="shrink-0 text-red-400 hover:text-red-600 p-1"
                onClick={() => update(key, images.filter((_, idx) => idx !== i))}>
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {companyId && (
            <button type="button" className="btn-secondary w-full btn-sm" onClick={() => setPickerField(key)}>
              <Plus className="w-4 h-4" /> Add Image
            </button>
          )}
        </div>
      );
    }

    if (key === 'slides') {
      const slides = (value as Slide[]) || [];
      return (
        <div key={key} className="space-y-3">
          <label className="label">Slides</label>
          {slides.map((slide, i) => (
            <div key={i} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 shrink-0">
                  {slide.src && <img src={slide.src} alt={slide.alt} className="w-full h-full object-cover" />}
                </div>
                <span className="text-xs text-muted-foreground flex-1 truncate">{slide.title || `Slide ${i + 1}`}</span>
                <button type="button" className="shrink-0 text-red-400 hover:text-red-600 p-1"
                  onClick={() => update(key, slides.filter((_, idx) => idx !== i))}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              {(['title', 'subtitle', 'link'] as const).map((field) => (
                <input key={field} className="input text-xs"
                  placeholder={field === 'link' ? 'Link URL (optional)' : `${field.charAt(0).toUpperCase() + field.slice(1)} (overlay)`}
                  value={slide[field]}
                  onChange={(e) => { const next = [...slides]; next[i] = { ...next[i], [field]: e.target.value }; update(key, next); }} />
              ))}
            </div>
          ))}
          {companyId && (
            <button type="button" className="btn-secondary w-full btn-sm" onClick={() => setPickerField(key)}>
              <Plus className="w-4 h-4" /> Add Slide
            </button>
          )}
        </div>
      );
    }

    if (key === 'level') {
      return (
        <div key={key} className="space-y-1">
          <label className="label">Heading Level</label>
          <select className="input" value={String(value)} onChange={(e) => update(key, e.target.value)}>
            {['h1', 'h2', 'h3', 'h4'].map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
        </div>
      );
    }

    if (key === 'alignment') {
      return (
        <div key={key} className="space-y-1">
          <label className="label">Alignment</label>
          <select className="input" value={String(value)} onChange={(e) => update(key, e.target.value)}>
            {['left', 'center', 'right'].map((a) => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
          </select>
        </div>
      );
    }

    if (key === 'columns') {
      return (
        <div key={key} className="space-y-1">
          <label className="label">Columns</label>
          <input type="number" className="input" min={1} max={6} value={Number(value)} onChange={(e) => update(key, Number(e.target.value))} />
        </div>
      );
    }

    if (key === 'height') {
      return (
        <div key={key} className="space-y-1">
          <label className="label">Height (px)</label>
          <input type="number" className="input" value={Number(value)} onChange={(e) => update(key, Number(e.target.value))} />
        </div>
      );
    }

    if (IMAGE_URL_KEYS.has(key)) {
      return (
        <div key={key} className="space-y-1">
          <label className="label capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
          <div className="flex gap-2">
            <input className="input flex-1 min-w-0" value={String(value ?? '')} onChange={(e) => update(key, e.target.value)} placeholder="Paste URL or browse..." />
            {companyId && (
              <button type="button" className="btn-secondary shrink-0 p-2" onClick={() => setPickerField(key)}>
                <ImageIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          {!!value && (
            <img src={String(value)} alt="" className="w-full h-20 object-cover rounded-md"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          )}
        </div>
      );
    }

    return (
      <div key={key} className="space-y-1">
        <label className="label capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
        <input className="input" value={String(value ?? '')} onChange={(e) => update(key, e.target.value)} />
      </div>
    );
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'content', label: 'Content' },
    { id: 'style', label: 'Style' },
    { id: 'layout', label: 'Layout' },
    { id: 'advanced', label: 'Advanced' },
  ];

  const bgType = String(p.sectionBgType || 'none');

  return (
    <div className="space-y-4">
      <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider capitalize">
        {block.type} Block
      </div>

      {/* Tabs */}
      <div className="flex border-b -mx-4 px-2">
        {tabs.map((tab) => (
          <button key={tab.id} type="button"
            className={cn('px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground')}
            onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT TAB ── */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          {Object.entries(block.props).map(([key, value]) => renderField(key, value))}
        </div>
      )}

      {/* ── STYLE TAB ── */}
      {activeTab === 'style' && (
        <div className="space-y-3">
          <SectionLabel>Typography</SectionLabel>

          <ColorRow label="Heading Color" propKey="headingColor" value={p.headingColor} onChange={update} placeholder="#111827" />
          <ColorRow label="Body Text Color" propKey="textColor" value={p.textColor} onChange={update} placeholder="#374151" />

          <SelectRow label="Heading Size" propKey="headingSize" value={p.headingSize} onChange={update}
            options={[
              { value: '', label: 'Default' },
              { value: 'sm', label: 'Small — 18px' },
              { value: 'base', label: 'Medium — 24px' },
              { value: 'lg', label: 'Large — 30px' },
              { value: 'xl', label: 'X-Large — 36px' },
              { value: '2xl', label: '2X-Large — 48px' },
              { value: '3xl', label: '3X-Large — 60px' },
            ]} />

          <SelectRow label="Font Weight" propKey="fontWeight" value={p.fontWeight} onChange={update}
            options={[
              { value: '', label: 'Default' },
              { value: 'normal', label: 'Normal (400)' },
              { value: 'medium', label: 'Medium (500)' },
              { value: 'semibold', label: 'Semibold (600)' },
              { value: 'bold', label: 'Bold (700)' },
              { value: 'extrabold', label: 'Extra Bold (800)' },
            ]} />

          <SelectRow label="Line Height" propKey="lineHeight" value={p.lineHeight} onChange={update}
            options={[
              { value: '', label: 'Default' },
              { value: 'tight', label: 'Tight (1.25)' },
              { value: 'normal', label: 'Normal (1.5)' },
              { value: 'relaxed', label: 'Relaxed (1.75)' },
              { value: 'loose', label: 'Loose (2.0)' },
            ]} />

          <SelectRow label="Letter Spacing" propKey="letterSpacing" value={p.letterSpacing} onChange={update}
            options={[
              { value: '', label: 'Default' },
              { value: 'tight', label: 'Tight (−0.03em)' },
              { value: 'normal', label: 'Normal (0)' },
              { value: 'wide', label: 'Wide (0.05em)' },
              { value: 'wider', label: 'Wider (0.1em)' },
              { value: 'widest', label: 'Widest (0.2em)' },
            ]} />

          <SelectRow label="Text Transform" propKey="textTransform" value={p.textTransform} onChange={update}
            options={[
              { value: '', label: 'Default' },
              { value: 'none', label: 'None' },
              { value: 'uppercase', label: 'UPPERCASE' },
              { value: 'lowercase', label: 'lowercase' },
              { value: 'capitalize', label: 'Capitalize' },
            ]} />

          <SectionLabel>Colors</SectionLabel>

          <ColorRow label="Accent / Button Color" propKey="accentColor" value={p.accentColor} onChange={update} placeholder="Site accent" />
          <ColorRow label="Card / Container Background" propKey="cardBg" value={p.cardBg} onChange={update} placeholder="none" />
          <ColorRow label="Card Border Color" propKey="cardBorderColor" value={p.cardBorderColor} onChange={update} placeholder="none" />

          {(block.type === 'hero' || block.type === 'slider') && (
            <>
              <SectionLabel>Overlay</SectionLabel>
              <ColorRow label="Overlay Color" propKey="overlayColor" value={p.overlayColor} onChange={update} placeholder="#000000" />
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="label text-xs">Overlay Opacity</label>
                  <span className="text-xs text-muted-foreground tabular-nums">{Number(p.overlayOpacity ?? 0.5).toFixed(2)}</span>
                </div>
                <input type="range" className="w-full" min={0} max={1} step={0.05}
                  value={Number(p.overlayOpacity ?? 0.5)}
                  onChange={(e) => update('overlayOpacity', Number(e.target.value))} />
              </div>
            </>
          )}

          <SectionLabel>Border & Shadow</SectionLabel>

          <SelectRow label="Border Radius" propKey="borderRadius" value={p.borderRadius} onChange={update}
            options={[
              { value: '', label: 'Default' },
              { value: 'none', label: 'None' },
              { value: 'sm', label: 'Small (4px)' },
              { value: 'md', label: 'Medium (8px)' },
              { value: 'lg', label: 'Large (12px)' },
              { value: 'xl', label: 'X-Large (16px)' },
              { value: '2xl', label: '2X-Large (24px)' },
              { value: 'full', label: 'Full (pill)' },
            ]} />

          <SelectRow label="Shadow" propKey="shadow" value={p.shadow} onChange={update}
            options={[
              { value: '', label: 'Default' },
              { value: 'none', label: 'None' },
              { value: 'sm', label: 'Small' },
              { value: 'md', label: 'Medium' },
              { value: 'lg', label: 'Large' },
              { value: 'xl', label: 'X-Large' },
            ]} />
        </div>
      )}

      {/* ── LAYOUT TAB ── */}
      {activeTab === 'layout' && (
        <div className="space-y-3">
          <SectionLabel>Section Background</SectionLabel>

          <SelectRow label="Background Type" propKey="sectionBgType" value={p.sectionBgType} onChange={update}
            options={[
              { value: 'none', label: 'None (transparent)' },
              { value: 'solid', label: 'Solid Color' },
              { value: 'gradient', label: 'Gradient' },
            ]} />

          {bgType === 'solid' && (
            <ColorRow label="Background Color" propKey="sectionBg" value={p.sectionBg} onChange={update} placeholder="#ffffff" />
          )}

          {bgType === 'gradient' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <ColorRow label="From" propKey="sectionGradientFrom" value={p.sectionGradientFrom} onChange={update} placeholder="#667eea" />
                <ColorRow label="To" propKey="sectionGradientTo" value={p.sectionGradientTo} onChange={update} placeholder="#764ba2" />
              </div>
              <SelectRow label="Direction" propKey="sectionGradientDir" value={p.sectionGradientDir} onChange={update}
                options={[
                  { value: 'to bottom', label: 'Top → Bottom' },
                  { value: 'to bottom right', label: 'Top-Left → Bottom-Right' },
                  { value: 'to right', label: 'Left → Right' },
                  { value: 'to top right', label: 'Bottom-Left → Top-Right' },
                  { value: 'to top', label: 'Bottom → Top' },
                  { value: '135deg', label: '135°' },
                  { value: '45deg', label: '45°' },
                ]} />
            </>
          )}

          <SectionLabel>Section Borders</SectionLabel>

          <div className="grid grid-cols-2 gap-2">
            <ColorRow label="Border Top" propKey="sectionBorderTop" value={p.sectionBorderTop} onChange={update} placeholder="none" />
            <ColorRow label="Border Bottom" propKey="sectionBorderBottom" value={p.sectionBorderBottom} onChange={update} placeholder="none" />
          </div>

          <SectionLabel>Section Spacing</SectionLabel>

          <div className="grid grid-cols-2 gap-2">
            <NumRow label="Padding Top (px)" propKey="sectionPaddingTop" value={p.sectionPaddingTop} onChange={update} />
            <NumRow label="Padding Bottom (px)" propKey="sectionPaddingBottom" value={p.sectionPaddingBottom} onChange={update} />
          </div>

          <NumRow label="Min Height (px)" propKey="sectionMinHeight" value={p.sectionMinHeight} onChange={update} />

          <SelectRow label="Section Max Width" propKey="sectionWidth" value={p.sectionWidth} onChange={update}
            options={[
              { value: '', label: 'Default (full)' },
              { value: 'narrow', label: 'Narrow (768px)' },
              { value: 'wide', label: 'Wide (1280px)' },
              { value: 'full', label: 'Full Width' },
            ]} />

          <SectionLabel>Content Area</SectionLabel>

          <SelectRow label="Content Max Width" propKey="contentMaxWidth" value={p.contentMaxWidth} onChange={update}
            options={[
              { value: '', label: 'Default' },
              { value: 'xs', label: 'XS — 512px' },
              { value: 'sm', label: 'SM — 672px' },
              { value: 'md', label: 'MD — 896px' },
              { value: 'lg', label: 'LG — 1152px' },
              { value: 'xl', label: 'XL — 1280px' },
              { value: 'full', label: 'Full Width' },
            ]} />

          <div className="grid grid-cols-2 gap-2">
            <NumRow label="Padding H (px)" propKey="contentPaddingX" value={p.contentPaddingX} onChange={update} />
            <NumRow label="Padding V (px)" propKey="contentPaddingY" value={p.contentPaddingY} onChange={update} />
          </div>

          <SectionLabel>Grid & Items</SectionLabel>

          <NumRow label="Grid Gap (px)" propKey="gridGap" value={p.gridGap} onChange={update} />

          <div className="grid grid-cols-2 gap-2">
            <NumRow label="Item Padding H (px)" propKey="itemPaddingX" value={p.itemPaddingX} onChange={update} />
            <NumRow label="Item Padding V (px)" propKey="itemPaddingY" value={p.itemPaddingY} onChange={update} />
          </div>

          <SectionLabel>Image</SectionLabel>

          <NumRow label="Image Height (px)" propKey="imageHeight" value={p.imageHeight} onChange={update} />

          <SelectRow label="Object Fit" propKey="imageObjectFit" value={p.imageObjectFit} onChange={update}
            options={[
              { value: '', label: 'Default (cover)' },
              { value: 'cover', label: 'Cover' },
              { value: 'contain', label: 'Contain' },
              { value: 'fill', label: 'Fill' },
              { value: 'none', label: 'None' },
            ]} />

          <SelectRow label="Object Position" propKey="imageObjectPosition" value={p.imageObjectPosition} onChange={update}
            options={[
              { value: '', label: 'Default (center)' },
              { value: 'center', label: 'Center' },
              { value: 'top', label: 'Top' },
              { value: 'bottom', label: 'Bottom' },
              { value: 'left', label: 'Left' },
              { value: 'right', label: 'Right' },
              { value: 'top left', label: 'Top Left' },
              { value: 'top right', label: 'Top Right' },
            ]} />

          <SectionLabel>Block</SectionLabel>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="label text-xs">Block Opacity</label>
              <span className="text-xs text-muted-foreground tabular-nums">{Number(p.blockOpacity ?? 1).toFixed(2)}</span>
            </div>
            <input type="range" className="w-full" min={0} max={1} step={0.05}
              value={Number(p.blockOpacity ?? 1)}
              onChange={(e) => update('blockOpacity', Number(e.target.value))} />
          </div>
        </div>
      )}

      {/* ── ADVANCED TAB ── */}
      {activeTab === 'advanced' && (
        <div className="space-y-3">
          <SectionLabel>Font</SectionLabel>

          <SelectRow label="Font Family" propKey="fontFamily" value={p.fontFamily} onChange={update}
            options={[
              { value: '', label: 'Default (site font)' },
              { value: 'sans', label: 'System Sans-serif' },
              { value: 'serif', label: 'System Serif (Georgia)' },
              { value: 'mono', label: 'Monospace' },
              { value: 'inter', label: 'Inter ↗' },
              { value: 'roboto', label: 'Roboto ↗' },
              { value: 'opensans', label: 'Open Sans ↗' },
              { value: 'lato', label: 'Lato ↗' },
              { value: 'montserrat', label: 'Montserrat ↗' },
              { value: 'poppins', label: 'Poppins ↗' },
              { value: 'playfair', label: 'Playfair Display ↗' },
              { value: 'merriweather', label: 'Merriweather ↗' },
            ]} />
          {!!p.fontFamily && GOOGLE_FONTS_SET.has(String(p.fontFamily)) && (
            <p className="text-xs text-amber-600">↗ Google Font — loaded automatically in the builder. Make sure to add the font to your public site.</p>
          )}

          <SectionLabel>Button / CTA Style</SectionLabel>

          <SelectRow label="Button Style" propKey="ctaStyle" value={p.ctaStyle} onChange={update}
            options={[
              { value: '', label: 'Default (filled)' },
              { value: 'filled', label: 'Filled' },
              { value: 'outline', label: 'Outline' },
              { value: 'ghost', label: 'Ghost (text + underline)' },
            ]} />

          <SectionLabel>Animation</SectionLabel>

          <SelectRow label="Entrance Animation" propKey="animateOnScroll" value={p.animateOnScroll} onChange={update}
            options={[
              { value: '', label: 'None' },
              { value: 'fade-in', label: 'Fade In' },
              { value: 'slide-up', label: 'Slide Up' },
              { value: 'slide-down', label: 'Slide Down' },
              { value: 'zoom-in', label: 'Zoom In' },
              { value: 'zoom-out', label: 'Zoom Out' },
            ]} />

          <SectionLabel>Custom CSS</SectionLabel>

          <div className="space-y-1">
            <label className="label text-xs">Custom CSS (injected in a &lt;style&gt; tag)</label>
            <textarea
              className="input min-h-[120px] font-mono text-xs"
              placeholder={`.my-class { color: red; }\n/* Scoped to this block */`}
              value={String(p.customCss || '')}
              onChange={(e) => update('customCss', e.target.value)}
            />
          </div>
        </div>
      )}

      {pickerField && companyId && (
        <MediaPicker
          companyId={companyId}
          onSelect={(url) => {
            if (pickerField === 'images') {
              const current = (block.props.images as GalleryImage[]) || [];
              update('images', [...current, { src: url, alt: '' }]);
            } else if (pickerField === 'slides') {
              const current = (block.props.slides as Slide[]) || [];
              update('slides', [...current, { src: url, alt: '', title: '', subtitle: '', link: '' }]);
            } else {
              update(pickerField, url);
            }
            setPickerField(null);
          }}
          onClose={() => setPickerField(null)}
        />
      )}
    </div>
  );
}

const GOOGLE_FONTS_SET = new Set(['inter', 'roboto', 'opensans', 'lato', 'montserrat', 'poppins', 'playfair', 'merriweather']);
