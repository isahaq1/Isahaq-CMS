import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { paramId } from '../lib/params';

const router = Router();

router.get('/site/:siteId', async (req, res: Response) => {
  const site = await prisma.site.findUnique({
    where: { id: paramId(req.params.siteId), isPublished: true },
    include: {
      company: true,
      pages: { where: { isPublished: true }, orderBy: { sortOrder: 'asc' } },
      navigations: true,
    },
  });

  if (!site) return res.status(404).json({ success: false, error: 'Site not found' });
  return res.json({ success: true, data: site });
});

router.get('/site/:siteId/page/:slug', async (req, res: Response) => {
  const page = await prisma.page.findFirst({
    where: {
      siteId: paramId(req.params.siteId),
      slug: paramId(req.params.slug),
      isPublished: true,
      site: { isPublished: true },
    },
    include: {
      site: { include: { company: true, navigations: true } },
    },
  });

  if (!page) return res.status(404).json({ success: false, error: 'Page not found' });
  return res.json({ success: true, data: page });
});

router.get('/site/:siteId/home', async (req, res: Response) => {
  const page = await prisma.page.findFirst({
    where: {
      siteId: paramId(req.params.siteId),
      isHomePage: true,
      isPublished: true,
      site: { isPublished: true },
    },
    include: {
      site: { include: { company: true, navigations: true } },
    },
  });

  if (!page) return res.status(404).json({ success: false, error: 'Home page not found' });
  return res.json({ success: true, data: page });
});

export default router;
