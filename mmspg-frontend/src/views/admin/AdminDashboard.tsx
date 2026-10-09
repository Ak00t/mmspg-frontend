import { useState, useEffect } from 'react';
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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("No token found. Please login.");
        setLoading(false);
        return;
      }

      try {
        // 🔴 Backend ကို မပြင်ဘဲ၊ ရှိပြီးသား Merchant API ကိုသာ လှမ်းခေါ်၍ Data အစစ်များကို ယူပါမည်
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

        // 🟢 ရလာသော Merchant အစစ်များပေါ်မူတည်၍ React တွင် တွက်ချက်ပါမည်

        // ၁။ PENDING ဖြစ်နေသော Merchant အရေအတွက်ကို ရှာခြင်း
        const pendingCount = merchants.filter((m: any) => m.status === 'PENDING').length;

        // ၂။ ACTIVE ဖြစ်နေသော Merchant အရေအတွက်ကို ရှာခြင်း
        const activeCount = merchants.filter((m: any) => m.status === 'ACTIVE').length;

        // ၃။ နောက်ဆုံးဝင်ထားသော (အသစ်ဆုံး) Merchant ၅ ခုကို ရှာထုတ်ခြင်း
        const sortedMerchants = [...merchants].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const top5Merchants = sortedMerchants.slice(0, 5);

        // ၄။ Table တွင်ပြရန် Data ပုံစံပြောင်းခြင်း
        const recentRequests = top5Merchants.map((m: any) => ({
          requestId: m.merchantCode || "N/A",
          merchantName: m.merchantName || "Unknown",
          businessType: m.riskLevel || "N/A", 
          dateApplied: m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "N/A",
          status: m.status || "PENDING"
        }));

        // ၅။ တွက်ချက်ထားသော Data များကို State ထဲသို့ ထည့်ခြင်း
        setDashboardData({
          pendingApprovals: pendingCount,
          totalVolume: "MMK 0", // ငွေကြေးပမာဏ API မရှိသေးသဖြင့် ယာယီ 0 ပြထားပါမည်
          activeGateways: activeCount,
          internalStaff: 0, // Staff API သီးသန့်လှမ်းခေါ်မှ ရမည်ဖြစ်၍ ယာယီ 0 ပြထားပါမည်
          recentRequests: recentRequests
        });

      } catch (err) {
        console.error("Error calculating dashboard data:", err);
        setError("Failed to load real data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading real data from database...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
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
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
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
                      <button className="inline-flex items-center px-3 py-1.5 border border-blue-200 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors">
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