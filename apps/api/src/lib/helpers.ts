import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export async function logActivity(
  userId: string | undefined | null,
  action: string,
  entityType: string,
  entityId: string,
  entityName: string,
  metadata?: Record<string, unknown>
) {
  const base = {
    action,
    entityType,
    entityId,
    entityName,
    ...(metadata ? { metadata: metadata as Prisma.InputJsonValue } : {}),
  };
  try {
    await prisma.activityLog.create({
      data: userId ? { ...base, userId } : base,
    });
  } catch (err) {
    // P2003 = FK constraint failed (e.g. stale JWT userId after MySQL db reset).
    // Retry without userId so the log entry still gets recorded.
    if ((err as { code?: string })?.code === 'P2003') {
      try {
        await prisma.activityLog.create({ data: base });
      } catch {
        // Non-fatal
      }
      return;
    }
    // Non-fatal — activity logging should never break the actual operation
  }
}

export function omitPassword<T extends { password?: string }>(user: T) {
  const { password: _, ...rest } = user;
  return rest;
}

export async function getUserAccessibleCompanyIds(user: AuthRequest['user']): Promise<string[] | 'all'> {
  if (!user) return [];
  if (user.role === 'SUPER_ADMIN') return 'all';

  const companyAccess = await prisma.userCompanyAccess.findMany({
    where: { userId: user.userId },
    select: { companyId: true },
  });

  if (user.role === 'GROUP_ADMIN') {
    const groupAccess = await prisma.userGroupAccess.findMany({
      where: { userId: user.userId },
      select: { groupId: true },
    });
    const groupIds = groupAccess.map((g) => g.groupId);
    const groupCompanies = await prisma.company.findMany({
      where: { groupId: { in: groupIds } },
      select: { id: true },
    });
    const ids = new Set([
      ...companyAccess.map((c) => c.companyId),
      ...groupCompanies.map((c) => c.id),
    ]);
    return Array.from(ids);
  }

  return companyAccess.map((c) => c.companyId);
}
