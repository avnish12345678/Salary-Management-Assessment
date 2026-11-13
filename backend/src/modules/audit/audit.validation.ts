import { z } from 'zod';

export const auditListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  entityType: z.string().trim().max(64).optional(),
  action: z.string().trim().max(64).optional(),
  entityId: z.string().uuid().optional(),
  actorUserId: z.string().uuid().optional(),
});

export type AuditListQuery = z.infer<typeof auditListQuerySchema>;
