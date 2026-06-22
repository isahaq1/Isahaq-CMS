'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BlockRenderer } from '@/components/builder/block-renderer';
import { SiteNavbar } from '@/components/site/site-navbar';
import { SiteFooter } from '@/components/site/site-footer';
import { api } from '@/lib/api';
import { resolveNavItems } from '@/lib/nav-utils';
import type { PageBlock, NavItem, NavStyle, Navigation } from '@group-cms/shared';

export default function PreviewPage() {
  const params = useParams();
  const siteId = params.siteId as string;

  const [page, setPage] = useState<{ blocks: PageBlock[]; title: string } | null>(null);
  const [headerNav, setHeaderNav] = useState<NavItem[]>([]);
  const [footerNav, setFooterNav] = useState<NavItem[]>([]);
  const [headerSettings, setHeaderSettings] = useState<NavStyle>({});
  const [footerSettings, setFooterSettings] = useState<NavStyle>({});
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [loading, setLoading] = useState(true);
  const [basePath, setBasePath] = useState(`/preview/${siteId}`);

  useEffect(() => {
    // When served via custom domain the middleware sets _cms_domain cookie
    const match = document.cookie.match(/(?:^|;\s*)_cms_domain=([^;]+)/);
    const bp = match && match[1] === siteId ? '' : `/preview/${siteId}`;
    setBasePath(bp);

    api.getPublicHomePage(siteId)
      .then((data) => {
        setPage({ blocks: data.blocks as PageBlock[], title: data.title });
        setCompanyName(data.site?.company?.name || '');
        setCompanyLogo(data.site?.company?.logo || '');
        const theme = data.site?.company?.theme as { primaryColor?: string } | undefined;
        if (theme?.primaryColor) setPrimaryColor(theme.primaryColor);

        const navigations = (data.site?.navigations || []) as Navigation[];
        const header = navigations.find((n) => n.position === 'header');
        const footer = navigations.find((n) => n.position === 'footer');
        if (header) {
          setHeaderNav(resolveNavItems(header.items as NavItem[], bp));
          setHeaderSettings((header.settings as NavStyle) ?? {});
        }
        if (footer) {
          setFooterNav(resolveNavItems(footer.items as NavItem[], bp));
          setFooterSettings((footer.settings as NavStyle) ?? {});
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [siteId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Site not found or not published
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SiteNavbar
        items={headerNav}
        logo={companyLogo}
        companyName={companyName}
        primaryColor={primaryColor}
        logoHref={basePath}
        sticky
        settings={headerSettings}
      />
      <main className="flex-1">
        {page.blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} isPreview primaryColor={primaryColor} companyLogo={companyLogo} />
        ))}
      </main>
      <SiteFooter
        items={footerNav}
        primaryColor={primaryColor}
        settings={footerSettings}
      />
    </div>
  );
}
