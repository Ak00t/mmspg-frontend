import { useState, useEffect } from 'react';
import { Edit, Ban, X, Search, Plus, Loader2, Check, RefreshCw } from 'lucide-react';
import {
  getMerchants,
  registerMerchant,
  updateMerchant,
  updateMerchantStatus,
  approveMerchant,
  rejectMerchant
} from '../../services/adminManagementApi';

interface Merchant {
  id: string;
  merchantName: string;
  regNumber: string;
  regDate: string;
  status: string;
}

export default function MerchantApprovals() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const userRole = localStorage.getItem('userRole') || '';
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  
  const [editName, setEditName] = useState('');
  const [editRegNum, setEditRegNum] = useState('');
  const [suspendReason, setSuspendReason] = useState('');

  // Add Form State
  const [addFormData, setAddFormData] = useState({
    businessName: '',
    merchantCode: '',
    settlementAccountNo: '',
    contactName: '',
    email: '',
    phone: '',
    rawPassword: '',
    mccId: 1
  });

  useEffect(() => {
    const fetchRealMerchants = async () => {
      try {
        const data = await getMerchants();
        const dataArray = Array.isArray(data) ? data : (data.content || []);

        const realMerchants = dataArray
          .filter((m: any) => m !== null)
          .map((m: any) => ({
            id: m?.merchantId || m?.id || "N/A",
            merchantName: m?.merchantName || m?.businessName || "Unknown",
            regNumber: m?.merchantCode || m?.businessRegistrationNo || m?.registrationNumber || "N/A",
            regDate: m?.createdAt ? new Date(m.createdAt).toLocaleDateString() : "N/A",
            status: m?.status || "PENDING"
          }));

        setMerchants(realMerchants);
      } catch (error) {
        console.error("Error fetching real data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealMerchants();
  }, []);

  const handleEditClick = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setEditName(merchant.merchantName);
    setEditRegNum(merchant.regNumber);
    setIsEditModalOpen(true);
  };

  const handleSuspendClick = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setSuspendReason('');
    setIsSuspendModalOpen(true);
  };

  const openAddModal = () => {
    setAddFormData({ businessName: '', merchantCode: '', settlementAccountNo: '', contactName: '', email: '', phone: '', rawPassword: '', mccId: 1 });
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsEditModalOpen(false);
    setIsSuspendModalOpen(false);
    setIsAddModalOpen(false);
    setSelectedMerchant(null);
  };

  const handleRegisterMerchant = async () => {
    try {
      const result = await registerMerchant(addFormData);

      setMerchants(prevMerchants => [
        {
          id: result.merchantId,
          merchantName: addFormData.businessName,
          regNumber: result.merchantCode || addFormData.merchantCode,
          regDate: new Date().toLocaleDateString(),
          status: result.status || 'PENDING'
        },
        ...prevMerchants
      ]);

      closeModal();
      window.dispatchEvent(new Event('refreshNotifications'));
      alert("Merchant registered successfully!");
      
    } catch (error: any) {
      console.error("Registration error:", error);
      alert(error.response?.data?.error || error.message || "Error registering merchant.");
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedMerchant) return;
    try {
      await updateMerchant(selectedMerchant.id, { businessName: editName, merchantCode: editRegNum });

      setMerchants(prevMerchants => 
        prevMerchants.map(m => m.id === selectedMerchant.id ? { ...m, merchantName: editName, regNumber: editRegNum } : m)
      );
      closeModal();
      
      window.dispatchEvent(new Event('refreshNotifications'));
      alert("Merchant updated successfully!");
    } catch (error: any) {
      console.error("Update error:", error);
      alert(error.response?.data?.message || "Error updating database.");
    }
  };

  const handleConfirmSuspend = async () => {
    if (!selectedMerchant) return;
    try {
      await updateMerchantStatus(selectedMerchant.id, 'SUSPENDED', suspendReason);

      setMerchants(prevMerchants => 
        prevMerchants.map(m => m.id === selectedMerchant.id ? { ...m, status: 'SUSPENDED' } : m)
      );
      closeModal();
      
      window.dispatchEvent(new Event('refreshNotifications'));
      alert("Merchant suspended successfully!");
    } catch (error: any) {
      console.error("Suspend error:", error);
      alert(error.response?.data?.message || "Error suspending merchant.");
    }
  };

  // ----------------------------------------------------------------------
  // Merchant Action Handlers (Approve, Reject, Reactivate)
  // ----------------------------------------------------------------------
  const handleApprove = async (id: string) => {
    if (!window.confirm("Are you sure you want to approve this merchant?")) return;
    
    try {
      await approveMerchant(id);

      setMerchants(prev => prev.map(m => m.id === id ? { ...m, status: 'ACTIVE' } : m));
      
      window.dispatchEvent(new Event('refreshNotifications'));
      alert("Merchant approved successfully!");
    } catch (error: any) {
      console.error("Approve error:", error);
      alert(error.response?.data?.error || "Error approving merchant.");
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt("Please enter a reason for rejection:");
    if (reason === null) return; 

    try {
      await rejectMerchant(id, reason);

      setMerchants(prev => prev.map(m => m.id === id ? { ...m, status: 'REJECTED' } : m));
      
      window.dispatchEvent(new Event('refreshNotifications'));
      alert("Merchant rejected successfully!");
    } catch (error: any) {
      console.error("Reject error:", error);
      alert(error.response?.data?.error || "Error rejecting merchant.");
    }
  };

  const handleReactivate = async (id: string) => {
    if (!window.confirm("Are you sure you want to reactivate this suspended merchant?")) return;
    
    try {
      await updateMerchantStatus(id, 'ACTIVE', 'Reactivated by Admin');

      setMerchants(prev => prev.map(m => m.id === id ? { ...m, status: 'ACTIVE' } : m));
      
      window.dispatchEvent(new Event('refreshNotifications'));
      alert("Merchant reactivated successfully!");
    } catch (error: any) {
      console.error("Reactivate error:", error);
      alert(error.response?.data?.message || "Error reactivating merchant.");
    }
  };

  const filteredMerchants = merchants.filter(merchant => 
    merchant.merchantName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    merchant.regNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Merchant Approvals</h1>
        
        {/* Only ADMIN or SUPPORT can see Add Merchant button */}
        {(userRole === 'ADMIN' || userRole === 'SUPPORT') && (
          <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Merchant
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <p className="text-sm text-slate-500 mb-2">Search by merchant name or reg number...</p>
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input type="text" className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Merchant Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Registration Number</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Registration Date</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              {(userRole === 'ADMIN' || userRole === 'SUPPORT') && (
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                    <p>Loading real data from database...</p>
                  </div>
                </td>
              </tr>
            ) : filteredMerchants.length > 0 ? (
              filteredMerchants.map((merchant) => (
                <tr key={merchant.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4"><div className="font-medium text-slate-900">{merchant.merchantName}</div></td>
                  <td className="px-6 py-4 text-sm text-slate-600">{merchant.regNumber}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{merchant.regDate}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                      merchant.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      merchant.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      merchant.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {merchant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3 flex justify-end items-center">
                    {/* Edit button is always shown */}
                    <button onClick={() => handleEditClick(merchant)} className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm p-1.5 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                      <Edit className="h-4 w-4" />
                    </button>

                    {/* PENDING: Show Approve / Reject */}
                    {merchant.status === 'PENDING' && (
                      <>
                        <button onClick={() => handleApprove(merchant.id)} className="inline-flex items-center px-3 py-1.5 border border-green-200 bg-green-50 text-green-700 rounded-md hover:bg-green-100 font-medium text-sm transition-colors" title="Approve Merchant">
                          <Check className="h-4 w-4 mr-1.5" /> Approve
                        </button>
                        <button onClick={() => handleReject(merchant.id)} className="inline-flex items-center px-3 py-1.5 border border-red-200 bg-red-50 text-red-700 rounded-md hover:bg-red-100 font-medium text-sm transition-colors" title="Reject Merchant">
                          <X className="h-4 w-4 mr-1.5" /> Reject
                        </button>
                      </>
                    )}

                    {/* ACTIVE: Show Suspend */}
                    {merchant.status === 'ACTIVE' && (
                      <button onClick={() => handleSuspendClick(merchant)} className="inline-flex items-center px-3 py-1.5 border border-amber-200 bg-amber-50 text-amber-600 rounded-md hover:bg-amber-100 font-medium text-sm transition-colors" title="Suspend Merchant">
                        <Ban className="h-4 w-4 mr-1.5" /> Suspend
                      </button>
                    )}

                    {/* SUSPENDED: Show Reactivate */}
                    {merchant.status === 'SUSPENDED' && (
                      <button onClick={() => handleReactivate(merchant.id)} className="inline-flex items-center px-3 py-1.5 border border-blue-200 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 font-medium text-sm transition-colors" title="Reactivate Merchant">
                        <RefreshCw className="h-4 w-4 mr-1.5" /> Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No merchants found matching your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD NEW MERCHANT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">Add New Merchant</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Business Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 border-b pb-2">Business Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                    <input type="text" placeholder="e.g. Acme Corp" value={addFormData.businessName}
                      onChange={(e) => setAddFormData({...addFormData, businessName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Registration Number</label>
                    <input type="text" placeholder="e.g. REG-123456" value={addFormData.merchantCode}
                      onChange={(e) => setAddFormData({...addFormData, merchantCode: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Settlement Bank Account</label>
                    <input type="text" placeholder="e.g. KBZ-0987654321" value={addFormData.settlementAccountNo}
                      onChange={(e) => setAddFormData({...addFormData, settlementAccountNo: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">MCC ID</label>
                    <input type="number" placeholder="e.g. 1" value={addFormData.mccId}
                      onChange={(e) => setAddFormData({...addFormData, mccId: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 border-b pb-2">Contact Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                    <input type="text" placeholder="e.g. John Doe" value={addFormData.contactName}
                      onChange={(e) => setAddFormData({...addFormData, contactName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input type="email" placeholder="e.g. contact@acme.com" value={addFormData.email}
                      onChange={(e) => setAddFormData({...addFormData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                    <input type="text" placeholder="e.g. +95 9 123 4567" value={addFormData.phone}
                      onChange={(e) => setAddFormData({...addFormData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Default Password</label>
                    <input type="password" placeholder="Enter password" value={addFormData.rawPassword}
                      onChange={(e) => setAddFormData({...addFormData, rawPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button onClick={() => setIsAddModalOpen(false)} className="px-5 py-2 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 font-medium transition-colors">
                Cancel
              </button>
              <button onClick={handleRegisterMerchant} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm">
                Register Merchant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Edit Merchant Details</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Registration Number</label>
                <input type="text" value={editRegNum} onChange={(e) => setEditRegNum(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
              <button onClick={closeModal} className="px-4 py-2 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 font-medium text-sm">Cancel</button>
              <button onClick={handleSaveChanges} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* SUSPEND MODAL */}
      {isSuspendModalOpen && selectedMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-3">Suspend Merchant</h2>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              You are about to suspend <span className="font-bold text-slate-800">{selectedMerchant.merchantName}</span>. This will immediately disable their API access and payment processing capabilities.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Reason for Suspension</label>
              <textarea rows={3} placeholder="e.g. Unusual dispute velocity, KYC expiry" value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-sm"></textarea>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={closeModal} className="px-4 py-2 border border-slate-300 text-slate-700 bg-white rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors">Cancel</button>
              <button onClick={handleConfirmSuspend} className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors">
                <Ban className="h-4 w-4 mr-2" /> Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}