import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { omitPassword } from '../lib/helpers';
import { paramId } from '../lib/params';

const router = Router();
router.use(authenticate, requireRole('SUPER_ADMIN'));

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['SUPER_ADMIN', 'GROUP_ADMIN', 'COMPANY_ADMIN', 'EDITOR']).optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['SUPER_ADMIN', 'GROUP_ADMIN', 'COMPANY_ADMIN', 'EDITOR']).optional(),
});

const passwordSchema = z.object({
  password: z.string().min(6),
});

// List all users
router.get('/', async (_req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return res.json({ success: true, data: users.map(omitPassword) });
});

// Create user
router.post('/', validateBody(createSchema), async (req: AuthRequest, res: Response) => {
  const { name, email, password, role } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ success: false, error: 'Email already registered' });
  }
  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: role ?? 'EDITOR' },
  });
  return res.status(201).json({ success: true, data: omitPassword(user) });
});

// Update user name / email / role
router.put('/:id', validateBody(updateSchema), async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.update({
    where: { id: paramId(req.params.id) },
    data: req.body,
  });
  return res.json({ success: true, data: omitPassword(user) });
});

// Change any user's password
router.put('/:id/password', validateBody(passwordSchema), async (req: AuthRequest, res: Response) => {
  const hashed = await bcrypt.hash(req.body.password, 12);
  await prisma.user.update({
    where: { id: paramId(req.params.id) },
    data: { password: hashed },
  });
  return res.json({ success: true, message: 'Password updated' });
});

// Delete user (cannot delete yourself)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  if (req.user?.userId === paramId(req.params.id)) {
    return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
  }
  await prisma.user.delete({ where: { id: paramId(req.params.id) } });
  return res.json({ success: true, message: 'User deleted' });
});

export default router;
