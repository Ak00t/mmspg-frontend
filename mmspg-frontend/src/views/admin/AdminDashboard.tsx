import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  Clock,
  Server,
  Users,
  Store,
  CreditCard,
  Building2,
  Percent,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Activity
} from 'lucide-react';
import { getAdminDashboardSummary, type RecentMerchantRequestDto, type PlatformLiveTransactionDto } from '../../services/adminDashboardApi';

interface DashboardData {
  pendingApprovals: number;
  totalVolume: string;
  activeGateways: number;
  internalStaff: number;
  recentRequests: RecentMerchantRequestDto[];
  recentTransactions: PlatformLiveTransactionDto[];
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const userRole = (localStorage.getItem('userRole') || 'ADMIN').toUpperCase();
  const basePath = userRole === 'SUPPORT' ? '/support' : '/admin';

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const summary = await getAdminDashboardSummary();
      const volume = summary.totalVolumeToday != null ? Number(summary.totalVolumeToday) : 0;
      const formattedVolume = `MMK ${volume.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

      setDashboardData({
        pendingApprovals: Number(summary.totalPendingApprovals) || 0,
        totalVolume: formattedVolume,
        activeGateways: Number(summary.activeGateways) || 0,
        internalStaff: Number(summary.internalStaff) || 0,
        recentRequests: summary.recentMerchantRequests || [],
        recentTransactions: summary.recentTransactions || [],
      });
    } catch (err: any) {
      console.error("Error fetching admin dashboard summary:", err);
      setError(err.response?.data?.message || err.message || t('dashboard.loadError', 'Failed to load real data'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] text-slate-500 dark:text-slate-400 space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium">{t('dashboard.loadingData', 'Loading operations dashboard...')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] text-slate-600 dark:text-slate-300 space-y-4">
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-full">
          <AlertCircle className="h-8 w-8" />
        </div>
        <p className="text-rose-600 dark:text-rose-400 font-medium">{error}</p>
        <button
          onClick={() => fetchDashboardData()}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition shadow-xs cursor-pointer"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('common.retry', 'Retry')}
        </button>
      </div>
    );
  }

  const data = dashboardData || {
    pendingApprovals: 0,
    totalVolume: "MMK 0",
    activeGateways: 0,
    internalStaff: 0,
    recentRequests: [],
    recentTransactions: []
  };

  const statusClass = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'ACTIVE':  return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'APPROVED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'REJECTED': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const txnStatusBadge = (status: string) => {
    switch ((status || '').toUpperCase()) {
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'INITIATED':
      case 'PENDING_AUTHORIZATION':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'FAILED':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-850 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Header & Live Status */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {userRole === 'SUPPORT' ? t('dashboard.supportTitle', 'Support Dashboard') : t('dashboard.adminTitle', 'Admin Operations Dashboard')}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Gateways Operational</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time merchant onboarding pipeline, payment throughput, and platform administration.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-blue-500' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Quick Administrative Actions Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 px-1">
          Quick Management Actions
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <button
            type="button"
            onClick={() => navigate(`${basePath}/merchant-approvals`)}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-left transition group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:scale-105 transition-transform shrink-0">
                <Store className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Merchants</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Review approvals</p>
              </div>
            </div>
            {data.pendingApprovals > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-500 text-white shrink-0 ml-1">
                {data.pendingApprovals}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate(`${basePath}/terminals`)}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-left transition group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:scale-105 transition-transform shrink-0">
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Terminals</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Provision & POS</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => navigate(`${basePath}/fee-configuration`)}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-left transition group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg group-hover:scale-105 transition-transform shrink-0">
                <Percent className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Fee Config</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Rates & MDR</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => navigate(`${basePath}/branches`)}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-purple-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-left transition group cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-lg group-hover:scale-105 transition-transform shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Branches</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Location network</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </button>

          {userRole === 'ADMIN' && (
            <button
              type="button"
              onClick={() => navigate(`${basePath}/staff-users`)}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-rose-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-left transition group cursor-pointer col-span-2 sm:col-span-1"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg group-hover:scale-105 transition-transform shrink-0">
                  <Users className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Staff Users</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Roles & access</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Volume Today */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('dashboard.totalVolume', 'Total Volume (Today)')}
            </span>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {data.totalVolume}
            </h2>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span>Real-time payment throughput</span>
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
        </div>

        {/* Pending Approvals */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('dashboard.pendingApprovals', 'Pending Approvals')}
            </span>
            <div className={`p-2.5 rounded-xl ${
              data.pendingApprovals > 0
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {data.pendingApprovals}
              </h2>
              {data.pendingApprovals > 0 && (
                <button
                  type="button"
                  onClick={() => navigate(`${basePath}/merchant-approvals`)}
                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Review now</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {data.pendingApprovals > 0 ? 'Merchants awaiting KYB verification' : 'All onboarding requests reviewed'}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        </div>

        {/* Active Gateways / Terminals */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('dashboard.activeGateways', 'Online Terminals')}
            </span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Server className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {data.activeGateways}
            </h2>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Ready for payment processing</span>
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        </div>

        {/* Internal Staff */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('dashboard.internalStaff', 'Internal Operators')}
            </span>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {data.internalStaff}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Admin & support staff accounts
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
        </div>
      </div>

      {/* Main Grid: 2/3 Merchant Approvals, 1/3 Operational Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Merchant Onboarding & Request Queue (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Store className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('dashboard.recentRequests', 'Merchant Onboarding Queue')}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Recent merchant registrations and status verifications
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(`${basePath}/merchant-approvals`)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="px-5 py-3 text-left">Merchant</th>
                  <th className="px-5 py-3 text-left">Category</th>
                  <th className="px-5 py-3 text-left">Applied Date</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {data.recentRequests && data.recentRequests.length > 0 ? (
                  data.recentRequests.map((request, index) => (
                    <tr key={index} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-white">{request.merchantName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {request.requestId ? String(request.requestId).substring(0, 8) + '...' : 'N/A'}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                        {request.businessType || 'General Retail'}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {request.date ? new Date(request.date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusClass(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-right font-medium">
                        <button
                          type="button"
                          onClick={() => navigate(`${basePath}/merchant-approvals`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 dark:bg-blue-950/50 dark:hover:bg-blue-600 rounded-lg border border-blue-200 dark:border-blue-800 transition cursor-pointer"
                        >
                          <span>Review</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                      <CheckCircle2 className="h-7 w-7 text-emerald-500 mx-auto mb-2" />
                      <p className="font-medium text-slate-700 dark:text-slate-300">All merchant applications reviewed</p>
                      <p className="text-xs text-slate-400 mt-0.5">New registration requests will appear here in real-time.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Platform Health & Quick Ecosystem Overview (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Terminal & Hardware Provisioning */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-lg">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Terminal Infrastructure</h3>
                  <p className="text-[10px] text-slate-400">POS & Virtual Terminals</p>
                </div>
              </div>
              <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {data.activeGateways} Online
              </span>
            </div>
            <div className="mt-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Active Terminal Fleet</span>
                <span className="font-bold text-slate-900 dark:text-white">{data.activeGateways} Terminals</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '100%' }} />
              </div>
              <button
                type="button"
                onClick={() => navigate(`${basePath}/terminals`)}
                className="w-full mt-2.5 py-2 px-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/60 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Provision New Terminal</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Fee Management & Revenue Rules */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-lg">
                  <Percent className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Fee Configuration</h3>
                  <p className="text-[10px] text-slate-400">MDR Rates & Transaction Charges</p>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Manage percentage, flat, or tiered fee configurations across all merchant accounts and card types.
            </p>
            <button
              type="button"
              onClick={() => navigate(`${basePath}/fee-configuration`)}
              className="w-full mt-3 py-2 px-3 text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-950/60 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Manage Fee Rules</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {/* Compliance & Audit Quick Switch */}
          {userRole === 'ADMIN' && (
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-indigo-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-400/30 text-indigo-200">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold tracking-tight">Security & Audit Compliance</h3>
                  <p className="text-[10px] text-indigo-200">Auditor portal & system events</p>
                </div>
              </div>
              <p className="mt-2.5 text-xs text-indigo-100 leading-relaxed">
                Dedicated compliance monitoring is active for internal security events and audit trails.
              </p>
              <div className="mt-3.5 flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/admin/audit-dashboard')}
                  className="flex-1 py-1.5 px-2.5 text-center text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg transition cursor-pointer border border-white/10"
                >
                  Audit Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/audit-logs')}
                  className="flex-1 py-1.5 px-2.5 text-center text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition cursor-pointer shadow-xs"
                >
                  Audit Logs
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Platform Transactions Feed with Origin Details (Branch & Terminal) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Live Platform Transactions
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Real-time
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Latest transactions across all merchants, branches, and POS/API terminals
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(`${basePath}/reports`)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
          >
            <span>View Full Ledger Reports</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="px-5 py-3 text-left">Time</th>
                <th className="px-5 py-3 text-left">Merchant</th>
                <th className="px-5 py-3 text-left">Branch (Origin)</th>
                <th className="px-5 py-3 text-left">Terminal (Device / API)</th>
                <th className="px-5 py-3 text-left">Order / Reference</th>
                <th className="px-5 py-3 text-right">Amount</th>
                <th className="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {data.recentTransactions && data.recentTransactions.length > 0 ? (
                data.recentTransactions.map((tx) => (
                  <tr key={tx.transactionReference} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                      <div className="text-[10px] text-slate-400">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ''}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white">{tx.merchantName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{tx.merchantCode}</div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{tx.branchName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{tx.branchCode}</div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {tx.terminalCode}
                        <span className="text-[9px] uppercase px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-sans">
                          {tx.terminalType === 'PHYSICAL_POS' ? 'POS' : 'API'}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-mono text-slate-900 dark:text-white">{tx.orderId}</div>
                      <div className="text-[10px] font-mono text-slate-400">{tx.transactionReference}</div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right font-bold text-slate-900 dark:text-white">
                      {tx.currency} {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${txnStatusBadge(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    <p className="font-medium text-slate-700 dark:text-slate-300">No transactions recorded yet</p>
                    <p className="text-xs text-slate-400 mt-0.5">Platform payment activities will stream here live.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
