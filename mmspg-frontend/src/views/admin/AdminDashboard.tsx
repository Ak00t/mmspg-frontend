import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, Activity, Monitor, Users, FileText, CheckCircle, RefreshCw, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { getAdminDashboardSummary } from '../../services/adminDashboardApi';
import { fetchRecentAuditLogs, type AuditLogItem } from '../../services/auditLogApi';

interface RecentRequest {
  requestId: string;
  merchantName: string;
  businessType: string;
  dateApplied: string;
  status: string;
}

interface DashboardData {
  pendingApprovals: number;
  totalVolume: string;
  activeGateways: number;
  internalStaff: number;
  recentRequests: RecentRequest[];
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const userRole = (localStorage.getItem('userRole') || 'ADMIN').toUpperCase();
  const basePath = userRole === 'SUPPORT' ? '/support' : userRole === 'AUDITOR' ? '/auditor' : '/admin';
  const dashboardTitle = userRole === 'SUPPORT' 
    ? t('dashboard.supportTitle') 
    : userRole === 'AUDITOR' 
    ? t('dashboard.auditorTitle') 
    : t('dashboard.adminTitle');

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recentAuditLogs, setRecentAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const summaryPromise = getAdminDashboardSummary();
      const auditLogsPromise = (userRole === 'ADMIN' || userRole === 'AUDITOR')
        ? fetchRecentAuditLogs(5).catch((err) => {
            console.warn("Could not load recent audit logs:", err);
            return [];
          })
        : Promise.resolve([]);

      const [summary, auditLogs] = await Promise.all([summaryPromise, auditLogsPromise]);
      const volume = summary.totalVolumeToday != null ? Number(summary.totalVolumeToday) : 0;
      const formattedVolume = `MMK ${volume.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

      const recentRequests = (summary.recentMerchantRequests || []).map((req) => ({
        requestId: req.requestId ? String(req.requestId).substring(0, 8) + '...' : 'N/A',
        merchantName: req.merchantName || 'Unknown',
        businessType: req.businessType || 'N/A',
        dateApplied: req.date ? new Date(req.date).toLocaleDateString() : 'N/A',
        status: req.status || 'PENDING'
      }));

      setDashboardData({
        pendingApprovals: Number(summary.totalPendingApprovals) || 0,
        totalVolume: formattedVolume,
        activeGateways: Number(summary.activeGateways) || 0,
        internalStaff: Number(summary.internalStaff) || 0,
        recentRequests: recentRequests
      });
      setRecentAuditLogs(auditLogs);
    } catch (err: any) {
      console.error("Error fetching admin dashboard summary:", err);
      setError(err.response?.data?.message || err.message || t('dashboard.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t, userRole]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 dark:text-slate-400 space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium">{t('dashboard.loadingData')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-600 dark:text-slate-300 space-y-4">
        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full">
          <AlertCircle className="h-8 w-8" />
        </div>
        <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
        <button
          onClick={() => fetchDashboardData()}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('common.retry') || 'Retry'}
        </button>
      </div>
    );
  }

  const data = dashboardData || {
    pendingApprovals: 0,
    totalVolume: "MMK 0",
    activeGateways: 0,
    internalStaff: 0,
    recentRequests: []
  };

  const statusClass = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'ACTIVE':  return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return t('merchants.pending');
      case 'ACTIVE': return t('merchants.active');
      case 'APPROVED': return t('merchants.approved');
      case 'REJECTED': return t('merchants.rejected');
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{dashboardTitle}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Real-time overview of gateway metrics, approvals, and transaction volume.</p>
        </div>
        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="inline-flex items-center px-3.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 text-slate-500 dark:text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>


      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-full">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.pendingApprovals')}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{data.pendingApprovals}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-500 rounded-full">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.totalVolume')}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{data.totalVolume}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-full">
            <Monitor className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.activeGateways')}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{data.activeGateways}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('dashboard.internalStaff')}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{data.internalStaff}</p>
          </div>
        </div>
      </div>

      {/* Recent Merchant Requests Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">{t('dashboard.recentRequests')}</h2>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-white dark:bg-slate-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('dashboard.requestId')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('dashboard.merchantName')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('dashboard.businessType')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('common.date')}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('common.status')}</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
              {data.recentRequests.length > 0 ? (
                data.recentRequests.map((request, index) => (
                  <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">{request.requestId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{request.merchantName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{request.businessType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{request.dateApplied}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${statusClass(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => navigate(`${basePath}/merchant-approvals`)}
                        className="inline-flex items-center px-3 py-1.5 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4 mr-1.5" />
                        {t('common.review')}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                    {t('dashboard.noRecentRequests')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Security & Audit Events (ADMIN & AUDITOR) */}
      {(userRole === 'ADMIN' || userRole === 'AUDITOR') && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Recent System Audit Events</h2>
            </div>
            <button
              onClick={() => navigate(`${basePath}/audit-logs`)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center gap-1 transition-colors"
            >
              View Full Audit Trail
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-white dark:bg-slate-800">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Module</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actor</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                {recentAuditLogs.length > 0 ? (
                  recentAuditLogs.map((log) => (
                    <tr key={log.auditId} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-sm">
                      <td className="px-6 py-3.5 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                        {log.menuName}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        <span className="font-medium">{log.actorId || 'SYSTEM'}</span>
                        <span className="ml-1 text-xs text-slate-400">
                          ({log.roleName === 'UNKNOWN' ? 'SYSTEM' : (log.roleName || 'SYSTEM')})
                        </span>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate" title={log.description}>
                        {log.description || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                      No recent audit logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
