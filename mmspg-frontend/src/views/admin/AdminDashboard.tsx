import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Activity, Monitor, Users, FileText, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { getAdminDashboardSummary } from '../../services/adminDashboardApi';

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
    } catch (err: any) {
      console.error("Error fetching admin dashboard summary:", err);
      setError(err.response?.data?.message || err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium">Loading live metrics from database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-600 space-y-4">
        <div className="p-3 bg-red-50 text-red-500 rounded-full">
          <AlertCircle className="h-8 w-8" />
        </div>
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={() => fetchDashboardData()}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time overview of gateway metrics, approvals, and transaction volume.</p>
        </div>
        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="inline-flex items-center px-3.5 py-2 border border-slate-200 bg-white text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-500 rounded-full">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Pending Approvals</p>
            <p className="text-2xl font-bold text-slate-800">{data.pendingApprovals}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-500 rounded-full">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Volume (Today)</p>
            <p className="text-2xl font-bold text-slate-800">{data.totalVolume}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-500 rounded-full">
            <Monitor className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Gateways</p>
            <p className="text-2xl font-bold text-slate-800">{data.activeGateways}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 text-indigo-500 rounded-full">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Internal Staff</p>
            <p className="text-2xl font-bold text-slate-800">{data.internalStaff}</p>
          </div>
        </div>
      </div>

      {/* Recent Merchant Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-800">Recent Merchant Requests</h2>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Request ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Merchant Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {data.recentRequests.length > 0 ? (
                data.recentRequests.map((request, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{request.requestId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{request.merchantName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{request.businessType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{request.dateApplied}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                        request.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 
                        request.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                        request.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {/* 🔴 onClick ကို ဤနေရာတွင် ချိတ်ဆက်ထားပါသည် */}
                      <button 
                        onClick={() => navigate('/admin/merchant-approvals')}
                        className="inline-flex items-center px-3 py-1.5 border border-blue-200 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4 mr-1.5" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                    No recent requests found in Database.
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