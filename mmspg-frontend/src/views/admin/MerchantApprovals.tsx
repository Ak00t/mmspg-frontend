import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Ban, X, Search, Plus, Loader2, Check, RefreshCw, Eye, EyeOff, AlertCircle } from 'lucide-react';
import {
  getMerchants,
  registerMerchant,
  updateMerchant,
  updateMerchantStatus,
  approveMerchant,
  rejectMerchant,
  getMccs
} from '../../services/adminManagementApi';

interface Merchant {
  id: string;
  merchantName: string;
  regNumber: string;
  regDate: string;
  status: string;
}

interface MccOption {
  id: number;
  mccCode: string;
  mccName: string;
}

export default function MerchantApprovals() {
  const { t } = useTranslation();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const rawRole = (localStorage.getItem('userRole') || '').toUpperCase();
  const userRole = rawRole.startsWith('ROLE_') ? rawRole.substring(5) : rawRole;
  const isAuditor = userRole === 'AUDITOR' || userRole.includes('AUDITOR');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  
  const [editName, setEditName] = useState('');
  const [editRegNum, setEditRegNum] = useState('');
  const [suspendReason, setSuspendReason] = useState('');

  // Add Form State & Helpers
  const [availableMccs, setAvailableMccs] = useState<MccOption[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

  const fetchRealMerchants = async () => {
    try {
      const data = await getMerchants();
      const dataArray = Array.isArray(data) ? data : (data.content || []);

      const mappedMerchants: Merchant[] = dataArray
        .filter((m: any) => m !== null)
        .map((m: any) => ({
          id: String(m?.merchantId || m?.id || "N/A"),
          merchantName: m?.merchantName || m?.businessName || "Unknown",
          regNumber: m?.merchantCode || m?.businessRegistrationNo || m?.registrationNumber || "N/A",
          regDate: m?.createdAt ? new Date(m.createdAt).toLocaleDateString() : "N/A",
          status: (m?.status || "PENDING").toUpperCase()
        }));

      setMerchants(mappedMerchants);
    } catch (error) {
      console.error("Error fetching merchants:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMccList = async () => {
    try {
      const data = await getMccs();
      const items = Array.isArray(data) ? data : (data.content || data.data || []);
      if (items.length > 0) {
        setAvailableMccs(items);
        setAddFormData(prev => ({ ...prev, mccId: items[0].id }));
      }
    } catch (e) {
      console.warn("Could not load MCC options:", e);
    }
  };

  useEffect(() => {
    fetchRealMerchants();
    fetchMccList();
  }, []);

  const openEditModal = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setEditName(merchant.merchantName);
    setEditRegNum(merchant.regNumber);
    setIsEditModalOpen(true);
  };

  const openSuspendModal = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setSuspendReason('');
    setIsSuspendModalOpen(true);
  };

  const openAddModal = () => {
    setFormError('');
    setFieldErrors({});
    setShowPassword(false);
    setAddFormData({
      businessName: '',
      merchantCode: '',
      settlementAccountNo: '',
      contactName: '',
      email: '',
      phone: '',
      rawPassword: '',
      mccId: availableMccs.length > 0 ? availableMccs[0].id : 1
    });
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsEditModalOpen(false);
    setIsSuspendModalOpen(false);
    setIsAddModalOpen(false);
    setSelectedMerchant(null);
    setFormError('');
    setFieldErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!addFormData.businessName.trim()) {
      errors.businessName = "Business Name is required";
    } else if (addFormData.businessName.trim().length < 2) {
      errors.businessName = "Business Name must be at least 2 characters";
    }

    if (!addFormData.merchantCode.trim()) {
      errors.merchantCode = "Merchant Code is required";
    } else if (!/^[A-Za-z0-9_-]+$/.test(addFormData.merchantCode.trim())) {
      errors.merchantCode = "Only letters, numbers, hyphens, and underscores are allowed";
    }

    if (!addFormData.settlementAccountNo.trim()) {
      errors.settlementAccountNo = "Settlement Account Number is required";
    } else if (addFormData.settlementAccountNo.trim().length < 4) {
      errors.settlementAccountNo = "Settlement Account Number must be at least 4 characters";
    }

    if (!addFormData.mccId) {
      errors.mccId = "MCC Category is required";
    }

    if (!addFormData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addFormData.email.trim())) {
      errors.email = "Please enter a valid email address (e.g. name@example.com)";
    }

    if (addFormData.phone && addFormData.phone.trim()) {
      if (!/^[+0-9\s-]{6,20}$/.test(addFormData.phone.trim())) {
        errors.phone = "Invalid phone number format (6-20 digits)";
      }
    }

    if (!addFormData.rawPassword) {
      errors.rawPassword = "Password is required";
    } else if (addFormData.rawPassword.length < 6) {
      errors.rawPassword = "Password must be at least 6 characters long";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegisterMerchant = async () => {
    setFormError('');

    if (!validateForm()) {
      setFormError("Please fix the errors highlighted below before submitting.");
      return;
    }

    setIsRegistering(true);

    try {
      const payload = {
        ...addFormData,
        businessName: addFormData.businessName.trim(),
        merchantCode: addFormData.merchantCode.trim(),
        email: addFormData.email.trim(),
        settlementAccountNo: addFormData.settlementAccountNo.trim(),
        mccId: Number(addFormData.mccId) || 1
      };
      await registerMerchant(payload);

      closeModal();
      await fetchRealMerchants();
      window.dispatchEvent(new Event('refreshNotifications'));
      alert("Merchant registered successfully!");
      
    } catch (error: any) {
      console.error("Registration error:", error);
      const backendError = error.response?.data?.error || error.response?.data?.message || error.message || "Error registering merchant.";
      setFormError(backendError);

      if (backendError.toLowerCase().includes("merchant code")) {
        setFieldErrors(prev => ({ ...prev, merchantCode: backendError }));
      } else if (backendError.toLowerCase().includes("email")) {
        setFieldErrors(prev => ({ ...prev, email: backendError }));
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedMerchant) return;
    try {
      await updateMerchant(selectedMerchant.id, { businessName: editName, merchantCode: editRegNum });

      setMerchants(prevMerchants => 
        prevMerchants.map(m => 
          m.id === selectedMerchant.id 
            ? { ...m, merchantName: editName, regNumber: editRegNum }
            : m
        )
      );

      closeModal();
      window.dispatchEvent(new Event('refreshNotifications'));
      alert("Merchant updated successfully!");
    } catch (error: any) {
      console.error("Update error:", error);
      alert(error.response?.data?.message || error.message || "Error updating database.");
    }
  };

  const handleConfirmSuspend = async () => {
    if (!selectedMerchant) return;
    try {
      await updateMerchantStatus(selectedMerchant.id, 'SUSPENDED', suspendReason || 'Violation of terms');

      setMerchants(prevMerchants => 
        prevMerchants.map(m => 
          m.id === selectedMerchant.id ? { ...m, status: 'SUSPENDED' } : m
        )
      );

      closeModal();
      window.dispatchEvent(new Event('refreshNotifications'));
      alert("Merchant suspended successfully!");
    } catch (error: any) {
      console.error("Suspend error:", error);
      alert(error.response?.data?.message || "Error suspending merchant.");
    }
  };

  const handleApprove = async (id: string) => {
    if (!window.confirm(t('merchants.confirmApprove'))) return;
    
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
    const reason = window.prompt(t('merchants.promptRejectReason'));
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
    if (!window.confirm(t('merchants.confirmReactivate'))) return;
    
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">{t('common.active')}</span>;
      case 'PENDING':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">{t('common.pending')}</span>;
      case 'SUSPENDED':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">{t('common.suspended')}</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300">{t('common.rejected')}</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300">{status}</span>;
    }
  };

  const filteredMerchants = merchants.filter(merchant => 
    merchant.merchantName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    merchant.regNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('merchants.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('merchants.subtitle')}</p>
        </div>
        
        {userRole === 'ADMIN' && (
          <button onClick={openAddModal} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            {t('merchants.addMerchant')}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input 
            type="text" 
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm transition-colors" 
            placeholder={t('merchants.searchPlaceholder')} 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-900">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('merchants.colMerchantName')}</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('merchants.colRegNumber')}</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('merchants.colRegDate')}</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('merchants.colStatus')}</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('merchants.colActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                    <p>{t('merchants.loading')}</p>
                  </div>
                </td>
              </tr>
            ) : filteredMerchants.length > 0 ? (
              filteredMerchants.map((merchant) => (
                <tr key={merchant.id} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                  <td className="px-6 py-4"><div className="font-medium text-slate-900 dark:text-white">{merchant.merchantName}</div></td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{merchant.regNumber}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{merchant.regDate}</td>
                  <td className="px-6 py-4">
                    {getStatusBadge(merchant.status)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 flex justify-end items-center">
                    {isAuditor ? (
                      <span className="text-xs text-slate-400 italic">View Only</span>
                    ) : (
                      <>
                        <button onClick={() => openEditModal(merchant)} className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title={t('common.edit')}>
                          <Edit className="h-4 w-4" />
                        </button>

                        {merchant.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleApprove(merchant.id)} className="inline-flex items-center px-3 py-1.5 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-md hover:bg-green-100 font-medium text-xs transition-colors" title={t('merchants.approve')}>
                              <Check className="h-3.5 w-3.5 mr-1" /> {t('merchants.approve')}
                            </button>
                            <button onClick={() => handleReject(merchant.id)} className="inline-flex items-center px-3 py-1.5 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md hover:bg-red-100 font-medium text-xs transition-colors" title={t('merchants.reject')}>
                              <X className="h-3.5 w-3.5 mr-1" /> {t('merchants.reject')}
                            </button>
                          </>
                        )}

                        {merchant.status === 'ACTIVE' && (
                          <button onClick={() => openSuspendModal(merchant)} className="inline-flex items-center px-3 py-1.5 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-md hover:bg-amber-100 font-medium text-xs transition-colors" title={t('merchants.suspend')}>
                            <Ban className="h-3.5 w-3.5 mr-1" /> {t('merchants.suspend')}
                          </button>
                        )}

                        {merchant.status === 'SUSPENDED' && (
                          <button onClick={() => handleReactivate(merchant.id)} className="inline-flex items-center px-3 py-1.5 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-100 font-medium text-xs transition-colors" title={t('merchants.reactivate')}>
                            <RefreshCw className="h-3.5 w-3.5 mr-1" /> {t('merchants.reactivate')}
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">{t('merchants.noMerchants')}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ADD NEW MERCHANT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-3xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('merchants.modalAddTitle')}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {formError && (
                <div className="mb-5 p-3.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm flex items-start gap-2.5">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Business Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('merchants.businessName')} *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Acme Corp" 
                      value={addFormData.businessName}
                      onChange={(e) => {
                        setAddFormData({...addFormData, businessName: e.target.value});
                        if (fieldErrors.businessName) setFieldErrors(prev => ({ ...prev, businessName: '' }));
                      }}
                      className={`w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-colors ${
                        fieldErrors.businessName 
                          ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                          : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500'
                      }`} 
                    />
                    {fieldErrors.businessName && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        {fieldErrors.businessName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('merchants.merchantCode')} *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. REG-123456" 
                      value={addFormData.merchantCode}
                      onChange={(e) => {
                        setAddFormData({...addFormData, merchantCode: e.target.value});
                        if (fieldErrors.merchantCode) setFieldErrors(prev => ({ ...prev, merchantCode: '' }));
                      }}
                      className={`w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-colors ${
                        fieldErrors.merchantCode 
                          ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                          : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500'
                      }`} 
                    />
                    {fieldErrors.merchantCode && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        {fieldErrors.merchantCode}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('merchants.settlementAccount')} *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. KBZ-0987654321" 
                      value={addFormData.settlementAccountNo}
                      onChange={(e) => {
                        setAddFormData({...addFormData, settlementAccountNo: e.target.value});
                        if (fieldErrors.settlementAccountNo) setFieldErrors(prev => ({ ...prev, settlementAccountNo: '' }));
                      }}
                      className={`w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-colors ${
                        fieldErrors.settlementAccountNo 
                          ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                          : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500'
                      }`} 
                    />
                    {fieldErrors.settlementAccountNo && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        {fieldErrors.settlementAccountNo}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t('merchants.businessType') || 'MCC Category'} *
                    </label>
                    {availableMccs.length > 0 ? (
                      <select
                        value={addFormData.mccId}
                        onChange={(e) => {
                          setAddFormData({...addFormData, mccId: parseInt(e.target.value) || 1});
                          if (fieldErrors.mccId) setFieldErrors(prev => ({ ...prev, mccId: '' }));
                        }}
                        className={`w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-colors ${
                          fieldErrors.mccId 
                            ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                            : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500'
                        }`}
                      >
                        {availableMccs.map(mcc => (
                          <option key={mcc.id} value={mcc.id}>
                            {mcc.mccCode} - {mcc.mccName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="number" 
                        placeholder="e.g. 1" 
                        value={addFormData.mccId}
                        onChange={(e) => {
                          setAddFormData({...addFormData, mccId: parseInt(e.target.value) || 1});
                          if (fieldErrors.mccId) setFieldErrors(prev => ({ ...prev, mccId: '' }));
                        }}
                        className={`w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-colors ${
                          fieldErrors.mccId 
                            ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                            : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500'
                        }`} 
                      />
                    )}
                    {fieldErrors.mccId && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        {fieldErrors.mccId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Contact Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('merchants.contactName')}</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe" 
                      value={addFormData.contactName}
                      onChange={(e) => setAddFormData({...addFormData, contactName: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('merchants.email')} *</label>
                    <input 
                      type="email" 
                      placeholder="e.g. contact@acme.com" 
                      value={addFormData.email}
                      onChange={(e) => {
                        setAddFormData({...addFormData, email: e.target.value});
                        if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: '' }));
                      }}
                      className={`w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-colors ${
                        fieldErrors.email 
                          ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                          : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500'
                      }`} 
                    />
                    {fieldErrors.email && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('merchants.phone')}</label>
                    <input 
                      type="text" 
                      placeholder="e.g. +95 9 123 4567" 
                      value={addFormData.phone}
                      onChange={(e) => {
                        setAddFormData({...addFormData, phone: e.target.value});
                        if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: '' }));
                      }}
                      className={`w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-colors ${
                        fieldErrors.phone 
                          ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                          : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500'
                      }`} 
                    />
                    {fieldErrors.phone && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('merchants.password')} *</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Min. 6 characters" 
                        value={addFormData.rawPassword}
                        onChange={(e) => {
                          setAddFormData({...addFormData, rawPassword: e.target.value});
                          if (fieldErrors.rawPassword) setFieldErrors(prev => ({ ...prev, rawPassword: '' }));
                        }}
                        className={`w-full px-3 py-2 pr-10 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-colors ${
                          fieldErrors.rawPassword 
                            ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                            : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500'
                        }`} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {fieldErrors.rawPassword && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        {fieldErrors.rawPassword}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-3">
              <button 
                disabled={isRegistering}
                onClick={closeModal} 
                className="px-5 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button 
                disabled={isRegistering}
                onClick={handleRegisterMerchant} 
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isRegistering && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('merchants.register')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('merchants.modalEditTitle')}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('merchants.businessName')}</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('merchants.merchantCode')}</label>
                <input type="text" value={editRegNum} onChange={(e) => setEditRegNum(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex justify-end space-x-3">
              <button onClick={closeModal} className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium">{t('common.cancel')}</button>
              <button onClick={handleSaveChanges} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">{t('merchants.saveChanges')}</button>
            </div>
          </div>
        </div>
      )}

      {/* SUSPEND MODAL */}
      {isSuspendModalOpen && selectedMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-3">{t('merchants.suspend')}</h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 leading-relaxed">
              You are about to suspend <span className="font-bold text-slate-800 dark:text-white">{selectedMerchant.merchantName}</span>.
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Reason for Suspension</label>
              <textarea rows={3} placeholder="e.g. Unusual dispute velocity, KYC expiry" value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 resize-none outline-none"></textarea>
            </div>
            <div className="flex justify-end space-x-3">
              <button onClick={closeModal} className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium">{t('common.cancel')}</button>
              <button onClick={handleConfirmSuspend} className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                <Ban className="h-4 w-4 mr-1.5" /> {t('merchants.suspend')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
