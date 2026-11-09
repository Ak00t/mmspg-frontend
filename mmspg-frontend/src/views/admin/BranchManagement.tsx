import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Building2, Edit, Power, X, AlertCircle } from 'lucide-react'; 
import {
  getBranches,
  getMerchants,
  createBranch,
  updateBranch,
  updateBranchStatus
} from '../../services/adminManagementApi';

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
  const { t } = useTranslation();
  const rawRole = (localStorage.getItem('userRole') || '').toUpperCase();
  const userRole = rawRole.startsWith('ROLE_') ? rawRole.substring(5) : rawRole;
  const isAuditor = userRole === 'AUDITOR' || userRole.includes('AUDITOR');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [merchants, setMerchants] = useState<any[]>([]); 
  const [newBranch, setNewBranch] = useState({
    merchantId: '',
    branchCode: '',
    branchName: '',
    address: '',
    city: '',
    phone: ''
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBranches();
    fetchMerchants(); 
  }, []);

  const fetchBranches = async () => {
    try {
      const data = await getBranches();
      const branchesList = Array.isArray(data) ? data : (data.content || []);
      setBranches(branchesList);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMerchants = async () => {
    try {
      const data = await getMerchants();
      setMerchants(Array.isArray(data) ? data : (data.content || []));
    } catch (error) {
      console.error('Error fetching merchants:', error);
    }
  };

  const validateAddBranch = () => {
    const errors: Record<string, string> = {};

    if (!newBranch.merchantId) {
      errors.merchantId = "Please select a merchant";
    }

    if (!newBranch.branchName.trim()) {
      errors.branchName = "Branch Name is required";
    } else if (newBranch.branchName.trim().length < 2) {
      errors.branchName = "Branch Name must be at least 2 characters";
    } else if (newBranch.branchName.trim().length > 150) {
      errors.branchName = "Branch Name cannot exceed 150 characters";
    }

    if (newBranch.phone && newBranch.phone.trim()) {
      if (!/^[+0-9\s-]{6,20}$/.test(newBranch.phone.trim())) {
        errors.phone = "Invalid phone format (6-20 digits)";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = async () => {
    setFormError('');
    if (!validateAddBranch()) {
      setFormError("Please fix the highlighted errors before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createBranch({
        ...newBranch,
        branchCode: newBranch.branchCode.trim(),
        branchName: newBranch.branchName.trim(),
        city: newBranch.city.trim(),
        phone: newBranch.phone.trim(),
        address: newBranch.address.trim()
      });
      setIsAddModalOpen(false);
      setNewBranch({ merchantId: '', branchCode: '', branchName: '', address: '', city: '', phone: '' });
      setFieldErrors({});
      setFormError('');
      fetchBranches(); 
      
      window.dispatchEvent(new Event('refreshNotifications'));
      alert("Branch added successfully!"); 
    } catch (error: any) {
      console.error('Error adding branch:', error);
      const backendError = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to add branch';
      setFormError(backendError);

      if (backendError.toLowerCase().includes("branch code")) {
        setFieldErrors(prev => ({ ...prev, branchCode: backendError }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (branchId: string, currentStatus: string) => {
    const action = currentStatus === 'ACTIVE' ? 'disable' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this branch?`)) return;

    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      await updateBranchStatus(branchId);
      setBranches(branches.map(b => b.branchId === branchId ? { ...b, status: newStatus } : b));
      window.dispatchEvent(new Event('refreshNotifications'));
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update branch status.');
    }
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch({ ...branch }); 
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingBranch) return;

    try {
      await updateBranch(editingBranch.branchId, {
        branchName: editingBranch.branchName,
        city: editingBranch.city,
        phone: editingBranch.phone
      });

      setBranches(branches.map(b => b.branchId === editingBranch.branchId ? editingBranch : b));
      setIsEditModalOpen(false);
      setEditingBranch(null);
      
      window.dispatchEvent(new Event('refreshNotifications'));
      alert('Branch updated successfully!');
    } catch (error) {
      console.error('Error updating branch:', error);
      alert('Failed to update branch details.');
    }
  };

  const filteredBranches = branches.filter(branch => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (branch.branchCode && branch.branchCode.toLowerCase().includes(searchLower)) || 
      (branch.branchName && branch.branchName.toLowerCase().includes(searchLower)) ||
      (branch.merchantName && branch.merchantName.toLowerCase().includes(searchLower)) ||
      (branch.city && branch.city.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('branches.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('branches.subtitle')}</p>
        </div>
        {!isAuditor && userRole === 'ADMIN' && (
          <button 
            onClick={() => {
              setFieldErrors({});
              setFormError('');
              setIsAddModalOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            {t('branches.addBranch')}
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition-colors"
            placeholder={t('branches.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('branches.loading')}</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('branches.colBranchInfo')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('branches.colMerchant')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('branches.colContactCity')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('branches.colStatus')}</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('branches.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredBranches.map((branch, index) => (
                  <tr key={branch.branchId || index} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{branch.branchCode}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">{branch.branchName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{branch.merchantName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 dark:text-slate-200">{branch.city || '-'}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{branch.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        branch.status === 'ACTIVE' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      }`}>
                        {branch.status === 'ACTIVE' ? t('common.active') : t('common.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isAuditor ? (
                        <span className="text-xs text-slate-400 italic">View Only</span>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => openEditModal(branch)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title={t('common.edit')}>
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(branch.branchId, branch.status)}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title={branch.status === 'ACTIVE' ? 'Disable' : 'Enable'}>
                            <Power className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredBranches.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                      {t('branches.noBranches')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add New Branch Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('branches.modalAddTitle')}</h2>
              <button onClick={() => {
                setIsAddModalOpen(false);
                setNewBranch({ merchantId: '', branchCode: '', branchName: '', address: '', city: '', phone: '' });
                setFieldErrors({});
                setFormError('');
              }} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('branches.selectMerchant')} *</label>
                <select 
                  value={newBranch.merchantId}
                  onChange={(e) => {
                    setNewBranch({...newBranch, merchantId: e.target.value});
                    if (fieldErrors.merchantId) setFieldErrors(prev => ({ ...prev, merchantId: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm outline-none transition-colors ${
                    fieldErrors.merchantId 
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                      : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500'
                  }`}
                >
                  <option value="">{t('branches.selectMerchant')}...</option>
                  {merchants && merchants.length > 0 ? (
                    merchants.map((merchant, index) => (
                      <option 
                        key={merchant.merchantId || merchant.id || index} 
                        value={merchant.merchantId || merchant.id}
                      >
                        {merchant.businessName || merchant.merchantName || merchant.name || `Merchant ${index + 1}`}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No merchants available</option>
                  )}
                </select>
                {fieldErrors.merchantId && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {fieldErrors.merchantId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('branches.branchCode')} <span className="text-xs text-slate-400 font-normal">({t('common.autoGenerated', 'Auto-generated')})</span>
                </label>
                <input 
                  type="text" 
                  readOnly
                  value={newBranch.branchCode || "Auto-generated (e.g. BR-MC-000001-01)"} 
                  placeholder="Auto-generated (e.g. BR-MC-000001-01)"
                  className="w-full px-3 py-2 border rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 sm:text-sm font-mono cursor-not-allowed border-slate-300 dark:border-slate-600 outline-none select-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('branches.branchName')} *</label>
                <input 
                  type="text" 
                  value={newBranch.branchName} 
                  onChange={(e) => {
                    setNewBranch({...newBranch, branchName: e.target.value});
                    if (fieldErrors.branchName) setFieldErrors(prev => ({ ...prev, branchName: '' }));
                  }}
                  placeholder="e.g. Downtown Outlet"
                  className={`w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm outline-none transition-colors ${
                    fieldErrors.branchName 
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                      : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500'
                  }`}
                />
                {fieldErrors.branchName && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {fieldErrors.branchName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('branches.address')}</label>
                <input 
                  type="text" 
                  value={newBranch.address} 
                  onChange={(e) => setNewBranch({...newBranch, address: e.target.value})}
                  placeholder="Street address"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('branches.city')}</label>
                  <input 
                    type="text" 
                    value={newBranch.city} 
                    onChange={(e) => setNewBranch({...newBranch, city: e.target.value})}
                    placeholder="e.g. Yangon"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('branches.phone')}</label>
                  <input 
                    type="text" 
                    value={newBranch.phone} 
                    onChange={(e) => {
                      setNewBranch({...newBranch, phone: e.target.value});
                      if (fieldErrors.phone) setFieldErrors(prev => ({ ...prev, phone: '' }));
                    }}
                    placeholder="e.g. +95 9 1234567"
                    className={`w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm outline-none transition-colors ${
                      fieldErrors.phone 
                        ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                        : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {fieldErrors.phone && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 flex-shrink-0" />
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setNewBranch({ merchantId: '', branchCode: '', branchName: '', address: '', city: '', phone: '' });
                  setFieldErrors({});
                  setFormError('');
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button 
                disabled={isSubmitting}
                onClick={handleAddSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {t('branches.createBranch')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {isEditModalOpen && editingBranch && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('branches.modalEditTitle')}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('branches.colMerchant')}</label>
                <input 
                  type="text" 
                  disabled
                  value={editingBranch.merchantName} 
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('branches.branchName')}</label>
                <input 
                  type="text" 
                  value={editingBranch.branchName} 
                  onChange={(e) => setEditingBranch({...editingBranch, branchName: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('branches.city')}</label>
                  <input 
                    type="text" 
                    value={editingBranch.city} 
                    onChange={(e) => setEditingBranch({...editingBranch, city: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('branches.phone')}</label>
                  <input 
                    type="text" 
                    value={editingBranch.phone} 
                    onChange={(e) => setEditingBranch({...editingBranch, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {t('branches.saveChanges')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
