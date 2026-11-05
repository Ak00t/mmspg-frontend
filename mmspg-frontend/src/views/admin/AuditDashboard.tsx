import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Users,
  RefreshCw,
  ArrowRight,
  Eye,
  X,
  Layers,
  AlertCircle
} from 'lucide-react';
import {
  fetchAuditDashboardSummary,
  type AuditDashboardSummary,
  type AuditLogItem
} from '../../services/auditLogApi';

export default function AuditDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const userRole = (localStorage.getItem('userRole') || 'ADMIN').toUpperCase();
  const basePath = userRole === 'AUDITOR' ? '/auditor' : '/admin';

  const [summary, setSummary] = useState<AuditDashboardSummary | null>(null);
  const [daysFilter, setDaysFilter] = useState<number>(7);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const loadSummary = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await fetchAuditDashboardSummary(daysFilter);
      setSummary(data);
    } catch (err: any) {
      console.error('Failed to load audit dashboard summary:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load audit dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [daysFilter]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const getActionColor = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('CREATE') || act.includes('REGISTER')) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';
    if (act.includes('APPROVE') || act.includes('REACTIVATE')) return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800';
    if (act.includes('UPDATE') || act.includes('STATUS')) return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800';
    if (act.includes('REJECT') || act.includes('SUSPEND') || act.includes('DELETE') || act.includes('FAIL')) return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800';
    return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] text-slate-500 space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium">{t('common.loading', 'Loading audit metrics...')}</p>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] text-slate-600 space-y-4">
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-full">
          <AlertCircle className="h-8 w-8" />
        </div>
        <p className="text-base font-semibold">{error}</p>
        <button
          onClick={() => loadSummary()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
        >
          {t('common.tryAgain', 'Try Again')}
        </button>
      </div>
    );
  }

  const actionEntries = Object.entries(summary?.actionBreakdown || {});
  const menuEntries = Object.entries(summary?.menuBreakdown || {});
  const maxActionCount = Math.max(...actionEntries.map(([, c]) => c), 1);
  const maxMenuCount = Math.max(...menuEntries.map(([, c]) => c), 1);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {userRole === 'AUDITOR' ? t('dashboard.auditorTitle', 'Auditor Dashboard') : 'Audit & Compliance Dashboard'}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                {userRole}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time compliance monitoring, operator activities, and security audit trail.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {/* Days selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            {[
              { label: 'Today', val: 1 },
              { label: '7 Days', val: 7 },
              { label: '30 Days', val: 30 },
              { label: 'All Time', val: 365 },
            ].map((option) => (
              <button
                key={option.val}
                type="button"
                onClick={() => setDaysFilter(option.val)}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  daysFilter === option.val
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => loadSummary(true)}
            disabled={refreshing}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer border border-slate-200 dark:border-slate-700"
            title="Refresh metrics"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => navigate(`${basePath}/audit-logs`)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <span>View Full Audit Trail</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Activities
            </span>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {summary?.totalEvents.toLocaleString() || 0}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Events tracked across all services
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
        </div>

        {/* Success Rate */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Success Rate
            </span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {summary?.successRate || 100}%
            </h2>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              {summary?.successCount.toLocaleString() || 0} compliant executions
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        </div>

        {/* Failed / Alert Events */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Failed & Alerts
            </span>
            <div className={`p-2.5 rounded-xl ${
              (summary?.failedCount || 0) > 0
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {summary?.failedCount || 0}
            </h2>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
              {(summary?.failedCount || 0) > 0 ? 'Requires attention / review' : 'No recent failures detected'}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
        </div>

        {/* Active Operators */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Actors
            </span>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {summary?.activeActorsCount || 0}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Distinct internal staff & operators
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
        </div>
      </div>

      {/* Breakdowns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module / Menu Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Activities by Module / Menu
              </h2>
            </div>
            <span className="text-xs text-slate-400">{menuEntries.length} modules</span>
          </div>

          <div className="space-y-3.5">
            {menuEntries.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No module activities recorded</p>
            ) : (
              menuEntries.map(([menu, count]) => {
                const percent = Math.round((count / maxMenuCount) * 100);
                return (
                  <div key={menu} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">{menu}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono">{count} events</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Action Type Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Activities by Action Type
              </h2>
            </div>
            <span className="text-xs text-slate-400">{actionEntries.length} action types</span>
          </div>

          <div className="space-y-3.5">
            {actionEntries.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No action records available</p>
            ) : (
              actionEntries.map(([action, count]) => {
                const percent = Math.round((count / maxActionCount) * 100);
                return (
                  <div key={action} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium items-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${getActionColor(action)}`}>
                        {action}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-mono">{count} events</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Critical & Security Activity Feed */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-lg">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Security & Critical Activities
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Failed executions, rejections, or high-priority audit events
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(`${basePath}/audit-logs`)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
          >
            <span>Complete Audit Log</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Module</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {(!summary?.recentCriticalEvents || summary.recentCriticalEvents.length === 0) ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1.5" />
                    <span>No critical or failed security activities found. System is compliant.</span>
                  </td>
                </tr>
              ) : (
                summary.recentCriticalEvents.map((log) => (
                  <tr key={log.auditId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900 dark:text-white">
                      <div>{log.actorId || 'SYSTEM'}</div>
                      <div className="text-[10px] text-slate-400">{log.roleName || log.actorType}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium">
                      {log.menuName}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>SUCCESS</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>FAILED</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                      {log.ipAddress || '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition cursor-pointer"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Audit Event Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 font-medium">Audit ID</span>
                  <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">#{selectedLog.auditId}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Timestamp</span>
                  <p className="text-slate-800 dark:text-slate-200 mt-0.5">{formatDateTime(selectedLog.createdAt)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 font-medium">Actor / User</span>
                  <p className="font-semibold text-slate-900 dark:text-white mt-0.5">{selectedLog.actorId || 'SYSTEM'}</p>
                  <p className="text-[11px] text-slate-400">{selectedLog.roleName} ({selectedLog.actorType})</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">IP Address</span>
                  <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">{selectedLog.ipAddress || '-'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 font-medium">Action & Status</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${getActionColor(selectedLog.action)}`}>
                      {selectedLog.action}
                    </span>
                    <span className={`text-[11px] font-bold ${selectedLog.status === 'SUCCESS' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {selectedLog.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Module / Menu</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedLog.menuName}</p>
                </div>
              </div>

              {selectedLog.targetId && (
                <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 font-medium">Target ({selectedLog.targetType || 'Entity'})</span>
                  <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 break-all">{selectedLog.targetId}</p>
                </div>
              )}

              <div>
                <span className="text-slate-400 font-medium">Description / Payload</span>
                <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl font-mono text-[11px] text-slate-700 dark:text-slate-300 break-words max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-700">
                  {selectedLog.description || 'No description recorded'}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
