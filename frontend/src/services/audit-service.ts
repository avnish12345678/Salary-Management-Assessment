import { apiClient } from './api-client';
import type { ApiResponse } from '../types/api';

export type AuditLogItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeJson: unknown;
  afterJson: unknown;
  ipAddress: string | null;
  createdAt: string;
  actor: { id: string; email: string; role: string } | null;
};

export async function fetchAuditLogs(params: {
  page?: number;
  pageSize?: number;
  entityType?: string;
  action?: string;
}) {
  const { data } = await apiClient.get<ApiResponse<AuditLogItem[]>>('/audit', { params });
  return { items: data.data, meta: data.meta! };
}
