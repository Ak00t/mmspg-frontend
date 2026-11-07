import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Edit, ShieldAlert, X, AlertTriangle, RefreshCw, AlertCircle } from 'lucide-react';
import {
  getTerminals,
  getMerchants,
  getBranches,
  provisionTerminal,
  updateTerminal,
  suspendTerminal,
  reactivateTerminal
} from '../../services/adminManagementApi';

interface Terminal {
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
  const { t } = useTranslation();
  const rawRole = (localStorage.getItem('userRole') || '').toUpperCase();
  const userRole = rawRole.startsWith('ROLE_') ? rawRole.substring(5) : rawRole;
  const isAuditor = userRole === 'AUDITOR' || userRole.includes('AUDITOR');
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null);
  const [suspendingTerminal, setSuspendingTerminal] = useState<Terminal | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  useEffect(() => {
    fetchTerminals();
    fetchMerchantsAndBranches();
  }, []);

  const fetchTerminals = async () => {
    try {
      const data = await getTerminals();
      const items = Array.isArray(data) ? data : (data.content || data.data || []);
      
      const sortedTerminals = [...items].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      
      setTerminals(sortedTerminals);
    } catch (error) {
      console.error('Error fetching terminals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMerchantsAndBranches = async () => {
    try {
      const [merData, braData] = await Promise.all([getMerchants(), getBranches()]);
      setMerchants(Array.isArray(merData) ? merData : (merData.content || []));
      setBranches(Array.isArray(braData) ? braData : (braData.content || []));
    } catch (error) {
      console.error('Error fetching merchants/branches:', error);
    }
  };

  const availableBranchesForSelectedMerchant = branches.filter(b => {
    if (!newTerminal.merchantId) return false; 
    const bMerchantId = b.merchantId || (b.merchant && b.merchant.id) || b.merchant_id;
    return String(bMerchantId) === String(newTerminal.merchantId);
  });

  const validateAddTerminal = () => {
    const errors: Record<string, string> = {};

    if (!newTerminal.merchantId) {
      errors.merchantId = "Please select a merchant";
    }

    if (!newTerminal.branchId) {
      errors.branchId = "Please select a branch";
    }

    if (!newTerminal.terminalName.trim()) {
      errors.terminalName = "Terminal Name / Model is required";
    } else if (newTerminal.terminalName.trim().length < 2) {
      errors.terminalName = "Terminal Name must be at least 2 characters";
    } else if (newTerminal.terminalName.trim().length > 100) {
      errors.terminalName = "Terminal Name cannot exceed 100 characters";
    }

    if (!newTerminal.terminalType) {
      errors.terminalType = "Please select a terminal type";
    }

    if (newTerminal.terminalCode && newTerminal.terminalCode.trim()) {
      if (!/^[A-Za-z0-9_-]+$/.test(newTerminal.terminalCode.trim())) {
        errors.terminalCode = "Terminal code can only contain letters, numbers, hyphens, and underscores";
      } else if (newTerminal.terminalCode.trim().length > 50) {
        errors.terminalCode = "Terminal code cannot exceed 50 characters";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProvisionSubmit = async () => {
    setFormError('');
    if (!validateAddTerminal()) {
      setFormError("Please fix the highlighted errors before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      await provisionTerminal({
        ...newTerminal,
        terminalName: newTerminal.terminalName.trim(),
        terminalCode: newTerminal.terminalCode ? newTerminal.terminalCode.trim() : ''
      });
      fetchTerminals();
      setIsAddModalOpen(false);
      setNewTerminal({ merchantId: '', branchId: '', terminalName: '', terminalType: 'PHYSICAL_POS', terminalCode: '' });
      setFieldErrors({});
      setFormError('');
      
      window.dispatchEvent(new Event('refreshNotifications'));
      alert('Terminal provisioned successfully!');
    } catch (error: any) {
      console.error('Error provisioning terminal:', error);
      const backendError = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error';
      setFormError(backendError);

      if (backendError.toLowerCase().includes("terminal code")) {
        setFieldErrors(prev => ({ ...prev, terminalCode: backendError }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTerminal) return;
    try {
      await updateTerminal(editingTerminal.terminalId, {
        terminalName: editingTerminal.terminalName,
        terminalType: editingTerminal.terminalType
      });
      setTerminals(terminals.map(t => t.terminalId === editingTerminal.terminalId ? editingTerminal : t));
      setIsEditModalOpen(false);
      setEditingTerminal(null);
      
      window.dispatchEvent(new Event('refreshNotifications'));
      alert('Terminal updated successfully!');
    } catch (error: any) {
      console.error('Error updating terminal:', error);
      alert('Failed to update terminal.');
    }
  };

  const handleSuspendSubmit = async () => {
    if (!suspendingTerminal) return;
    try {
      await suspendTerminal(suspendingTerminal.terminalId, suspendReason);
      setTerminals(terminals.map(t => t.terminalId === suspendingTerminal.terminalId ? { ...t, status: 'SUSPENDED' } : t));
      setIsSuspendModalOpen(false);
      setSuspendingTerminal(null);
      setSuspendReason('');
      
      window.dispatchEvent(new Event('refreshNotifications'));
      alert('Terminal suspended successfully!');
    } catch (error: any) {
      console.error('Error suspending terminal:', error);
      alert('Failed to suspend terminal.');
    }
  };

  const handleReactivate = async (id: string) => {
    if (!window.confirm("Are you sure you want to reactivate this terminal?")) return;
    try {
      await reactivateTerminal(id);
      setTerminals(terminals.map(t => t.terminalId === id ? { ...t, status: 'ONLINE' } : t));
      window.dispatchEvent(new Event('refreshNotifications'));
      alert('Terminal reactivated successfully!');
    } catch (error: any) {
      console.error('Error reactivating terminal:', error);
      alert('Failed to reactivate terminal.');
    }
  };

  const filteredTerminals = terminals.filter(terminal => 
    (terminal.terminalCode && terminal.terminalCode.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (terminal.merchantName && terminal.merchantName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (terminal.terminalName && terminal.terminalName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('terminals.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('terminals.subtitle')}</p>
        </div>
        {userRole === 'ADMIN' && (
          <button 
            onClick={() => {
              setFieldErrors({});
              setFormError('');
              setIsAddModalOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            {t('terminals.addTerminal')}
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
            placeholder={t('terminals.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('terminals.loading')}</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('terminals.colTerminalId')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('terminals.model')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('branches.colMerchant')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('branches.title')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('common.status')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('common.date')}</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredTerminals.map((terminal, index) => (
                  <tr key={terminal.terminalId || index} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">
                      {terminal.terminalCode || `TID-${terminal.terminalId}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{terminal.terminalName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 uppercase">{terminal.terminalType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                      {terminal.merchantName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                      {terminal.branchName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        terminal.status === 'ONLINE' || terminal.status === 'ACTIVE'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                          : terminal.status === 'OFFLINE'
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      }`}>
                        {terminal.status === 'ONLINE' || terminal.status === 'ACTIVE' ? t('common.active') : terminal.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                      {terminal.createdAt ? new Date(terminal.createdAt).toISOString().split('T')[0] : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isAuditor ? (
                        <span className="text-xs text-slate-400 italic">View Only</span>
                      ) : (
                        <div className="flex justify-end space-x-2">
                          {terminal.status === 'SUSPENDED' ? (
                            <button 
                              onClick={() => handleReactivate(terminal.terminalId)}
                              className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title={t('merchants.reactivate')}>
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => {
                                setSuspendingTerminal(terminal);
                                setIsSuspendModalOpen(true);
                              }}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title={t('merchants.suspend')}>
                              <ShieldAlert className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button 
                            onClick={() => {
                              setEditingTerminal({...terminal});
                              setIsEditModalOpen(true);
                            }}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title={t('common.edit')}>
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredTerminals.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                      {t('terminals.noTerminals')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Provision New Terminal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('terminals.modalAddTitle')}</h2>
              <button onClick={() => {
                setIsAddModalOpen(false);
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

              {/* Merchant Select */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('branches.colMerchant')} *</label>
                <select 
                  value={newTerminal.merchantId}
                  onChange={(e) => {
                    setNewTerminal({
                      ...newTerminal, 
                      merchantId: e.target.value,
                      branchId: '' // reset branch on merchant change
                    });
                    if (fieldErrors.merchantId) setFieldErrors(prev => ({ ...prev, merchantId: '', branchId: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm outline-none transition-colors ${
                    fieldErrors.merchantId 
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                      : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500'
                  }`}
                >
                  <option value="">{t('branches.selectMerchant')}...</option>
                  {merchants.map((m, i) => (
                    <option key={m.merchantId || m.id || i} value={m.merchantId || m.id}>
                      {m.businessName || m.merchantName || `Merchant ${i+1}`}
                    </option>
                  ))}
                </select>
                {fieldErrors.merchantId && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {fieldErrors.merchantId}
                  </p>
                )}
              </div>

              {/* Branch Select */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('terminals.selectBranch')} *</label>
                <select 
                  value={newTerminal.branchId}
                  onChange={(e) => {
                    setNewTerminal({...newTerminal, branchId: e.target.value});
                    if (fieldErrors.branchId) setFieldErrors(prev => ({ ...prev, branchId: '' }));
                  }}
                  disabled={!newTerminal.merchantId}
                  className={`w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm outline-none transition-colors disabled:opacity-60 ${
                    fieldErrors.branchId 
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                      : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500'
                  }`}
                >
                  <option value="">{t('terminals.selectBranch')}...</option>
                  {availableBranchesForSelectedMerchant.map((b, i) => (
                    <option key={b.branchId || b.id || i} value={b.branchId || b.id}>
                      {b.branchName || b.name || `Branch ${i+1}`}
                    </option>
                  ))}
                </select>
                {fieldErrors.branchId && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {fieldErrors.branchId}
                  </p>
                )}
                {newTerminal.merchantId && availableBranchesForSelectedMerchant.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    * This merchant has no branches. Please add a branch in Branch Management first.
                  </p>
                )}
              </div>

              {/* Terminal Model / Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('terminals.colModel')} *</label>
                <input 
                  type="text" 
                  value={newTerminal.terminalName} 
                  onChange={(e) => {
                    setNewTerminal({...newTerminal, terminalName: e.target.value});
                    if (fieldErrors.terminalName) setFieldErrors(prev => ({ ...prev, terminalName: '' }));
                  }}
                  placeholder="e.g. Counter 1 - Barcode POS"
                  className={`w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm outline-none transition-colors ${
                    fieldErrors.terminalName 
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                      : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500'
                  }`}
                />
                {fieldErrors.terminalName && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {fieldErrors.terminalName}
                  </p>
                )}
              </div>

              {/* Terminal Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Terminal Type *</label>
                <select 
                  value={newTerminal.terminalType}
                  onChange={(e) => {
                    setNewTerminal({...newTerminal, terminalType: e.target.value});
                    if (fieldErrors.terminalType) setFieldErrors(prev => ({ ...prev, terminalType: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm outline-none transition-colors ${
                    fieldErrors.terminalType 
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                      : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500'
                  }`}
                >
                  <option value="PHYSICAL_POS">Physical POS</option>
                  <option value="VIRTUAL_API">Virtual Checkout API</option>
                </select>
                {fieldErrors.terminalType && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {fieldErrors.terminalType}
                  </p>
                )}
              </div>

              {/* Terminal Code (Auto-generated) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('terminals.terminalId', 'Terminal Code')} <span className="text-xs text-slate-400 font-normal">({t('common.autoGenerated', 'Auto-generated')})</span>
                </label>
                <input 
                  type="text" 
                  readOnly
                  placeholder={`Auto-generated (e.g. ${newTerminal.terminalType === 'PHYSICAL_POS' ? 'POS-000001' : 'API-000001'})`}
                  value={newTerminal.terminalCode || `Auto-generated (e.g. ${newTerminal.terminalType === 'PHYSICAL_POS' ? 'POS-000001' : 'API-000001'})`}
                  className="w-full px-3 py-2 border rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 sm:text-sm font-mono cursor-not-allowed border-slate-300 dark:border-slate-600 outline-none select-none"
                />
                {fieldErrors.terminalCode && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {fieldErrors.terminalCode}
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setFieldErrors({});
                  setFormError('');
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button 
                disabled={isSubmitting}
                onClick={handleProvisionSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {t('terminals.createTerminal')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Terminal Info Modal */}
      {isEditModalOpen && editingTerminal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('terminals.modalEditTitle')}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('terminals.model')}</label>
                <input 
                  type="text" 
                  value={editingTerminal.terminalName} 
                  onChange={(e) => setEditingTerminal({...editingTerminal, terminalName: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Terminal Type</label>
                <select 
                  value={editingTerminal.terminalType}
                  onChange={(e) => setEditingTerminal({...editingTerminal, terminalType: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="PHYSICAL_POS">Physical POS</option>
                  <option value="VIRTUAL_API">Virtual Checkout API</option>
                </select>
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
                {t('terminals.saveChanges')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Terminal Modal */}
      {isSuspendModalOpen && suspendingTerminal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center space-x-2 mb-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('merchants.suspend')}</h2>
            </div>
            <div className="pb-2 text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to suspend this terminal? It will no longer be able to process transactions.
            </div>
            <div className="pt-2 space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason for Suspension</label>
                <textarea 
                  rows={3}
                  value={suspendReason} 
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Please provide a reason..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setIsSuspendModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handleSuspendSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                {t('merchants.suspend')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
