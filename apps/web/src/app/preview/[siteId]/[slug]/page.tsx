"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BlockRenderer } from "@/components/builder/block-renderer";
import { SiteNavbar } from "@/components/site/site-navbar";
import { SiteFooter } from "@/components/site/site-footer";
import { api } from "@/lib/api";
import { resolveNavItems } from "@/lib/nav-utils";
import type {
  PageBlock,
  NavItem,
  NavStyle,
  Navigation,
} from "@group-cms/shared";

export default function PreviewSlugPage() {
  const params = useParams();
  const siteId = params.siteId as string;
  const slug = params.slug as string;
  const basePath = `/preview/${siteId}`;

  const [page, setPage] = useState<{
    blocks: PageBlock[];
    title: string;
  } | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [headerNav, setHeaderNav] = useState<NavItem[]>([]);
  const [footerNav, setFooterNav] = useState<NavItem[]>([]);
  const [headerSettings, setHeaderSettings] = useState<NavStyle>({});
  const [footerSettings, setFooterSettings] = useState<NavStyle>({});
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#2563eb");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getPublicPage(siteId, slug)
      .then((data) => {
        setPage({ blocks: data.blocks as PageBlock[], title: data.title });
        setCompanyName(data.site?.company?.name || "");
        setCompanyLogo(data.site?.company?.logo || "");
        const theme = data.site?.company?.theme as
          | { primaryColor?: string }
          | undefined;
        if (theme?.primaryColor) setPrimaryColor(theme.primaryColor);

        const navigations = (data.site?.navigations || []) as Navigation[];
        const header = navigations.find((n) => n.position === "header");
        const footer = navigations.find((n) => n.position === "footer");
        if (header) {
          setHeaderNav(resolveNavItems(header.items as NavItem[], basePath));
          setHeaderSettings((header.settings as NavStyle) ?? {});
        }
        if (footer) {
          setFooterNav(resolveNavItems(footer.items as NavItem[], basePath));
          setFooterSettings((footer.settings as NavStyle) ?? {});
        }

      })
      .catch((err) => {
        console.error(err);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [siteId, slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
        <h1 className="text-2xl font-semibold text-gray-700 mb-2">
          Page not found
        </h1>
        <p className="text-gray-500 mb-6">
          The page <code className="bg-gray-100 px-1 rounded">/{slug}</code>{" "}
          does not exist on this site.
        </p>
        <a
          href={basePath}
          className="px-5 py-2.5 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: primaryColor }}
        >
          ← Back to Home
        </a>
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
          <BlockRenderer
            key={block.id}
            block={block}
            isPreview
            primaryColor={primaryColor}
          />
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
