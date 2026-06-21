import { Router, Response } from 'express';
import { z } from 'zod';
import slugify from 'slugify';
import { DEFAULT_THEME } from '@group-cms/shared';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { logActivity, getUserAccessibleCompanyIds } from '../lib/helpers';
import { paramId } from '../lib/params';

const router = Router();

const companySchema = z.object({
  groupId: z.string().uuid(),
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().optional(),
  logo: z.string().optional(),
  website: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  theme: z.record(z.unknown()).optional(),
});

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  const accessible = await getUserAccessibleCompanyIds(req.user);
  const where = accessible === 'all' ? {} : { id: { in: accessible } };

  const companies = await prisma.company.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      group: { select: { id: true, name: true, slug: true } },
      _count: { select: { sites: true, media: true } },
    },
  });
  return res.json({ success: true, data: companies });
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const company = await prisma.company.findUnique({
    where: { id: paramId(req.params.id) },
    include: {
      group: true,
      sites: true,
    },
  });
  if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
  return res.json({ success: true, data: company });
});

router.post(
  '/',
  requireRole('SUPER_ADMIN', 'GROUP_ADMIN', 'COMPANY_ADMIN'),
  validateBody(companySchema),
  async (req: AuthRequest, res: Response) => {
    const { groupId, name, description, logo, website, email, phone, address, theme } = req.body;
    const slug = req.body.slug || slugify(name, { lower: true, strict: true });

    const company = await prisma.company.create({
      data: {
        groupId,
        name,
        slug,
        description,
        logo,
        website,
        email: email || null,
        phone,
        address,
        theme: theme || DEFAULT_THEME,
      },
      include: { group: true },
    });

    await logActivity(req.user!.userId, 'created', 'company', company.id, company.name);
    return res.status(201).json({ success: true, data: company });
  }
);

router.put(
  '/:id',
  requireRole('SUPER_ADMIN', 'GROUP_ADMIN', 'COMPANY_ADMIN'),
  validateBody(companySchema.partial().omit({ groupId: true })),
  async (req: AuthRequest, res: Response) => {
    const company = await prisma.company.update({
      where: { id: paramId(req.params.id) },
      data: req.body,
      include: { group: true },
    });
    await logActivity(req.user!.userId, 'updated', 'company', company.id, company.name);
    return res.json({ success: true, data: company });
  }
);

router.delete(
  '/:id',
  requireRole('SUPER_ADMIN', 'GROUP_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    const company = await prisma.company.findUnique({ where: { id: paramId(req.params.id) } });
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });

    await prisma.company.delete({ where: { id: paramId(req.params.id) } });
    await logActivity(req.user!.userId, 'deleted', 'company', company.id, company.name);
    return res.json({ success: true, message: 'Company deleted' });
  }
);

export default router;
