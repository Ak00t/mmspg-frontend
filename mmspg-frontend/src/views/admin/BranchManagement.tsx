import { useState, useEffect } from 'react';
import { Search, Plus, Building2, Edit, Power, X } from 'lucide-react'; 

interface Branch {
  branchId: string;
  branchCode: string;
  branchName: string;
  merchantName: string;
  city: string;
  phone: string;
  status: string;
}

export default function BranchManagement() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Modal အတွက် State များ
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  // 🔴 Add Modal အတွက် State အသစ်များ
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [merchants, setMerchants] = useState<any[]>([]); // Merchant list သိမ်းရန်
  const [newBranch, setNewBranch] = useState({
    merchantId: '',
    branchCode: '',
    branchName: '',
    address: '',
    city: '',
    phone: ''
  });

  useEffect(() => {
    fetchBranches();
    fetchMerchants(); // 🔴 Component တက်လာလျှင် Merchant များကိုပါ ကြိုတင်လှမ်းခေါ်မည်
  }, []);

  const fetchBranches = async () => {
    const token = localStorage.getItem('token'); 
    if (!token) {
        console.error("No token found. Please login.");
        setLoading(false);
        return; 
    }

    try {
      const response = await fetch('http://127.0.0.1:8004/api/v1/admin/branches', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });

      if (response.status === 401 || response.status === 403) {
         console.error("Unauthorized! Please login again.");
         throw new Error('Unauthorized');
      }
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      setBranches(data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔴 Merchant စာရင်းများကို Dropdown တွင်ပြရန် လှမ်းခေါ်မည့် Function
  const fetchMerchants = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch('http://127.0.0.1:8004/api/v1/admin/merchants', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMerchants(data);
      }
    } catch (error) {
      console.error('Error fetching merchants:', error);
    }
  };

  // 🔴 Branch အသစ်ကို Backend သို့ လှမ်းပို့မည့် Function
  const handleAddSubmit = async () => {
    if (!newBranch.merchantId || !newBranch.branchCode || !newBranch.branchName) {
      alert("Merchant, Branch Code, and Branch Name are required.");
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://127.0.0.1:8004/api/v1/admin/branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newBranch)
      });

      if (response.ok) {
        setIsAddModalOpen(false);
        // Form ကို ပြန်လွတ်အောင် ရှင်းမည်
        setNewBranch({ merchantId: '', branchCode: '', branchName: '', address: '', city: '', phone: '' });
        // Branch အသစ်ပါဝင်လာစေရန် ဇယားကို ပြန်ခေါ်မည်
        fetchBranches(); 
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Failed to add branch: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding branch:', error);
    }
  };

  const handleToggleStatus = async (branchId: string, currentStatus: string) => {
    const action = currentStatus === 'ACTIVE' ? 'disable' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this branch?`)) return;

    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://127.0.0.1:8004/api/v1/admin/branches/${branchId}/status`, { // URL အဟောင်းတွင် ?status= ဖြုတ်ထားပြီးဖြစ်သည်
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setBranches(branches.map(b => b.branchId === branchId ? { ...b, status: newStatus } : b));
      } else {
        alert('Failed to update branch status.');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch({ ...branch }); 
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingBranch) return;
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://127.0.0.1:8004/api/v1/admin/branches/${editingBranch.branchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          branchName: editingBranch.branchName,
          city: editingBranch.city,
          phone: editingBranch.phone
        })
      });

      if (response.ok) {
        setBranches(branches.map(b => b.branchId === editingBranch.branchId ? editingBranch : b));
        setIsEditModalOpen(false);
        setEditingBranch(null);
      } else {
        alert('Failed to update branch details.');
      }
    } catch (error) {
      console.error('Error updating branch:', error);
    }
  };

  const filteredBranches = branches.filter(branch => 
    (branch.branchCode && branch.branchCode.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (branch.branchName && branch.branchName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (branch.merchantName && branch.merchantName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Branch Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage merchant branches and locations here.</p>
        </div>
        {/* 🔴 Add Branch ခလုတ်တွင် Modal ပွင့်ရန် ချိတ်ဆက်ထားပါသည် */}
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Branch
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
            placeholder="Search by branch or merchant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading branches...</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Branch Info</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Merchant</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact / City</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredBranches.map((branch, index) => (
                  <tr key={branch.branchId || index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-slate-900">{branch.branchCode}</div>
                          <div className="text-sm text-slate-500">{branch.branchName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{branch.merchantName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">{branch.city || '-'}</div>
                      <div className="text-sm text-slate-500">{branch.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        branch.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {branch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => openEditModal(branch)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(branch.branchId, branch.status)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title={branch.status === 'ACTIVE' ? 'Disable' : 'Enable'}>
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBranches.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">
                      No branches found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 🔴 ၅။ Add New Branch Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Add New Branch</h2>
              <button onClick={() => {
                setIsAddModalOpen(false);
                setNewBranch({ merchantId: '', branchCode: '', branchName: '', address: '', city: '', phone: '' });
              }} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Parent Merchant Dropdown */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parent Merchant</label>
                <select 
                  value={newBranch.merchantId}
                  onChange={(e) => setNewBranch({...newBranch, merchantId: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a Merchant...</option>
                  {merchants && merchants.length > 0 ? (
                    merchants.map((merchant, index) => (
                      <option 
                        // Backend က ID ကို id ဟုပေးသည်ဖြစ်စေ merchantId ဟုပေးသည်ဖြစ်စေ အလုပ်လုပ်စေရန်
                        key={merchant.merchantId || merchant.id || index} 
                        value={merchant.merchantId || merchant.id}
                      >
                        {/* Backend က အမည်ကို businessName (သို့) merchantName (သို့) name မည်သို့ပေးသည်ဖြစ်စေ အလုပ်လုပ်စေရန် */}
                        {merchant.businessName || merchant.merchantName || merchant.name || `Merchant ${index + 1}`}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No merchants available</option>
                  )}
                </select>
              </div>

              {/* Branch Code */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Branch Code</label>
                <input 
                  type="text" 
                  value={newBranch.branchCode} 
                  onChange={(e) => setNewBranch({...newBranch, branchCode: e.target.value})}
                  placeholder="e.g. B-001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Branch Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Branch Name</label>
                <input 
                  type="text" 
                  value={newBranch.branchName} 
                  onChange={(e) => setNewBranch({...newBranch, branchName: e.target.value})}
                  placeholder="e.g. Downtown Outlet"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input 
                  type="text" 
                  value={newBranch.address} 
                  onChange={(e) => setNewBranch({...newBranch, address: e.target.value})}
                  placeholder="Street address"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input 
                    type="text" 
                    value={newBranch.city} 
                    onChange={(e) => setNewBranch({...newBranch, city: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                {/* Contact Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                  <input 
                    type="text" 
                    value={newBranch.phone} 
                    onChange={(e) => setNewBranch({...newBranch, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setNewBranch({ merchantId: '', branchCode: '', branchName: '', address: '', city: '', phone: '' });
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Branch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Branch Modal (ယခင်အတိုင်း) */}
      {isEditModalOpen && editingBranch && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Edit Branch</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Merchant Name (Read-only ပြထားသည်) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parent Merchant</label>
                <input 
                  type="text" 
                  disabled
                  value={editingBranch.merchantName} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Branch Name</label>
                <input 
                  type="text" 
                  value={editingBranch.branchName} 
                  onChange={(e) => setEditingBranch({...editingBranch, branchName: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input 
                    type="text" 
                    value={editingBranch.city} 
                    onChange={(e) => setEditingBranch({...editingBranch, city: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label>
                  <input 
                    type="text" 
                    value={editingBranch.phone} 
                    onChange={(e) => setEditingBranch({...editingBranch, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}