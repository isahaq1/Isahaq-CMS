import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import slugify from 'slugify';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { logActivity } from '../lib/helpers';
import { paramId } from '../lib/params';

const router = Router();

const pageSchema = z.object({
  siteId: z.string().min(1),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  blocks: z.array(z.record(z.unknown())).optional(),
  isHomePage: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  seo: z.record(z.unknown()).optional(),
  sortOrder: z.number().optional(),
});

const updateBlocksSchema = z.object({
  blocks: z.array(z.record(z.unknown())),
});

// Wraps async route handlers so unhandled errors reach Express's error middleware
function wrap(fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.get('/', wrap(async (req: AuthRequest, res: Response) => {
  const { siteId } = req.query;
  if (!siteId) {
    return res.status(400).json({ success: false, error: 'siteId query parameter required' });
  }

  const pages = await prisma.page.findMany({
    where: { siteId: String(siteId) },
    orderBy: { sortOrder: 'asc' },
  });
  return res.json({ success: true, data: pages });
}));

router.get('/:id', wrap(async (req: AuthRequest, res: Response) => {
  const page = await prisma.page.findUnique({
    where: { id: paramId(req.params.id) },
    include: { site: { include: { company: true } } },
  });
  if (!page) return res.status(404).json({ success: false, error: 'Page not found' });
  return res.json({ success: true, data: page });
}));

router.post(
  '/',
  requireRole('SUPER_ADMIN', 'GROUP_ADMIN', 'COMPANY_ADMIN', 'EDITOR'),
  validateBody(pageSchema),
  wrap(async (req: AuthRequest, res: Response) => {
    const { siteId, title, blocks, isHomePage, isPublished, seo, sortOrder } = req.body;
    let slug = req.body.slug?.trim()
      ? req.body.slug.trim()
      : slugify(title, { lower: true, strict: true });

    // Ensure slug uniqueness — append a counter if needed
    let attempt = 0;
    let finalSlug = slug;
    while (true) {
      const existing = await prisma.page.findFirst({ where: { siteId, slug: finalSlug } });
      if (!existing) break;
      attempt++;
      finalSlug = `${slug}-${attempt}`;
    }

    if (isHomePage) {
      await prisma.page.updateMany({
        where: { siteId, isHomePage: true },
        data: { isHomePage: false },
      });
    }

    const page = await prisma.page.create({
      data: {
        siteId,
        title,
        slug: finalSlug,
        blocks: blocks || [],
        isHomePage: isHomePage || false,
        isPublished: isPublished || false,
        seo: seo || {},
        sortOrder: sortOrder ?? 0,
      },
    });

    await logActivity(req.user!.userId, 'created', 'page', page.id, page.title);
    return res.status(201).json({ success: true, data: page });
  })
);

router.put(
  '/reorder',
  requireRole('SUPER_ADMIN', 'GROUP_ADMIN', 'COMPANY_ADMIN', 'EDITOR'),
  validateBody(z.object({ pages: z.array(z.object({ id: z.string(), sortOrder: z.number() })) })),
  wrap(async (req: AuthRequest, res: Response) => {
    const updates = req.body.pages.map((p: { id: string; sortOrder: number }) =>
      prisma.page.update({ where: { id: p.id }, data: { sortOrder: p.sortOrder } })
    );
    await prisma.$transaction(updates);
    return res.json({ success: true, message: 'Pages reordered' });
  })
);

router.put(
  '/:id',
  requireRole('SUPER_ADMIN', 'GROUP_ADMIN', 'COMPANY_ADMIN', 'EDITOR'),
  validateBody(pageSchema.partial().omit({ siteId: true })),
  wrap(async (req: AuthRequest, res: Response) => {
    if (req.body.isHomePage) {
      const existing = await prisma.page.findUnique({ where: { id: paramId(req.params.id) } });
      if (existing) {
        await prisma.page.updateMany({
          where: { siteId: existing.siteId, isHomePage: true },
          data: { isHomePage: false },
        });
      }
    }

    const page = await prisma.page.update({
      where: { id: paramId(req.params.id) },
      data: req.body,
    });
    await logActivity(req.user!.userId, 'updated', 'page', page.id, page.title);
    return res.json({ success: true, data: page });
  })
);

router.put(
  '/:id/blocks',
  requireRole('SUPER_ADMIN', 'GROUP_ADMIN', 'COMPANY_ADMIN', 'EDITOR'),
  validateBody(updateBlocksSchema),
  wrap(async (req: AuthRequest, res: Response) => {
    const page = await prisma.page.update({
      where: { id: paramId(req.params.id) },
      data: { blocks: req.body.blocks },
    });
    await logActivity(req.user!.userId, 'updated blocks', 'page', page.id, page.title);
    return res.json({ success: true, data: page });
  })
);

router.delete(
  '/:id',
  requireRole('SUPER_ADMIN', 'GROUP_ADMIN', 'COMPANY_ADMIN'),
  wrap(async (req: AuthRequest, res: Response) => {
    const page = await prisma.page.findUnique({ where: { id: paramId(req.params.id) } });
    if (!page) return res.status(404).json({ success: false, error: 'Page not found' });

    await prisma.page.delete({ where: { id: paramId(req.params.id) } });
    await logActivity(req.user!.userId, 'deleted', 'page', page.id, page.title);
    return res.json({ success: true, message: 'Page deleted' });
  })
);

export default router;
