import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/jwt';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { omitPassword } from '../lib/helpers';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

router.post('/login', validateBody(loginSchema), async (req, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  return res.json({ success: true, data: { user: omitPassword(user), token } });
});

router.post('/register', validateBody(registerSchema), async (req, res: Response) => {
  const { email, password, name } = req.body;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ success: false, error: 'Email already registered' });
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hashed, name },
  });

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  return res.status(201).json({ success: true, data: { user: omitPassword(user), token } });
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  return res.json({ success: true, data: omitPassword(user) });
});

export default router;
