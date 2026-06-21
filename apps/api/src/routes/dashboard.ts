import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/stats', async (_req: AuthRequest, res: Response) => {
  const [totalGroups, totalCompanies, totalSites, totalPages, totalMedia, recentActivity] =
    await Promise.all([
      prisma.companyGroup.count(),
      prisma.company.count(),
      prisma.site.count(),
      prisma.page.count(),
      prisma.media.count(),
      prisma.activityLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      }),
    ]);

  return res.json({
    success: true,
    data: {
      totalGroups,
      totalCompanies,
      totalSites,
      totalPages,
      totalMedia,
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        entityName: a.entityName,
        userId: a.userId,
        userName: a.user.name,
        createdAt: a.createdAt.toISOString(),
      })),
    },
  });
});

export default router;
