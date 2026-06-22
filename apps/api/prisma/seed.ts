import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_THEME } from '@group-cms/shared';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const password = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@groupcms.com' },
    update: {},
    create: {
      email: 'admin@groupcms.com',
      password,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  });

  const group = await prisma.companyGroup.upsert({
    where: { slug: 'isahaq-cms' },
    update: {},
    create: {
      name: 'IsahaqCMS Group',
      slug: 'isahaq-cms',
      description: 'A diversified group of companies across multiple industries',
    },
  });

  const companies = await Promise.all([
    prisma.company.upsert({
      where: { groupId_slug: { groupId: group.id, slug: 'isahaq-cms-tech' } },
      update: {},
      create: {
        groupId: group.id,
        name: 'IsahaqCMS Tech',
        slug: 'isahaq-cms-tech',
        description: 'Leading technology solutions provider',
        email: 'info@isahaqcms.com',
        phone: '+1 (555) 123-4567',
        address: '123 Innovation Drive, San Francisco, CA',
        theme: DEFAULT_THEME,
      },
    }),
    prisma.company.upsert({
      where: { groupId_slug: { groupId: group.id, slug: 'isahaq-cms-manufacturing' } },
      update: {},
      create: {
        groupId: group.id,
        name: 'IsahaqCMS Manufacturing',
        slug: 'isahaq-cms-manufacturing',
        description: 'Precision manufacturing and industrial solutions',
        email: 'contact@isahaqcms.com',
        phone: '+1 (555) 987-6543',
        theme: { ...DEFAULT_THEME, primaryColor: '#059669', secondaryColor: '#047857' },
      },
    }),
    prisma.company.upsert({
      where: { groupId_slug: { groupId: group.id, slug: 'isahaq-cms-consulting' } },
      update: {},
      create: {
        groupId: group.id,
        name: 'IsahaqCMS Consulting',
        slug: 'isahaq-cms-consulting',
        description: 'Strategic business consulting services',
        email: 'hello@isahaqcms.com',
        theme: { ...DEFAULT_THEME, primaryColor: '#7c3aed', secondaryColor: '#6d28d9' },
      },
    }),
  ]);

  for (const company of companies) {
    const site = await prisma.site.upsert({
      where: { id: `seed-site-${company.slug}` },
      update: {},
      create: {
        id: `seed-site-${company.slug}`,
        companyId: company.id,
        name: `${company.name} Website`,
        domain: `${company.slug}.localhost`,
        isPublished: true,
        settings: {
          metaTitle: company.name,
          metaDescription: company.description,
          footerText: `© ${new Date().getFullYear()} ${company.name}. All rights reserved.`,
        },
      },
    });

    const homePage = await prisma.page.upsert({
      where: { siteId_slug: { siteId: site.id, slug: 'home' } },
      update: {},
      create: {
        siteId: site.id,
        title: 'Home',
        slug: 'home',
        isHomePage: true,
        isPublished: true,
        sortOrder: 0,
        seo: { title: company.name, description: company.description },
        blocks: [
          {
            id: 'hero-1',
            type: 'hero',
            props: {
              title: `Welcome to ${company.name}`,
              subtitle: company.description,
              backgroundImage: '',
              ctaText: 'Learn More',
              ctaLink: '/about',
              alignment: 'center',
              overlay: true,
            },
          },
          {
            id: 'features-1',
            type: 'features',
            props: {
              title: 'What We Offer',
              columns: 3,
              items: [
                { icon: 'Star', title: 'Excellence', description: 'Committed to delivering the highest quality.' },
                { icon: 'Zap', title: 'Innovation', description: 'Pushing boundaries with cutting-edge solutions.' },
                { icon: 'Shield', title: 'Trust', description: 'Building lasting relationships with our clients.' },
              ],
            },
          },
          {
            id: 'cta-1',
            type: 'cta',
            props: {
              title: 'Ready to work with us?',
              description: 'Get in touch today and let us help you achieve your goals.',
              buttonText: 'Contact Us',
              buttonLink: '/contact',
              style: 'primary',
            },
          },
        ],
      },
    });

    await prisma.page.upsert({
      where: { siteId_slug: { siteId: site.id, slug: 'about' } },
      update: {},
      create: {
        siteId: site.id,
        title: 'About Us',
        slug: 'about',
        isPublished: true,
        sortOrder: 1,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            props: { text: `About ${company.name}`, level: 'h1', alignment: 'center' },
          },
          {
            id: 'text-1',
            type: 'text',
            props: {
              content: `<p>${company.name} is part of the ${group.name} family of companies. We are dedicated to providing exceptional services and solutions to our clients worldwide.</p>`,
              alignment: 'left',
            },
          },
        ],
      },
    });

    await prisma.page.upsert({
      where: { siteId_slug: { siteId: site.id, slug: 'contact' } },
      update: {},
      create: {
        siteId: site.id,
        title: 'Contact',
        slug: 'contact',
        isPublished: true,
        sortOrder: 2,
        blocks: [
          {
            id: 'contact-1',
            type: 'contact',
            props: {
              title: 'Get in Touch',
              description: 'We would love to hear from you.',
              showPhone: true,
              showCompany: true,
              submitText: 'Send Message',
            },
          },
        ],
      },
    });

    // Header navigation
    await prisma.navigation.upsert({
      where: { id: `seed-nav-${company.slug}` },
      update: {},
      create: {
        id: `seed-nav-${company.slug}`,
        siteId: site.id,
        name: 'Header Menu',
        position: 'header',
        items: [
          { id: 'nav-home', label: 'Home', url: '/', type: 'link', pageId: homePage.id },
          { id: 'nav-about', label: 'About', url: '/about', type: 'link' },
          { id: 'nav-contact', label: 'Contact', url: '/contact', type: 'button' },
        ],
      },
    });

    // Footer navigation
    await prisma.navigation.upsert({
      where: { id: `seed-nav-footer-${company.slug}` },
      update: {},
      create: {
        id: `seed-nav-footer-${company.slug}`,
        siteId: site.id,
        name: 'Footer Links',
        position: 'footer',
        items: [
          {
            id: 'footer-company', label: 'Company', url: '#', type: 'dropdown',
            children: [
              { id: 'footer-about', label: 'About Us', url: '/about', type: 'link' },
              { id: 'footer-contact', label: 'Contact', url: '/contact', type: 'link' },
            ],
          },
          {
            id: 'footer-legal', label: 'Legal', url: '#', type: 'dropdown',
            children: [
              { id: 'footer-privacy', label: 'Privacy Policy', url: '/privacy', type: 'link' },
              { id: 'footer-terms', label: 'Terms of Service', url: '/terms', type: 'link' },
            ],
          },
        ],
      },
    });
  }

  await prisma.userGroupAccess.upsert({
    where: { userId_groupId: { userId: admin.id, groupId: group.id } },
    update: {},
    create: { userId: admin.id, groupId: group.id },
  });

  await prisma.language.upsert({
    where: { code: 'en' },
    update: {},
    create: { code: 'en', name: 'English', nativeName: 'English', isDefault: true, isActive: true, isRTL: false },
  });

  console.log('Seed completed!');
  console.log('Login: admin@groupcms.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
