import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Plus, Tag, Edit, Trash2, X, AlertCircle } from 'lucide-react';
import {
  getMccs,
  createMcc,
  updateMcc,
  deleteMcc
} from '../../services/adminManagementApi';

interface MccCode {
  id: number; 
  mccCode: string;
  mccName: string;
  description: string | null;
  status: string;
  createdAt: string;
}

export default function MccConfiguration() {
  const { t } = useTranslation();
  const userRole = (localStorage.getItem('userRole') || '').toUpperCase();
  const [mccCodes, setMccCodes] = useState<MccCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMcc, setEditingMcc] = useState<MccCode | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMcc, setNewMcc] = useState({ mccCode: '', mccName: '', description: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchMccCodes();
  }, []);

  const fetchMccCodes = async () => {
    try {
      const data = await getMccs();
      const items = Array.isArray(data) ? data : (data.content || data.data || []);
      const sortedItems = [...items].sort((a: any, b: any) => b.id - a.id);
      setMccCodes(sortedItems);
    } catch (error) {
      console.error('Error fetching MCC codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateAddMcc = () => {
    const errors: Record<string, string> = {};

    const code = newMcc.mccCode.trim();
    if (!code) {
      errors.mccCode = "MCC Code is required";
    } else if (!/^\d{4}$/.test(code)) {
      errors.mccCode = "MCC Code must be exactly 4 numeric digits (e.g. 5411)";
    }

    const name = newMcc.mccName.trim();
    if (!name) {
      errors.mccName = "MCC Category Name is required";
    } else if (name.length < 2) {
      errors.mccName = "MCC Category Name must be at least 2 characters";
    } else if (name.length > 150) {
      errors.mccName = "MCC Category Name cannot exceed 150 characters";
    }

    if (newMcc.description && newMcc.description.trim().length > 255) {
      errors.description = "Description cannot exceed 255 characters";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = async () => {
    setFormError('');
    if (!validateAddMcc()) {
      setFormError("Please fix the highlighted errors before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const createdMcc = await createMcc({
        mccCode: newMcc.mccCode.trim(),
        mccName: newMcc.mccName.trim(),
        description: newMcc.description ? newMcc.description.trim() : null
      });
      setMccCodes([createdMcc, ...mccCodes]);
      setIsAddModalOpen(false);
      setNewMcc({ mccCode: '', mccName: '', description: '' });
      setFieldErrors({});
      setFormError('');

      window.dispatchEvent(new Event('refreshNotifications'));
      alert('MCC Code added successfully!');
    } catch (error: any) {
      console.error('Error adding MCC:', error);
      const backendError = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error';
      setFormError(backendError);

      if (backendError.toLowerCase().includes("mcc code")) {
        setFieldErrors(prev => ({ ...prev, mccCode: backendError }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (mcc: MccCode) => {
    setEditingMcc({ ...mcc });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMcc) return;

    try {
      await updateMcc(editingMcc.id, {
        mccCode: editingMcc.mccCode,
        mccName: editingMcc.mccName,
        description: editingMcc.description
      });

      setMccCodes(mccCodes.map(m => m.id === editingMcc.id ? editingMcc : m));
      setIsEditModalOpen(false);
      setEditingMcc(null);

      window.dispatchEvent(new Event('refreshNotifications'));
      alert('MCC Code updated successfully!');
    } catch (error) {
      console.error('Error updating MCC:', error);
      alert('Failed to update MCC details.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this MCC code?')) return;
    
    try {
      await deleteMcc(id);
      setMccCodes(mccCodes.filter(m => m.id !== id));

      window.dispatchEvent(new Event('refreshNotifications'));
      alert('MCC Code deleted successfully!');
    } catch (error) {
      console.error('Error deleting MCC:', error);
      alert('Failed to delete MCC code.');
    }
  };

  const filteredMccCodes = mccCodes.filter(mcc => 
    (mcc.mccCode && mcc.mccCode.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (mcc.mccName && mcc.mccName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('mcc.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('mcc.subtitle')}</p>
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
            {t('mcc.addMcc')}
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
            placeholder={t('mcc.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">{t('mcc.loading')}</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('mcc.colMccCode')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('mcc.category')}</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('common.status')}</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredMccCodes.map((mcc, index) => (
                 <tr key={mcc.id || index} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <Tag className="h-5 w-5" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{mcc.mccCode}</div>
                          <div className="text-sm text-slate-500 dark:text-slate-400">{mcc.mccName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900 dark:text-slate-200">{mcc.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        mcc.status === 'ACTIVE' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
                      }`}>
                        {mcc.status === 'ACTIVE' ? t('common.active') : mcc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {userRole === 'ADMIN' && (
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => openEditModal(mcc)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title={t('common.edit')}>
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(mcc.id)}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title={t('common.delete')}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredMccCodes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                      {t('mcc.noMcc')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add New MCC Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('mcc.modalAddTitle')}</h2>
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setNewMcc({ mccCode: '', mccName: '', description: '' });
                  setFieldErrors({});
                  setFormError('');
                }} 
                className="text-slate-400 hover:text-slate-600"
              >
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('mcc.code')} (4 digits) *</label>
                <input 
                  type="text" 
                  maxLength={4}
                  value={newMcc.mccCode} 
                  onChange={(e) => {
                    setNewMcc({...newMcc, mccCode: e.target.value});
                    if (fieldErrors.mccCode) setFieldErrors(prev => ({ ...prev, mccCode: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm outline-none transition-colors ${
                    fieldErrors.mccCode 
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                      : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500'
                  }`}
                  placeholder="e.g. 5814"
                />
                {fieldErrors.mccCode && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {fieldErrors.mccCode}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('mcc.category')} *</label>
                <input 
                  type="text" 
                  value={newMcc.mccName} 
                  onChange={(e) => {
                    setNewMcc({...newMcc, mccName: e.target.value});
                    if (fieldErrors.mccName) setFieldErrors(prev => ({ ...prev, mccName: '' }));
                  }}
                  className={`w-full px-3 py-2 border rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm outline-none transition-colors ${
                    fieldErrors.mccName 
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                      : 'border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500'
                  }`}
                  placeholder="e.g. Fast Food Restaurants"
                />
                {fieldErrors.mccName && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {fieldErrors.mccName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea 
                  rows={2}
                  value={newMcc.description} 
                  onChange={(e) => {
                    setNewMcc({...newMcc, description: e.target.value});
                    if (fieldErrors.description) setFieldErrors(prev => ({ ...prev, description: '' }));
                  }}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Optional details..."
                />
                {fieldErrors.description && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {fieldErrors.description}
                  </p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setNewMcc({ mccCode: '', mccName: '', description: '' });
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
                {t('mcc.createMcc')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit MCC Modal */}
      {isEditModalOpen && editingMcc && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('mcc.modalEditTitle')}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('mcc.code')} (4 digits)</label>
                <input 
                  type="text" 
                  value={editingMcc.mccCode} 
                  onChange={(e) => setEditingMcc({...editingMcc, mccCode: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('mcc.category')}</label>
                <input 
                  type="text" 
                  value={editingMcc.mccName} 
                  onChange={(e) => setEditingMcc({...editingMcc, mccName: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea 
                  rows={2}
                  value={editingMcc.description || ''} 
                  onChange={(e) => setEditingMcc({...editingMcc, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
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
                {t('mcc.saveChanges')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
