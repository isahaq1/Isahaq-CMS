import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', async (_req, res: Response) => {
  const langs = await prisma.language.findMany({
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  });
  return res.json({ success: true, data: langs });
});

router.post(
  '/',
  authenticate,
  requireRole('SUPER_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    const { code, name, nativeName, isRTL } = req.body;
    if (!code || !name || !nativeName) {
      return res.status(400).json({ success: false, error: 'code, name, and nativeName are required' });
    }
    const exists = await prisma.language.findUnique({ where: { code: code.toLowerCase() } });
    if (exists) {
      return res.status(409).json({ success: false, error: 'Language code already exists' });
    }
    const lang = await prisma.language.create({
      data: { code: code.toLowerCase(), name, nativeName, isRTL: !!isRTL, isDefault: false, isActive: true },
    });
    return res.status(201).json({ success: true, data: lang });
  }
);

router.put(
  '/:id',
  authenticate,
  requireRole('SUPER_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    const { name, nativeName, isRTL, isActive } = req.body;
    const lang = await prisma.language.findUnique({ where: { id: req.params.id } });
    if (!lang) return res.status(404).json({ success: false, error: 'Language not found' });

    const updated = await prisma.language.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(nativeName !== undefined && { nativeName }),
        ...(isRTL !== undefined && { isRTL: !!isRTL }),
        ...(isActive !== undefined && { isActive: !!isActive }),
      },
    });
    return res.json({ success: true, data: updated });
  }
);

router.put(
  '/:id/default',
  authenticate,
  requireRole('SUPER_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    const lang = await prisma.language.findUnique({ where: { id: req.params.id } });
    if (!lang) return res.status(404).json({ success: false, error: 'Language not found' });

    await prisma.language.updateMany({ data: { isDefault: false } });
    const updated = await prisma.language.update({
      where: { id: req.params.id },
      data: { isDefault: true, isActive: true },
    });
    return res.json({ success: true, data: updated });
  }
);

router.delete(
  '/:id',
  authenticate,
  requireRole('SUPER_ADMIN'),
  async (req: AuthRequest, res: Response) => {
    const lang = await prisma.language.findUnique({ where: { id: req.params.id } });
    if (!lang) return res.status(404).json({ success: false, error: 'Language not found' });
    if (lang.isDefault) {
      return res.status(400).json({ success: false, error: 'Cannot delete the default language' });
    }
    await prisma.language.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Language deleted' });
  }
);

export default router;
