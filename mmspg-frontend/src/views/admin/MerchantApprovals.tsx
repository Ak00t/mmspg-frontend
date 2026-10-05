import { useState, useEffect } from 'react';
import { Search, Plus, Store, CheckCircle2, XCircle, Eye, Edit } from 'lucide-react';

// Backend မှ MerchantResponseDto ၏ Variable အမည်များနှင့် တူညီရမည့် Interface
interface Merchant {
  merchantId: string;
  merchantCode: string;
  merchantName: string;
  email: string;
  createdAt: string; // သို့မဟုတ် dateApplied
  riskLevel: string; // LOW, MEDIUM, HIGH
  status: string; // PENDING, APPROVED, SUSPENDED, REJECTED
}

export default function MerchantApprovals() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token'); 
    
    if (!token) {
        console.error("No token found. Please login.");
        setLoading(false);
        return; 
    }

    // Backend API လမ်းကြောင်း - Controller တွင် /api/v1/admin/merchants ရှိရပါမည်
    fetch('http://127.0.0.1:8004/api/v1/admin/merchants', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      }
    })
      .then((response) => {
        if (response.status === 401 || response.status === 403) { 
           console.error("Unauthorized! Please login again.");
           throw new Error('Unauthorized');
        }
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then((data) => {
        setMerchants(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching merchants:', error);
        setLoading(false);
      });
  }, []); 

  // Search Filter
  const filteredMerchants = merchants.filter(merchant => 
    (merchant.merchantName && merchant.merchantName.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (merchant.merchantCode && merchant.merchantCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (merchant.email && merchant.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Date format ပြောင်းရန် အကူ function (ဥပမာ - 2026-10-03)
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return dateString.split('T')[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Merchant Approvals</h1>
          <p className="text-sm text-slate-500 mt-1">Review and manage merchant applications</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Merchant
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-colors"
            placeholder="Search merchants by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading merchants...</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Details</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Applied</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Level</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredMerchants.map((merchant, index) => (
                  <tr key={merchant.merchantId || index} className="hover:bg-slate-50 transition-colors">
                    
                    {/* Business Details */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                          <Store className="h-5 w-5" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-slate-900">{merchant.merchantName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            ID: {merchant.merchantCode} &bull; {merchant.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Date Applied */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-500">{formatDate(merchant.createdAt)}</div>
                    </td>

                    {/* Risk Level */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm">
                        <span className={`h-2 w-2 rounded-full mr-2 ${
                          merchant.riskLevel === 'LOW' ? 'bg-green-500' :
                          merchant.riskLevel === 'MEDIUM' ? 'bg-amber-500' :
                          'bg-red-500'
                        }`}></span>
                        <span className="text-slate-700">{merchant.riskLevel}</span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        merchant.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                        merchant.status === 'PENDING' ? 'bg-blue-100 text-blue-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {merchant.status}
                      </span>
                    </td>

                    {/* Actions - Status ပေါ်မူတည်၍ ပုံထဲကအတိုင်း ပြောင်းလဲပြသခြင်း */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {merchant.status === 'PENDING' && (
                          <>
                            <button className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Approve">
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Reject">
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {merchant.status === 'APPROVED' && (
                          <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Suspend">
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        {merchant.status === 'SUSPENDED' && (
                          <>
                            <button className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Reactivate">
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                              <Edit className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg" title="View Details">
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredMerchants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">
                      No merchants found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}