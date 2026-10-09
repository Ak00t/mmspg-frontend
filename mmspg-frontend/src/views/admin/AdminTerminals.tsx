import { useState, useEffect } from 'react';
import { Search, Plus, Edit, ShieldAlert, X, AlertTriangle } from 'lucide-react';

interface Terminal {
  // 🔴 number အစား string ဟု ပြောင်းပါ (UUID ကို လက်ခံရန်)
  terminalId: string;
  terminalCode: string; 
  terminalName: string; 
  terminalType: string; 
  merchantName: string;
  branchName: string | null;
  status: string; 
  createdAt: string;
}

export default function AdminTerminals() {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);

  // Data States
  const [newTerminal, setNewTerminal] = useState({
    merchantId: '',
    branchId: '',
    terminalName: '',
    terminalType: 'PHYSICAL_POS',
    terminalCode: ''
  });
  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null);
  const [suspendingTerminal, setSuspendingTerminal] = useState<Terminal | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  useEffect(() => {
    fetchTerminals();
    fetchMerchantsAndBranches();
  }, []);

  const fetchTerminals = async () => {
    const token = localStorage.getItem('token'); 
    if (!token) {
        setLoading(false);
        return; 
    }
    try {
      const response = await fetch('http://127.0.0.1:8004/api/v1/admin/terminals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTerminals(data);
      }
    } catch (error) {
      console.error('Error fetching terminals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMerchantsAndBranches = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      // Fetch Merchants
      const merRes = await fetch('http://127.0.0.1:8004/api/v1/admin/merchants', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (merRes.ok) setMerchants(await merRes.json());

      // Fetch Branches
      const braRes = await fetch('http://127.0.0.1:8004/api/v1/admin/branches', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (braRes.ok) setBranches(await braRes.json());
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  // 🔴 ၁။ Provision New Terminal Function
  const handleProvisionSubmit = async () => {
    if (!newTerminal.merchantId || !newTerminal.terminalName || !newTerminal.terminalType) {
      alert("Please fill in all required fields.");
      return;
    }
    const token = localStorage.getItem('token');
    try {
      // 🔴 ဤနေရာတွင် /provision ဟု အတိအကျ ထည့်ပေးလိုက်ပါ
      const response = await fetch('http://127.0.0.1:8004/api/v1/admin/terminals/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTerminal)
      });
      if (response.ok) {
        fetchTerminals();
        setIsAddModalOpen(false);
        setNewTerminal({ merchantId: '', branchId: '', terminalName: '', terminalType: 'PHYSICAL_POS', terminalCode: '' });
      } else {
        alert('Failed to provision terminal.');
      }
    } catch (error) {
      console.error('Error provisioning terminal:', error);
    }
  };

  // 🔴 ၂။ Edit Terminal Function
  const handleSaveEdit = async () => {
    if (!editingTerminal) return;
    const token = localStorage.getItem('token');
    try {
    const response = await fetch(`http://127.0.0.1:8004/api/v1/admin/terminals/${editingTerminal.terminalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          terminalName: editingTerminal.terminalName,
          terminalType: editingTerminal.terminalType
        })
      });
      if (response.ok) {
        setTerminals(terminals.map(t => t.terminalId === editingTerminal.terminalId ? editingTerminal : t));
        setIsEditModalOpen(false);
        setEditingTerminal(null);
      } else {
        alert('Failed to update terminal.');
      }
    } catch (error) {
      console.error('Error updating terminal:', error);
    }
  };

  // 🔴 ၃။ Suspend (Ban) Terminal Function
  const handleSuspendSubmit = async () => {
    if (!suspendingTerminal) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://127.0.0.1:8004/api/v1/admin/terminals/${suspendingTerminal.terminalId}/suspend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: suspendReason })
      });
      if (response.ok) {
        setTerminals(terminals.map(t => t.terminalId === suspendingTerminal.terminalId ? { ...t, status: 'SUSPENDED' } : t));
        setIsSuspendModalOpen(false);
        setSuspendingTerminal(null);
        setSuspendReason('');
      } else {
        alert('Failed to suspend terminal.');
      }
    } catch (error) {
      console.error('Error suspending terminal:', error);
    }
  };

  const filteredTerminals = terminals.filter(terminal => 
    (terminal.terminalCode && terminal.terminalCode.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (terminal.merchantName && terminal.merchantName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Terminal Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and monitor POS terminals here.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Terminal
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
            placeholder="Search TID / Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading terminal data...</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">TERMINAL ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">NAME / TYPE</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">MERCHANT</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">BRANCH</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">STATUS</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">CREATED</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredTerminals.map((terminal, index) => (
                  <tr key={terminal.terminalId || index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                      {terminal.terminalCode || `TID-${terminal.terminalId}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{terminal.terminalName}</div>
                      <div className="text-xs text-slate-500 uppercase">{terminal.terminalType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {terminal.merchantName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {terminal.branchName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        terminal.status === 'ONLINE' || terminal.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800' 
                          : terminal.status === 'OFFLINE'
                          ? 'bg-slate-100 text-slate-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {terminal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {new Date(terminal.createdAt).toISOString().split('T')[0]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {/* Suspend Icon Button */}
                        <button 
                          onClick={() => {
                            setSuspendingTerminal(terminal);
                            setIsSuspendModalOpen(true);
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Suspend">
                          <ShieldAlert className="h-4 w-4" />
                        </button>
                        {/* Edit Button */}
                        <button 
                          onClick={() => {
                            setEditingTerminal({...terminal});
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTerminals.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500 text-sm">
                      No terminals found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 🔴 Provision New Terminal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Add New Terminal</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Merchant</label>
                <select 
                  value={newTerminal.merchantId}
                  onChange={(e) => setNewTerminal({...newTerminal, merchantId: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a Merchant...</option>
                  {merchants.map((m, i) => (
                    <option key={m.merchantId || m.id || i} value={m.merchantId || m.id}>
                      {m.businessName || m.merchantName || `Merchant ${i+1}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Branch</label>
                <select 
                  value={newTerminal.branchId}
                  onChange={(e) => setNewTerminal({...newTerminal, branchId: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a Branch...</option>
                  {branches
                    .filter(b => {
                      // Merchant မရွေးရသေးပါက အားလုံးပြမည်
                      if (!newTerminal.merchantId) return true; 
                      
                      // Backend မှ ပြန်လာသော data တွင် merchant ID ပါ/မပါ စစ်ဆေးမည်
                      const bMerchantId = b.merchantId || (b.merchant && b.merchant.id) || b.merchant_id;
                      
                      // အကယ်၍ Backend က merchantId လုံးဝမပို့ပေးပါက (Filter လုပ်၍မရသဖြင့်) အားလုံးကို ပေါ်စေမည်
                      if (!bMerchantId) return true; 
                      
                      return String(bMerchantId) === String(newTerminal.merchantId);
                    })
                    .map((b, i) => (
                    <option key={b.branchId || b.id || i} value={b.branchId || b.id}>
                      {b.branchName || b.name || `Branch ${i+1}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Terminal Name</label>
                <input 
                  type="text" 
                  value={newTerminal.terminalName} 
                  onChange={(e) => setNewTerminal({...newTerminal, terminalName: e.target.value})}
                  placeholder="e.g. Counter 1 - Barcode POS"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Terminal Type</label>
                <select 
                  value={newTerminal.terminalType}
                  onChange={(e) => setNewTerminal({...newTerminal, terminalType: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="PHYSICAL_POS">Physical POS</option>
                  <option value="VIRTUAL_API">Virtual Checkout API</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Terminal Code (Optional)</label>
                <input 
                  type="text" 
                  value={newTerminal.terminalCode} 
                  onChange={(e) => setNewTerminal({...newTerminal, terminalCode: e.target.value})}
                  placeholder="Auto-generated if left blank"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleProvisionSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Provision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 Edit Terminal Info Modal */}
      {isEditModalOpen && editingTerminal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Edit Terminal Info</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Terminal Name</label>
                <input 
                  type="text" 
                  value={editingTerminal.terminalName} 
                  onChange={(e) => setEditingTerminal({...editingTerminal, terminalName: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Terminal Type</label>
                <select 
                  value={editingTerminal.terminalType}
                  onChange={(e) => setEditingTerminal({...editingTerminal, terminalType: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="PHYSICAL_POS">Physical POS</option>
                  <option value="VIRTUAL_API">Virtual Checkout API</option>
                </select>
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

      {/* 🔴 Suspend Terminal Modal */}
      {isSuspendModalOpen && suspendingTerminal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h2 className="text-lg font-bold text-slate-800">Suspend Terminal</h2>
            </div>
            <div className="px-6 pb-2 text-sm text-slate-600">
              Are you sure you want to suspend this terminal? It will no longer be able to process transactions.
            </div>
            <div className="p-6 pt-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Suspension</label>
                <textarea 
                  rows={3}
                  value={suspendReason} 
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Please provide a reason..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
              <button 
                onClick={() => setIsSuspendModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSuspendSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirm Suspend
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}