import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { getPaginationMeta, getSkipTake } from '../../utils/pagination';
import { AuditListQuery } from './audit.validation';

export async function listAuditLogs(query: AuditListQuery) {
  const where: Prisma.AuditLogWhereInput = {};
  if (query.entityType) where.entityType = query.entityType;
  if (query.action) where.action = query.action;
  if (query.entityId) where.entityId = query.entityId;
  if (query.actorUserId) where.actorUserId = query.actorUserId;

  const { skip, take } = getSkipTake(query);

  const [total, rows] = await prisma.$transaction([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: { id: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
  ]);

  return {
    items: rows.map((row) => ({
      id: row.id,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      beforeJson: row.beforeJson,
      afterJson: row.afterJson,
      ipAddress: row.ipAddress,
      createdAt: row.createdAt.toISOString(),
      actor: row.actor,
    })),
    meta: getPaginationMeta(total, query.page, query.pageSize),
  };
}
