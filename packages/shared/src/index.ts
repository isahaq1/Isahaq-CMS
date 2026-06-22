// User & Auth
export type UserRole = 'SUPER_ADMIN' | 'GROUP_ADMIN' | 'COMPANY_ADMIN' | 'EDITOR';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Company Group
export interface CompanyGroup {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Company (subsidiary within a group)
export interface Company {
  id: string;
  groupId: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  theme: CompanyTheme;
  createdAt: string;
  updatedAt: string;
  group?: CompanyGroup;
}

export interface CompanyTheme {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  borderRadius: string;
}

export const DEFAULT_THEME: CompanyTheme = {
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  fontFamily: 'Inter, sans-serif',
  borderRadius: '0.5rem',
};

// Site
export interface Site {
  id: string;
  companyId: string;
  name: string;
  domain?: string | null;
  isPublished: boolean;
  settings: SiteSettings;
  createdAt: string;
  updatedAt: string;
  company?: Company;
}

export interface SiteSettings {
  favicon?: string;
  metaTitle?: string;
  metaDescription?: string;
  socialLinks?: Record<string, string>;
  footerText?: string;
}

// Page Builder Blocks
export type BlockType =
  | 'hero'
  | 'heading'
  | 'text'
  | 'image'
  | 'gallery'
  | 'slider'
  | 'video'
  | 'cta'
  | 'columns'
  | 'features'
  | 'testimonials'
  | 'team'
  | 'contact'
  | 'map'
  | 'divider'
  | 'spacer'
  | 'html'
  | 'faq'
  | 'pricing'
  | 'stats'
  | 'tabs'
  | 'logo-bar'
  | 'countdown'
  | 'logo';

export interface PageBlock {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
  children?: PageBlock[];
}

export interface Page {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  blocks: PageBlock[];
  isHomePage: boolean;
  isPublished: boolean;
  seo: PageSeo;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PageSeo {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
}

// Navigation
export type NavItemType = 'link' | 'dropdown' | 'button' | 'separator';

export interface NavItem {
  id: string;
  label: string;
  url: string;
  type?: NavItemType;
  pageId?: string;
  children?: NavItem[];
  openInNewTab?: boolean;
  icon?: string;
  badge?: string;
  badgeColor?: string;
  cssClass?: string;
  isHidden?: boolean;
}

export type NavPosition = 'header' | 'footer' | 'sidebar';

/** Visual style settings stored per-navigation in the `settings` JSON column */
export interface NavStyle {
  // ── Navbar background ──────────────────────────────────────────────
  bgColor?: string;           // hex/css, default white
  bgOpacity?: number;         // 0-100, for transparent/frosted effect
  bgBlur?: boolean;           // frosted glass blur when transparent
  // ── Border & shadow ────────────────────────────────────────────────
  borderBottom?: boolean;
  borderColor?: string;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  // ── Height ─────────────────────────────────────────────────────────
  height?: 'sm' | 'md' | 'lg';   // h-12 / h-16 / h-20
  // ── Link colors ────────────────────────────────────────────────────
  textColor?: string;         // default link text
  hoverTextColor?: string;    // link hover text
  hoverBgColor?: string;      // link hover bg
  activeTextColor?: string;   // active/current link
  // ── Logo ───────────────────────────────────────────────────────────
  logoTextColor?: string;
  // ── CTA button items ───────────────────────────────────────────────
  ctaBgColor?: string;        // overrides primaryColor for type=button items
  ctaTextColor?: string;
  ctaBorderRadius?: string;   // e.g. '0.5rem', '9999px'
  // ── Dropdown panel ─────────────────────────────────────────────────
  dropdownBg?: string;
  dropdownTextColor?: string;
  dropdownBorderColor?: string;
  // ── Footer colors ──────────────────────────────────────────────────
  footerBg?: string;
  footerTextColor?: string;
  footerHeadingColor?: string;
  footerLinkColor?: string;
  footerBottomBg?: string;
  footerBottomTextColor?: string;
  footerBorderColor?: string;
  // ── Footer layout & structure ──────────────────────────────────────
  footerLayout?: 'columns' | 'centered' | 'minimal';
  footerPaddingY?: 'sm' | 'md' | 'lg';   // py-4 / py-10 / py-16
  footerDivider?: boolean;               // top border line (default true)
  // ── Footer brand section ───────────────────────────────────────────
  footerShowBrand?: boolean;             // show company name+logo (default true)
  footerBrandDescription?: string;       // tagline below company name
  footerLogoSize?: 'sm' | 'md' | 'lg';  // h-6 / h-8 / h-12
  // ── Footer content (rich text replaces items) ──────────────────────
  footerContent?: string;                // HTML from rich text editor
  // ── Footer visibility ─────────────────────────────────────────────
  footerHidden?: boolean;                // hide the entire footer from the site (default false)
  // ── Footer brand visibility ────────────────────────────────────────
  footerShowCompanyName?: boolean;       // show company name text in brand area (default true)
  // ── Footer bottom bar ──────────────────────────────────────────────
  footerShowCopyright?: boolean;         // show copyright bar (default true)
  footerText?: string;                   // custom copyright text (overrides auto-generated line)
  // ── Navbar behavior & visibility ──────────────────────────────────
  navHidden?: boolean;                   // hide the entire header from the site (default false)
  navSticky?: boolean;                   // sticky header (default false)
  navShowLogo?: boolean;                 // show logo/brand area (default true)
  navShowCompanyName?: boolean;          // show company name text alongside logo image (default false)
  navShowMenu?: boolean;                 // show desktop navigation menu items (default true)
  navShowMobileMenu?: boolean;           // show mobile hamburger + mobile menu (default true)
  // ── Footer section visibility ──────────────────────────────────────
  footerShowContent?: boolean;           // show the main content area (rich text / nav items) (default true)
}

export interface Navigation {
  id: string;
  siteId: string;
  name: string;
  position: NavPosition;
  items: NavItem[];
  settings: NavStyle;
  createdAt: string;
  updatedAt: string;
}

// Language
export interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  isActive: boolean;
  isRTL: boolean;
  createdAt: string;
}

// Media
export type MediaType = 'image' | 'video' | 'document' | 'other';

export interface Media {
  id: string;
  companyId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  type: MediaType;
  alt?: string | null;
  createdAt: string;
}

// Block definitions for the builder palette
export interface BlockDefinition {
  type: BlockType;
  label: string;
  icon: string;
  category: 'layout' | 'content' | 'media' | 'interactive';
  defaultProps: Record<string, unknown>;
}

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    type: 'hero',
    label: 'Hero Banner',
    icon: 'Layout',
    category: 'layout',
    defaultProps: {
      title: 'Welcome to Our Company',
      subtitle: 'Building excellence across industries',
      backgroundImage: '',
      ctaText: 'Learn More',
      ctaLink: '#',
      alignment: 'center',
      overlay: true,
    },
  },
  {
    type: 'heading',
    label: 'Heading',
    icon: 'Type',
    category: 'content',
    defaultProps: { text: 'Section Heading', level: 'h2', alignment: 'left' },
  },
  {
    type: 'text',
    label: 'Rich Text',
    icon: 'AlignLeft',
    category: 'content',
    defaultProps: {
      content: '<p>Add your content here. You can format text, add links, and more.</p>',
      alignment: 'left',
    },
  },
  {
    type: 'image',
    label: 'Image',
    icon: 'Image',
    category: 'media',
    defaultProps: { src: '', alt: 'Image', caption: '', width: 'full', rounded: false },
  },
  {
    type: 'gallery',
    label: 'Image Gallery',
    icon: 'Images',
    category: 'media',
    defaultProps: { images: [], columns: 3, gap: 'md' },
  },
  {
    type: 'slider',
    label: 'Image Slider',
    icon: 'Film',
    category: 'media',
    defaultProps: {
      slides: [],
      autoplay: true,
      interval: 4000,
      showDots: true,
      showArrows: true,
    },
  },
  {
    type: 'video',
    label: 'Video',
    icon: 'Video',
    category: 'media',
    defaultProps: { url: '', autoplay: false, controls: true },
  },
  {
    type: 'cta',
    label: 'Call to Action',
    icon: 'MousePointer',
    category: 'interactive',
    defaultProps: {
      title: 'Ready to get started?',
      description: 'Contact us today to learn more about our services.',
      buttonText: 'Contact Us',
      buttonLink: '/contact',
      style: 'primary',
    },
  },
  {
    type: 'columns',
    label: 'Columns',
    icon: 'Columns',
    category: 'layout',
    defaultProps: { columns: 2, gap: 'md', children: [] },
  },
  {
    type: 'features',
    label: 'Features Grid',
    icon: 'Grid',
    category: 'content',
    defaultProps: {
      title: 'Our Services',
      items: [
        { icon: 'Star', title: 'Feature 1', description: 'Description of feature 1' },
        { icon: 'Zap', title: 'Feature 2', description: 'Description of feature 2' },
        { icon: 'Shield', title: 'Feature 3', description: 'Description of feature 3' },
      ],
      columns: 3,
    },
  },
  {
    type: 'testimonials',
    label: 'Testimonials',
    icon: 'Quote',
    category: 'content',
    defaultProps: {
      title: 'What Our Clients Say',
      items: [
        { name: 'John Doe', role: 'CEO', company: 'Acme Corp', text: 'Outstanding service and support.', avatar: '' },
      ],
    },
  },
  {
    type: 'team',
    label: 'Team Members',
    icon: 'Users',
    category: 'content',
    defaultProps: {
      title: 'Meet Our Team',
      members: [
        { name: 'Jane Smith', role: 'Director', image: '', bio: '' },
      ],
      columns: 4,
    },
  },
  {
    type: 'contact',
    label: 'Contact Form',
    icon: 'Mail',
    category: 'interactive',
    defaultProps: {
      title: 'Get in Touch',
      description: 'We would love to hear from you.',
      showPhone: true,
      showCompany: true,
      submitText: 'Send Message',
    },
  },
  {
    type: 'map',
    label: 'Map',
    icon: 'MapPin',
    category: 'interactive',
    defaultProps: { address: '', lat: 0, lng: 0, zoom: 14, height: 400, embedUrl: '' },
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: 'Minus',
    category: 'layout',
    defaultProps: { style: 'solid', color: '#e5e7eb', margin: 'md' },
  },
  {
    type: 'spacer',
    label: 'Spacer',
    icon: 'MoveVertical',
    category: 'layout',
    defaultProps: { height: 48 },
  },
  {
    type: 'html',
    label: 'Custom HTML',
    icon: 'Code',
    category: 'content',
    defaultProps: { html: '<div>Custom HTML content</div>' },
  },
  {
    type: 'faq',
    label: 'FAQ',
    icon: 'HelpCircle',
    category: 'content',
    defaultProps: {
      title: 'Frequently Asked Questions',
      items: [
        { question: 'What is your service?', answer: 'We provide comprehensive solutions tailored to your needs.' },
        { question: 'How do I get started?', answer: 'Simply contact us and we\'ll guide you through the process.' },
        { question: 'What are your pricing plans?', answer: 'We offer flexible plans to fit every budget.' },
      ],
    },
  },
  {
    type: 'pricing',
    label: 'Pricing',
    icon: 'CreditCard',
    category: 'interactive',
    defaultProps: {
      title: 'Simple, Transparent Pricing',
      subtitle: 'Choose the plan that works best for you.',
      plans: [
        { name: 'Starter', price: '9', period: 'mo', description: 'Perfect for individuals', features: ['5 Projects', '10 GB Storage', 'Basic Support'], highlighted: false, ctaText: 'Get Started', ctaLink: '#' },
        { name: 'Pro', price: '29', period: 'mo', description: 'Best for growing teams', features: ['Unlimited Projects', '100 GB Storage', 'Priority Support', 'Analytics'], highlighted: true, ctaText: 'Get Started', ctaLink: '#' },
        { name: 'Enterprise', price: '99', period: 'mo', description: 'For large organizations', features: ['Unlimited Everything', '1 TB Storage', '24/7 Dedicated Support', 'Custom Integrations'], highlighted: false, ctaText: 'Contact Us', ctaLink: '#' },
      ],
    },
  },
  {
    type: 'stats',
    label: 'Stats / Numbers',
    icon: 'BarChart2',
    category: 'content',
    defaultProps: {
      title: '',
      items: [
        { value: '10K+', label: 'Happy Customers', prefix: '', suffix: '' },
        { value: '98', label: 'Satisfaction Rate', prefix: '', suffix: '%' },
        { value: '50', label: 'Countries Served', prefix: '', suffix: '+' },
        { value: '24/7', label: 'Customer Support', prefix: '', suffix: '' },
      ],
    },
  },
  {
    type: 'tabs',
    label: 'Tabs',
    icon: 'LayoutTemplate',
    category: 'layout',
    defaultProps: {
      tabs: [
        { label: 'Overview', content: '<p>Add your overview content here.</p>' },
        { label: 'Features', content: '<p>List your key features here.</p>' },
        { label: 'Details', content: '<p>Provide detailed information here.</p>' },
      ],
    },
  },
  {
    type: 'logo-bar',
    label: 'Logo Bar',
    icon: 'Award',
    category: 'content',
    defaultProps: {
      title: 'Trusted By',
      logos: [],
      grayscale: true,
    },
  },
  {
    type: 'countdown',
    label: 'Countdown Timer',
    icon: 'Timer',
    category: 'interactive',
    defaultProps: {
      title: 'Launch In',
      targetDate: '',
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
    },
  },
  {
    type: 'logo',
    label: 'Smart Logo',
    icon: 'Aperture',
    category: 'content',
    defaultProps: {
      useCompanyLogo: true,
      src: '',
      size: 'md',
      alignment: 'left',
      link: '',
      openInNewTab: false,
      caption: '',
    },
  },
];

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Dashboard stats
export interface DashboardStats {
  totalGroups: number;
  totalCompanies: number;
  totalSites: number;
  totalPages: number;
  totalMedia: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityName: string;
  userId: string;
  userName: string;
  createdAt: string;
}
