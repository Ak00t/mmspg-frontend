import { api } from './api';

export interface AuditLogItem {
  auditId: number;
  actorId: string;
  actorType: string;
  roleName: string;
  permissionUsed?: string;
  menuName: string;
  action: string;
  description?: string;
  targetType?: string;
  targetId?: string;
  ipAddress?: string;
  status: 'SUCCESS' | 'FAILED';
  sourceType: string;
  createdAt: string;
}

export interface AuditLogPageResponse {
  content: AuditLogItem[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface AuditLogFilterParams {
  menuName?: string;
  action?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

export async function fetchAuditLogs(params: AuditLogFilterParams = {}): Promise<AuditLogPageResponse> {
  const queryParams: Record<string, string | number> = {
    page: params.page ?? 0,
    size: params.size ?? 15,
  };

  if (params.menuName && params.menuName.trim()) {
    queryParams.menuName = params.menuName.trim();
  }
  if (params.action && params.action.trim()) {
    queryParams.action = params.action.trim();
  }
  if (params.status && params.status !== 'ALL') {
    queryParams.status = params.status;
  }
  if (params.startDate) {
    queryParams.startDate = params.startDate;
  }
  if (params.endDate) {
    queryParams.endDate = params.endDate;
  }

  const response = await api.get<AuditLogPageResponse>('/api/v1/admin/audit-logs', {
    params: queryParams,
  });
  return response.data;
}

export async function fetchRecentAuditLogs(limit = 10): Promise<AuditLogItem[]> {
  const response = await api.get<AuditLogItem[]>('/api/v1/admin/audit-logs/recent', {
    params: { limit },
  });
  return response.data || [];
}
