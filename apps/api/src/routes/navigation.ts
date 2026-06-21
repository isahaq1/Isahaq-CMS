import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { logActivity } from '../lib/helpers';
import { paramId } from '../lib/params';

const router = Router();

const POSITIONS = ['header', 'footer', 'sidebar'] as const;

const navSchema = z.object({
  siteId: z.string().min(1),
  name: z.string().min(1),
  position: z.enum(POSITIONS).optional().default('header'),
  items: z.array(z.record(z.unknown())).optional(),
  settings: z.record(z.unknown()).optional(),
});

function wrap(fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

// GET /navigation?siteId=X[&position=header]
router.get('/', wrap(async (req: AuthRequest, res: Response) => {
  const { siteId, position } = req.query;
  if (!siteId) {
    return res.status(400).json({ success: false, error: 'siteId query parameter required' });
  }

  const where: Record<string, unknown> = { siteId: String(siteId) };
  if (position) where.position = String(position);

  const navigations = await prisma.navigation.findMany({ where, orderBy: { position: 'asc' } });
  return res.json({ success: true, data: navigations });
}));

// GET /navigation/:id
router.get('/:id', wrap(async (req: AuthRequest, res: Response) => {
  const nav = await prisma.navigation.findUnique({ where: { id: paramId(req.params.id) } });
  if (!nav) return res.status(404).json({ success: false, error: 'Navigation not found' });
  return res.json({ success: true, data: nav });
}));

// POST /navigation — create a navigation (or upsert by siteId+position)
router.post(
  '/',
  requireRole('SUPER_ADMIN', 'GROUP_ADMIN', 'COMPANY_ADMIN', 'EDITOR'),
  validateBody(navSchema),
  wrap(async (req: AuthRequest, res: Response) => {
    const { siteId, name, position = 'header', items } = req.body as {
      siteId: string; name: string; position: string; items?: unknown[];
    };

    // Upsert: if a navigation for this site+position already exists, return it
    const existing = await prisma.navigation.findFirst({
      where: { siteId, position },
    });

    if (existing) {
      return res.json({ success: true, data: existing });
    }

    const nav = await prisma.navigation.create({
      data: { siteId, name, position, items: (items ?? []) as object[] },
    });
    await logActivity(req.user!.userId, 'created', 'navigation', nav.id, nav.name);
    return res.status(201).json({ success: true, data: nav });
  })
);

// PUT /navigation/:id
router.put(
  '/:id',
  requireRole('SUPER_ADMIN', 'GROUP_ADMIN', 'COMPANY_ADMIN', 'EDITOR'),
  validateBody(navSchema.partial().omit({ siteId: true })),
  wrap(async (req: AuthRequest, res: Response) => {
    const nav = await prisma.navigation.update({
      where: { id: paramId(req.params.id) },
      data: req.body,
    });
    await logActivity(req.user!.userId, 'updated', 'navigation', nav.id, nav.name);
    return res.json({ success: true, data: nav });
  })
);

// DELETE /navigation/:id
router.delete(
  '/:id',
  requireRole('SUPER_ADMIN', 'GROUP_ADMIN', 'COMPANY_ADMIN'),
  wrap(async (req: AuthRequest, res: Response) => {
    const nav = await prisma.navigation.findUnique({ where: { id: paramId(req.params.id) } });
    if (!nav) return res.status(404).json({ success: false, error: 'Navigation not found' });
    await prisma.navigation.delete({ where: { id: paramId(req.params.id) } });
    await logActivity(req.user!.userId, 'deleted', 'navigation', nav.id, nav.name);
    return res.json({ success: true, message: 'Navigation deleted' });
  })
);

export default router;
