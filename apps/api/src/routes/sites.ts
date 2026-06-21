import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { logActivity } from '../lib/helpers';
import { paramId } from '../lib/params';

const router = Router();

const siteSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(2),
  domain: z.string().optional(),
  isPublished: z.boolean().optional(),
  settings: z.record(z.unknown()).optional(),
});

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const { companyId } = req.query;
  const sites = await prisma.site.findMany({
    where: companyId ? { companyId: String(companyId) } : undefined,
    orderBy: { name: 'asc' },
    include: {
      company: { select: { id: true, name: true, slug: true } },
      _count: { select: { pages: true } },
    },
  });
  return res.json({ success: true, data: sites });
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const site = await prisma.site.findUnique({
    where: { id: paramId(req.params.id) },
    include: {
      company: { include: { group: true } },
      pages: { orderBy: { sortOrder: 'asc' } },
      navigations: true,
    },
  });
  if (!site) return res.status(404).json({ success: false, error: 'Site not found' });
  return res.json({ success: true, data: site });
});

router.post(
  '/',
  requireRole('SUPER_ADMIN', 'GROUP_ADMIN', 'COMPANY_ADMIN'),
  validateBody(siteSchema),
  async (req: AuthRequest, res: Response) => {
    const site = await prisma.site.create({
      data: req.body,
      include: { company: true },
    });

    // Create default header and footer navigations for the new site
    await prisma.navigation.createMany({
      data: [
        { siteId: site.id, name: 'Header Menu', position: 'header', items: [] as object[] },
        { siteId: site.id, name: 'Footer Links', position: 'footer', items: [] as object[] },
      ],
    });

    await logActivity(req.user!.userId, 'created', 'site', site.id, site.name);
    return res.status(201).json({ success: true, data: site });
  }
);

router.put(
  '/:id',
  requireRole('SUPER_ADMIN', 'GROUP_ADMIN', 'COMPANY_ADMIN', 'EDITOR'),
  validateBody(siteSchema.partial().omit({ companyId: true })),
  async (req: AuthRequest, res: Response) => {
    const site = await prisma.site.update({
      where: { id: paramId(req.params.id) },
      data: req.body,
      include: { company: true },
    });
    await logActivity(req.user!.userId, 'updated', 'site', site.id, site.name);
    return res.json({ success: true, data: site });
  }
);

router.delete(
  '/:id',
  requireRole('SUPER_ADMIN', 'GROUP_ADMIN', 'COMPANY_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    const site = await prisma.site.findUnique({ where: { id: paramId(req.params.id) } });
    if (!site) return res.status(404).json({ success: false, error: 'Site not found' });

    await prisma.site.delete({ where: { id: paramId(req.params.id) } });
    await logActivity(req.user!.userId, 'deleted', 'site', site.id, site.name);
    return res.json({ success: true, message: 'Site deleted' });
  }
);

export default router;
