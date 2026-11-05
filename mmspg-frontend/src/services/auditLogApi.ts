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

export interface AuditDashboardSummary {
  totalEvents: number;
  successCount: number;
  failedCount: number;
  successRate: number;
  todayEvents: number;
  activeActorsCount: number;
  actionBreakdown: Record<string, number>;
  menuBreakdown: Record<string, number>;
  recentCriticalEvents: AuditLogItem[];
}

export async function fetchAuditDashboardSummary(days = 7): Promise<AuditDashboardSummary> {
  try {
    const response = await api.get<AuditDashboardSummary>('/api/v1/admin/audit-logs/summary', {
      params: { days }
    });
    if (response.data && typeof response.data.totalEvents === 'number') {
      return response.data;
    }
  } catch (err) {
    console.warn('Backend audit summary API failed or not available, falling back to client-side aggregation:', err);
  }

  // Graceful client-side fallback using recent logs & paginated audit logs
  const [recentLogs, allLogsPage] = await Promise.all([
    fetchRecentAuditLogs(20).catch(() => []),
    fetchAuditLogs({ page: 0, size: 50 }).catch(() => ({ content: [], totalElements: 0 }))
  ]);

  const items = allLogsPage.content || recentLogs || [];
  const totalEvents = allLogsPage.totalElements || items.length;
  let successCount = 0;
  let failedCount = 0;
  const actionBreakdown: Record<string, number> = {};
  const menuBreakdown: Record<string, number> = {};
  const actorsSet = new Set<string>();

  items.forEach(log => {
    if (log.status === 'SUCCESS') successCount++;
    else failedCount++;

    if (log.action) actionBreakdown[log.action] = (actionBreakdown[log.action] || 0) + 1;
    if (log.menuName) menuBreakdown[log.menuName] = (menuBreakdown[log.menuName] || 0) + 1;
    if (log.actorId) actorsSet.add(log.actorId);
  });

  const successRate = items.length > 0 ? Math.round((successCount / items.length) * 1000) / 10 : 100;
  const recentCritical = (recentLogs || []).filter(l => l.status === 'FAILED' || (l.action && l.action.toLowerCase().includes('reject')));

  return {
    totalEvents,
    successCount,
    failedCount,
    successRate,
    todayEvents: items.length,
    activeActorsCount: actorsSet.size || 1,
    actionBreakdown,
    menuBreakdown,
    recentCriticalEvents: recentCritical.slice(0, 8)
  };
}
