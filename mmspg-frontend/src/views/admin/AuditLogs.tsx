import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  AlertCircle,
  Filter,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  X
} from 'lucide-react';
import { fetchAuditLogs, type AuditLogItem } from '../../services/auditLogApi';

export default function AuditLogs() {
  const { t } = useTranslation();

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 15;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [menuFilter, setMenuFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected Log for Details Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const loadLogs = useCallback(async (page = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAuditLogs({
        page,
        size: pageSize,
        menuName: menuFilter,
        action: actionFilter,
        status: statusFilter,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      });

      setLogs(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 0);
      setCurrentPage(data.number || 0);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  }, [menuFilter, actionFilter, statusFilter, startDate, endDate]);

  useEffect(() => {
    loadLogs(0);
  }, [loadLogs]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadLogs(0);
  };

  const handleResetFilters = () => {
    setMenuFilter('');
    setActionFilter('');
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
  };

  const getStatusBadge = (status: string) => {
    if (status === 'SUCCESS') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          SUCCESS
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
        <XCircle className="w-3.5 h-3.5" />
        FAILED
      </span>
    );
  };

  const getActionBadge = (action: string) => {
    const act = (action || '').toUpperCase();
    let color = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
    if (act.includes('DELETE') || act.includes('REVOKE') || act.includes('SUSPEND')) {
      color = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800';
    } else if (act.includes('APPROVE') || act.includes('CREATE')) {
      color = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
    } else if (act.includes('UPDATE') || act.includes('REGENERATE')) {
      color = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
    }
    return (
      <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-mono font-medium border ${color}`}>
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Audit Trail</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Immutable event history of administrative operations, security activities, and configuration changes
            </p>
          </div>
        </div>

        <button
          onClick={() => loadLogs(currentPage)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-650 rounded-lg border border-slate-300 dark:border-slate-600 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          {t('common.refresh') || 'Refresh'}
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <form onSubmit={handleApplyFilter} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Module / Menu
              </label>
              <input
                type="text"
                placeholder="e.g. Merchant, Branch"
                value={menuFilter}
                onChange={(e) => setMenuFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Action
              </label>
              <input
                type="text"
                placeholder="e.g. APPROVE, CREATE"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 rounded-lg transition-colors"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" />
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-500">
          <span>Showing {logs.length} of {totalElements} audit entries</span>
          <span>Page {currentPage + 1} of {Math.max(totalPages, 1)}</span>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-sm">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Search className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <p className="text-base font-semibold text-slate-600 dark:text-slate-300">No audit records found</p>
            <p className="text-xs text-slate-400">Try adjusting your filters or date range</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/70 dark:bg-slate-900/50">
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Operator (Actor)</th>
                  <th className="px-5 py-3.5">Module / Menu</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Target</th>
                  <th className="px-5 py-3.5">IP Address</th>
                  <th className="px-5 py-3.5 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-sans">
                {logs.map((log) => (
                  <tr key={log.auditId} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-medium text-slate-900 dark:text-white text-xs">
                        {log.roleName === 'UNKNOWN' ? 'SYSTEM' : (log.roleName || 'SYSTEM')}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 truncate max-w-[140px]">
                        {log.actorId || 'SYSTEM'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200 text-xs">
                      {log.menuName}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                      {log.targetType ? (
                        <span>
                          <span className="text-slate-400 font-mono text-[11px] mr-1">{log.targetType}:</span>
                          <span className="font-mono text-xs">{log.targetId || '-'}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-xs text-slate-500 dark:text-slate-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
            <button
              onClick={() => loadLogs(currentPage - 1)}
              disabled={currentPage === 0 || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <span className="text-xs text-slate-500">
              Page {currentPage + 1} of {totalPages}
            </span>

            <button
              onClick={() => loadLogs(currentPage + 1)}
              disabled={currentPage + 1 >= totalPages || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 disabled:opacity-50 transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Audit Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Audit Entry #{selectedLog.auditId}</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Timestamp</span>
                  <span className="text-slate-900 dark:text-white font-medium">{new Date(selectedLog.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Status</span>
                  {getStatusBadge(selectedLog.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Role</span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    {selectedLog.roleName === 'UNKNOWN' || selectedLog.roleName === 'SYSTEM' || selectedLog.actorType === 'SYSTEM'
                      ? 'SYSTEM'
                      : `${selectedLog.roleName} (${selectedLog.actorType})`}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Actor ID</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 break-all">{selectedLog.actorId || 'SYSTEM'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Module / Menu</span>
                  <span className="text-slate-900 dark:text-white font-medium">{selectedLog.menuName}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Action</span>
                  {getActionBadge(selectedLog.action)}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Target Resource</span>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg font-mono text-slate-800 dark:text-slate-200 break-all">
                  {selectedLog.targetType ? `${selectedLog.targetType} -> ${selectedLog.targetId || 'N/A'}` : 'No target specified'}
                </div>
              </div>

              <div>
                <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Description / Event</span>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-800 dark:text-slate-200 leading-relaxed">
                  {selectedLog.description || 'No additional description recorded.'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">IP Address</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{selectedLog.ipAddress || '127.0.0.1'}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Source Type</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    selectedLog.sourceType === 'FRONTEND_UI'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                  }`}>
                    {selectedLog.sourceType === 'FRONTEND_UI' ? 'Portal UI' : 'REST API'} ({selectedLog.sourceType})
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
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
