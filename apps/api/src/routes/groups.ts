import { Router, Response } from 'express';
import { z } from 'zod';
import slugify from 'slugify';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { logActivity } from '../lib/helpers';
import { paramId } from '../lib/params';

const router = Router();

const groupSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
});

router.use(authenticate);

router.get('/', async (_req: AuthRequest, res: Response) => {
  const groups = await prisma.companyGroup.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { companies: true } } },
  });
  return res.json({ success: true, data: groups });
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const group = await prisma.companyGroup.findUnique({
    where: { id: paramId(req.params.id) },
    include: { companies: true },
  });
  if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
  return res.json({ success: true, data: group });
});

router.post(
  '/',
  requireRole('SUPER_ADMIN', 'GROUP_ADMIN'),
  validateBody(groupSchema),
  async (req: AuthRequest, res: Response) => {
    const { name, description, logo } = req.body;
    const slug = req.body.slug || slugify(name, { lower: true, strict: true });

    const group = await prisma.companyGroup.create({
      data: { name, slug, description, logo },
    });

    await logActivity(req.user!.userId, 'created', 'group', group.id, group.name);
    return res.status(201).json({ success: true, data: group });
  }
);

router.put(
  '/:id',
  requireRole('SUPER_ADMIN', 'GROUP_ADMIN'),
  validateBody(groupSchema.partial()),
  async (req: AuthRequest, res: Response) => {
    const group = await prisma.companyGroup.update({
      where: { id: paramId(req.params.id) },
      data: req.body,
    });
    await logActivity(req.user!.userId, 'updated', 'group', group.id, group.name);
    return res.json({ success: true, data: group });
  }
);

router.delete(
  '/:id',
  requireRole('SUPER_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    const group = await prisma.companyGroup.findUnique({ where: { id: paramId(req.params.id) } });
    if (!group) return res.status(404).json({ success: false, error: 'Group not found' });

    await prisma.companyGroup.delete({ where: { id: paramId(req.params.id) } });
    await logActivity(req.user!.userId, 'deleted', 'group', group.id, group.name);
    return res.json({ success: true, message: 'Group deleted' });
  }
);

export default router;
