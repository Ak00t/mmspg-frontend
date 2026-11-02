import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, Activity, Monitor, Users, FileText, CheckCircle } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t('dashboard.loadError'));
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://127.0.0.1:8004/api/v1/admin/merchants', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch merchants');
        }

        const merchants = await response.json();

        const pendingCount = merchants.filter((m: any) => m.status === 'PENDING').length;
        const activeCount = merchants.filter((m: any) => m.status === 'ACTIVE').length;

        const sortedMerchants = [...merchants].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const top5Merchants = sortedMerchants.slice(0, 5);

        const recentRequests = top5Merchants.map((m: any) => ({
          requestId: m.merchantCode || "N/A",
          merchantName: m.merchantName || "Unknown",
          businessType: m.riskLevel || "N/A", 
          dateApplied: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "N/A",
          status: m.status || "PENDING"
        }));

        setDashboardData({
          pendingApprovals: pendingCount,
          totalVolume: "MMK 0", 
          activeGateways: activeCount,
          internalStaff: 0, 
          recentRequests: recentRequests
        });

      } catch (err) {
        console.error("Error calculating dashboard data:", err);
        setError(t('dashboard.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [t]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 dark:text-slate-400">
        {t('dashboard.loadingData')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 dark:text-red-400">{error}</div>
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
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{dashboardTitle}</h1>
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
    </div>
  );
}
