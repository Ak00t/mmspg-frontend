import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, 
  Plus, 
  Percent, 
  Calculator, 
  Edit3, 
  X, 
  Store, 
  Calendar, 
  ShieldAlert, 
  CheckCircle2, 
  TrendingUp, 
  Layers,
  AlertCircle
} from 'lucide-react';
import {
  getFeeConfigs,
  getMerchants,
  createFeeConfig,
  updateFeeConfig,
  calculateFee
} from '../../services/adminManagementApi';

export type FeeType = 'PERCENTAGE' | 'FLAT' | 'MIXED';
export type FeeStatus = 'ACTIVE' | 'INACTIVE';

export interface FeeConfig {
  feeId: string;
  merchantId: string;
  feeType: FeeType;
  percentageRate: number | null;
  flatFee: number | null;
  minimumFee: number;
  maximumFee: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: FeeStatus;
  createdAt: string;
  updatedAt: string | null;
}

export interface MerchantItem {
  id: string;
  merchantCode: string;
  businessName: string;
  email?: string;
  status?: string;
}

export interface CalculationResult {
  amount: number;
  feeAmount: number;
  netAmount: number;
}

export default function FeeConfiguration() {
  const { t } = useTranslation();
  const rawRole = (localStorage.getItem('userRole') || '').toUpperCase();
  const userRole = rawRole.startsWith('ROLE_') ? rawRole.substring(5) : rawRole;
  const isAuditor = userRole === 'AUDITOR' || userRole.includes('AUDITOR');

  const [feeConfigs, setFeeConfigs] = useState<FeeConfig[]>([]);
  const [merchants, setMerchants] = useState<MerchantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    merchantId: '',
    feeType: 'PERCENTAGE' as FeeType,
    percentageRate: '',
    flatFee: '',
    minimumFee: '0',
    maximumFee: '10000',
    effectiveFrom: new Date().toISOString().slice(0, 16),
    effectiveTo: ''
  });
  const [addError, setAddError] = useState<string | null>(null);
  const [addFieldErrors, setAddFieldErrors] = useState<Record<string, string>>({});

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeConfig | null>(null);
  const [editForm, setEditForm] = useState({
    feeType: 'PERCENTAGE' as FeeType,
    percentageRate: '',
    flatFee: '',
    minimumFee: '0',
    maximumFee: '10000',
    effectiveFrom: '',
    effectiveTo: ''
  });
  const [editError, setEditError] = useState<string | null>(null);

  // Calculator Modal State
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [calcFeeId, setCalcFeeId] = useState<string>('');
  const [calcAmount, setCalcAmount] = useState<string>('100000');
  const [calculating, setCalculating] = useState(false);
  const [calcResult, setCalcResult] = useState<CalculationResult | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [feesData, merchantsData] = await Promise.all([
        getFeeConfigs().catch(err => {
          console.error('Failed to load fee configs:', err);
          return [];
        }),
        getMerchants().catch(err => {
          console.error('Failed to load merchants:', err);
          return [];
        })
      ]);

      const feesList = Array.isArray(feesData) ? feesData : (feesData?.content || []);
      const merchantsList = Array.isArray(merchantsData) ? merchantsData : (merchantsData?.content || []);

      const sortedFees = [...feesList].sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || a.effectiveFrom || 0).getTime();
        const dateB = new Date(b.createdAt || b.effectiveFrom || 0).getTime();
        return dateB - dateA;
      });
      setFeeConfigs(sortedFees);
      setMerchants(merchantsList);
    } catch (error) {
      console.error('Error loading fee configuration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMerchantName = (merchantId: string): string => {
    const found = merchants.find(m => m.id === merchantId);
    return found ? found.businessName : `Merchant #${merchantId.substring(0, 8)}`;
  };

  const getMerchantCode = (merchantId: string): string => {
    const found = merchants.find(m => m.id === merchantId);
    return found?.merchantCode || '';
  };

  const formatCurrency = (val: number | string | null | undefined): string => {
    if (val === null || val === undefined || val === '') return '0 MMK';
    const num = Number(val);
    return isNaN(num) ? '0 MMK' : `${num.toLocaleString()} MMK`;
  };

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Status check for effective dates
  const getEffectiveStatus = (fromStr: string, toStr: string | null) => {
    const now = new Date().getTime();
    const from = new Date(fromStr).getTime();
    const to = toStr ? new Date(toStr).getTime() : null;

    if (now < from) {
      return { label: 'Scheduled', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' };
    }
    if (to && now > to) {
      return { label: 'Expired', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300' };
    }
    return { label: 'Active Period', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' };
  };

  // Handle Add Fee Config
  const handleOpenAddModal = () => {
    setAddError(null);
    setAddFieldErrors({});
    setAddForm({
      merchantId: merchants.length > 0 ? merchants[0].id : '',
      feeType: 'PERCENTAGE',
      percentageRate: '1.5',
      flatFee: '0',
      minimumFee: '100',
      maximumFee: '10000',
      effectiveFrom: new Date().toISOString().slice(0, 16),
      effectiveTo: ''
    });
    setIsAddModalOpen(true);
  };

  const validateAddForm = () => {
    const errors: Record<string, string> = {};

    if (!addForm.merchantId) {
      errors.merchantId = 'Please select a merchant.';
    }

    const minFee = Number(addForm.minimumFee);
    const maxFee = Number(addForm.maximumFee);

    if (addForm.minimumFee === '' || isNaN(minFee) || minFee < 0) {
      errors.minimumFee = 'Minimum fee must be 0 or greater.';
    }

    if (addForm.maximumFee === '' || isNaN(maxFee) || maxFee < 0) {
      errors.maximumFee = 'Maximum fee must be 0 or greater.';
    }

    if (!isNaN(minFee) && !isNaN(maxFee) && minFee > maxFee) {
      errors.minimumFee = 'Minimum fee cannot exceed maximum fee.';
      errors.maximumFee = 'Maximum fee must be greater than or equal to minimum fee.';
    }

    if (addForm.feeType === 'PERCENTAGE' || addForm.feeType === 'MIXED') {
      const rate = Number(addForm.percentageRate);
      if (addForm.percentageRate === '' || isNaN(rate) || rate < 0 || rate > 100) {
        errors.percentageRate = 'Percentage rate must be between 0 and 100%.';
      }
    }

    if (addForm.feeType === 'FLAT' || addForm.feeType === 'MIXED') {
      const flat = Number(addForm.flatFee);
      if (addForm.flatFee === '' || isNaN(flat) || flat < 0) {
        errors.flatFee = 'Flat fee must be 0 or greater.';
      }
    }

    if (!addForm.effectiveFrom) {
      errors.effectiveFrom = 'Effective from date is required.';
    }

    if (addForm.effectiveTo && addForm.effectiveFrom && new Date(addForm.effectiveTo) <= new Date(addForm.effectiveFrom)) {
      errors.effectiveTo = 'Effective to must be after Effective from date.';
    }

    setAddFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!validateAddForm()) {
      setAddError('Please correct the highlighted errors before submitting.');
      return;
    }

    const minFee = Number(addForm.minimumFee);
    const maxFee = Number(addForm.maximumFee);

    const payload: any = {
      merchantId: addForm.merchantId,
      feeType: addForm.feeType,
      minimumFee: minFee,
      maximumFee: maxFee,
      effectiveFrom: addForm.effectiveFrom.length === 16 ? `${addForm.effectiveFrom}:00` : addForm.effectiveFrom,
      effectiveTo: addForm.effectiveTo ? (addForm.effectiveTo.length === 16 ? `${addForm.effectiveTo}:00` : addForm.effectiveTo) : null
    };

    if (addForm.feeType === 'PERCENTAGE') {
      payload.percentageRate = Number(addForm.percentageRate);
      payload.flatFee = 0;
    } else if (addForm.feeType === 'FLAT') {
      payload.percentageRate = 0;
      payload.flatFee = Number(addForm.flatFee);
    } else {
      payload.percentageRate = Number(addForm.percentageRate);
      payload.flatFee = Number(addForm.flatFee);
    }

    setSubmittingAdd(true);
    try {
      const created = await createFeeConfig(payload);
      setFeeConfigs([created, ...feeConfigs]);
      setIsAddModalOpen(false);
      setAddFieldErrors({});
      window.dispatchEvent(new Event('refreshNotifications'));
      alert('Fee configuration created successfully!');
    } catch (err: any) {
      console.error('Failed to create fee config:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to save fee configuration.';
      setAddError(msg);
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Handle Edit Fee Config
  const handleOpenEditModal = (fee: FeeConfig) => {
    setEditError(null);
    setEditingFee(fee);
    setEditForm({
      feeType: fee.feeType,
      percentageRate: fee.percentageRate !== null ? String(fee.percentageRate) : '',
      flatFee: fee.flatFee !== null ? String(fee.flatFee) : '',
      minimumFee: String(fee.minimumFee || 0),
      maximumFee: String(fee.maximumFee || 0),
      effectiveFrom: fee.effectiveFrom ? fee.effectiveFrom.slice(0, 16) : '',
      effectiveTo: fee.effectiveTo ? fee.effectiveTo.slice(0, 16) : ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFee) return;
    setEditError(null);

    const minFee = Number(editForm.minimumFee);
    const maxFee = Number(editForm.maximumFee);
    if (isNaN(minFee) || minFee < 0) {
      setEditError('Minimum fee must be 0 or greater.');
      return;
    }
    if (isNaN(maxFee) || maxFee < 0) {
      setEditError('Maximum fee must be 0 or greater.');
      return;
    }
    if (minFee > maxFee) {
      setEditError('Minimum fee cannot exceed maximum fee.');
      return;
    }

    if (!editForm.effectiveFrom) {
      setEditError('Effective from date is required.');
      return;
    }

    if (editForm.effectiveTo && new Date(editForm.effectiveTo) <= new Date(editForm.effectiveFrom)) {
      setEditError('Effective to must be after Effective from.');
      return;
    }

    const payload: any = {
      merchantId: editingFee.merchantId,
      feeType: editForm.feeType,
      minimumFee: minFee,
      maximumFee: maxFee,
      effectiveFrom: editForm.effectiveFrom.length === 16 ? `${editForm.effectiveFrom}:00` : editForm.effectiveFrom,
      effectiveTo: editForm.effectiveTo ? (editForm.effectiveTo.length === 16 ? `${editForm.effectiveTo}:00` : editForm.effectiveTo) : null
    };

    if (editForm.feeType === 'PERCENTAGE') {
      payload.percentageRate = Number(editForm.percentageRate);
      payload.flatFee = 0;
    } else if (editForm.feeType === 'FLAT') {
      payload.percentageRate = 0;
      payload.flatFee = Number(editForm.flatFee);
    } else {
      payload.percentageRate = Number(editForm.percentageRate);
      payload.flatFee = Number(editForm.flatFee);
    }

    setSubmittingEdit(true);
    try {
      const updated = await updateFeeConfig(editingFee.feeId, payload);
      setFeeConfigs(feeConfigs.map(f => f.feeId === editingFee.feeId ? updated : f));
      setIsEditModalOpen(false);
      setEditingFee(null);
      window.dispatchEvent(new Event('refreshNotifications'));
      alert('Fee configuration updated successfully!');
    } catch (err: any) {
      console.error('Failed to update fee config:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to update fee configuration.';
      setEditError(msg);
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Handle Calculator
  const handleOpenCalculator = (preselectedFeeId?: string) => {
    setCalcError(null);
    setCalcResult(null);
    if (preselectedFeeId) {
      setCalcFeeId(preselectedFeeId);
    } else if (feeConfigs.length > 0 && !calcFeeId) {
      setCalcFeeId(feeConfigs[0].feeId);
    }
    setIsCalcModalOpen(true);
  };

  const handleCalculateFee = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCalcError(null);

    if (!calcFeeId) {
      setCalcError('Please select a fee rule.');
      return;
    }

    const amt = Number(calcAmount);
    if (isNaN(amt) || amt <= 0) {
      setCalcError('Transaction amount must be greater than zero.');
      return;
    }

    setCalculating(true);
    try {
      const res = await calculateFee(calcFeeId, amt);
      setCalcResult(res);
    } catch (err: any) {
      console.error('Fee calculation failed:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Calculation failed.';
      setCalcError(msg);
    } finally {
      setCalculating(false);
    }
  };

  // Filtered List
  const filteredConfigs = feeConfigs.filter(fee => {
    const merchantName = getMerchantName(fee.merchantId).toLowerCase();
    const merchantCode = getMerchantCode(fee.merchantId).toLowerCase();
    const matchesSearch = 
      merchantName.includes(searchTerm.toLowerCase()) || 
      merchantCode.includes(searchTerm.toLowerCase()) ||
      fee.feeType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedTypeFilter === 'ALL' || fee.feeType === selectedTypeFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || fee.status === selectedStatusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Summary counts
  const totalCount = feeConfigs.length;
  const activeCount = feeConfigs.filter(f => f.status === 'ACTIVE').length;
  const percentageCount = feeConfigs.filter(f => f.feeType === 'PERCENTAGE').length;
  const flatMixedCount = feeConfigs.filter(f => f.feeType === 'FLAT' || f.feeType === 'MIXED').length;

  return (
    <div className="space-y-6 relative">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2.5">
            <Percent className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            {t('fees.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('fees.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenCalculator()}
            className="flex items-center px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Calculator className="h-4 w-4 mr-2 text-indigo-500" />
            {t('fees.calculatorTitle')}
          </button>

          {!isAuditor && userRole === 'ADMIN' && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('fees.addFeeConfig')}
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">{t('fees.totalRules')}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">{t('fees.activeRules')}</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <Percent className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">{t('fees.percentageRules')}</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{percentageCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">{t('fees.flatMixedRules')}</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{flatMixedCount}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition-colors"
            placeholder={t('fees.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Fee Type Filter */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Fee Types</option>
            <option value="PERCENTAGE">PERCENTAGE</option>
            <option value="FLAT">FLAT</option>
            <option value="MIXED">MIXED</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
              <p className="text-sm">{t('fees.loading')}</p>
            </div>
          ) : filteredConfigs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <Store className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-base font-semibold">{t('fees.noFees')}</p>
              <p className="text-xs mt-1 text-slate-400">Try adjusting your search criteria or add a new fee rule.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('fees.colMerchant')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('fees.colFeeType')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Rate / Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('fees.colCaps')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('fees.colEffective')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('common.status')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredConfigs.map((fee) => {
                  const effectiveState = getEffectiveStatus(fee.effectiveFrom, fee.effectiveTo);
                  return (
                    <tr key={fee.feeId} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                      {/* Merchant Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 font-bold text-sm">
                            <Store className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900 dark:text-white">
                              {getMerchantName(fee.merchantId)}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              {getMerchantCode(fee.merchantId) || fee.merchantId.substring(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Fee Type Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            fee.feeType === 'PERCENTAGE'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : fee.feeType === 'FLAT'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                          }`}
                        >
                          {fee.feeType}
                        </span>
                      </td>

                      {/* Rate / Amount Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-200">
                        {fee.feeType === 'PERCENTAGE' && (
                          <div className="font-semibold text-blue-600 dark:text-blue-400">
                            {fee.percentageRate !== null ? `${fee.percentageRate}%` : '-'}
                          </div>
                        )}
                        {fee.feeType === 'FLAT' && (
                          <div className="font-semibold text-purple-600 dark:text-purple-400">
                            {formatCurrency(fee.flatFee)}
                          </div>
                        )}
                        {fee.feeType === 'MIXED' && (
                          <div className="text-xs font-semibold">
                            <span className="text-blue-600 dark:text-blue-400">{fee.percentageRate}%</span>
                            <span className="text-slate-400 mx-1">+</span>
                            <span className="text-purple-600 dark:text-purple-400">{formatCurrency(fee.flatFee)}</span>
                          </div>
                        )}
                      </td>

                      {/* Caps Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-300">
                        <div>Min: <span className="font-semibold text-slate-800 dark:text-white">{formatCurrency(fee.minimumFee)}</span></div>
                        <div>Max: <span className="font-semibold text-slate-800 dark:text-white">{formatCurrency(fee.maximumFee)}</span></div>
                      </td>

                      {/* Effective Period Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          <span>{formatDate(fee.effectiveFrom)}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          to {fee.effectiveTo ? formatDate(fee.effectiveTo) : 'Indefinite'}
                        </div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium ${effectiveState.color}`}>
                          {effectiveState.label}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            fee.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
                          }`}
                        >
                          {fee.status}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenCalculator(fee.feeId)}
                            className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                            title={t('fees.testCalc')}
                          >
                            <Calculator className="h-4 w-4" />
                          </button>

                          {!isAuditor && userRole === 'ADMIN' && (
                            <button
                              onClick={() => handleOpenEditModal(fee)}
                              className="p-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* ADD FEE CONFIGURATION MODAL */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                  {t('fees.modalAddTitle')}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setAddFieldErrors({});
                  setAddError(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {addError && (
                <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              {/* Merchant Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  {t('fees.selectMerchant')} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={addForm.merchantId}
                  onChange={(e) => {
                    setAddForm({ ...addForm, merchantId: e.target.value });
                    if (addFieldErrors.merchantId) setAddFieldErrors(prev => ({ ...prev, merchantId: '' }));
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-lg border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-colors ${
                    addFieldErrors.merchantId 
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                      : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
                  }`}
                >
                  <option value="">-- Choose Merchant --</option>
  {merchants.map((m: any) => (
    <option key={m.id} value={m.merchantId || m.id}>
      {m.businessName} ({m.merchantCode})
    </option>
  ))}
                </select>
                {addFieldErrors.merchantId && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    {addFieldErrors.merchantId}
                  </p>
                )}
              </div>

              {/* Fee Type Radio Pills */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1.5">
                  {t('fees.colFeeType')} <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PERCENTAGE', 'FLAT', 'MIXED'] as FeeType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAddForm({ ...addForm, feeType: type })}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                        addForm.feeType === type
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rate & Flat Fee inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(addForm.feeType === 'PERCENTAGE' || addForm.feeType === 'MIXED') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      {t('fees.percentageRate')} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        placeholder="e.g. 1.50"
                        value={addForm.percentageRate}
                        onChange={(e) => {
                          setAddForm({ ...addForm, percentageRate: e.target.value });
                          if (addFieldErrors.percentageRate) setAddFieldErrors(prev => ({ ...prev, percentageRate: '' }));
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-lg border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-colors ${
                          addFieldErrors.percentageRate 
                            ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                            : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
                        }`}
                      />
                      <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-sm">%</span>
                    </div>
                    {addFieldErrors.percentageRate && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        {addFieldErrors.percentageRate}
                      </p>
                    )}
                  </div>
                )}

                {(addForm.feeType === 'FLAT' || addForm.feeType === 'MIXED') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      {t('fees.flatFee')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="e.g. 500"
                      value={addForm.flatFee}
                      onChange={(e) => {
                        setAddForm({ ...addForm, flatFee: e.target.value });
                        if (addFieldErrors.flatFee) setAddFieldErrors(prev => ({ ...prev, flatFee: '' }));
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-lg border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-colors ${
                        addFieldErrors.flatFee 
                          ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                          : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
                      }`}
                    />
                    {addFieldErrors.flatFee && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        {addFieldErrors.flatFee}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Min & Max Fee caps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    {t('fees.minimumFee')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={addForm.minimumFee}
                    onChange={(e) => {
                      setAddForm({ ...addForm, minimumFee: e.target.value });
                      if (addFieldErrors.minimumFee) setAddFieldErrors(prev => ({ ...prev, minimumFee: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-lg border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-colors ${
                      addFieldErrors.minimumFee 
                        ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                        : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {addFieldErrors.minimumFee && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 flex-shrink-0" />
                      {addFieldErrors.minimumFee}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    {t('fees.maximumFee')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="e.g. 50000"
                    value={addForm.maximumFee}
                    onChange={(e) => {
                      setAddForm({ ...addForm, maximumFee: e.target.value });
                      if (addFieldErrors.maximumFee) setAddFieldErrors(prev => ({ ...prev, maximumFee: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-lg border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-colors ${
                      addFieldErrors.maximumFee 
                        ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                        : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {addFieldErrors.maximumFee && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 flex-shrink-0" />
                      {addFieldErrors.maximumFee}
                    </p>
                  )}
                </div>
              </div>

              {/* Effective Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    {t('fees.effectiveFrom')} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={addForm.effectiveFrom}
                    onChange={(e) => {
                      setAddForm({ ...addForm, effectiveFrom: e.target.value });
                      if (addFieldErrors.effectiveFrom) setAddFieldErrors(prev => ({ ...prev, effectiveFrom: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-lg border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-colors ${
                      addFieldErrors.effectiveFrom 
                        ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                        : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {addFieldErrors.effectiveFrom && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 flex-shrink-0" />
                      {addFieldErrors.effectiveFrom}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    {t('fees.effectiveTo')}
                  </label>
                  <input
                    type="datetime-local"
                    value={addForm.effectiveTo}
                    onChange={(e) => {
                      setAddForm({ ...addForm, effectiveTo: e.target.value });
                      if (addFieldErrors.effectiveTo) setAddFieldErrors(prev => ({ ...prev, effectiveTo: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-lg border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none transition-colors ${
                      addFieldErrors.effectiveTo 
                        ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                        : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  {addFieldErrors.effectiveTo && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 flex-shrink-0" />
                      {addFieldErrors.effectiveTo}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setAddFieldErrors({});
                    setAddError(null);
                  }}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2"
                >
                  {submittingAdd && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {t('fees.createFee')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT FEE CONFIGURATION MODAL */}
      {/* ========================================================= */}
      {isEditModalOpen && editingFee && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                  {t('fees.modalEditTitle')}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Merchant Display (read only) */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="text-xs uppercase text-slate-400 font-bold block mb-0.5">Merchant</span>
                <span className="text-sm font-semibold text-slate-800 dark:text-white">
                  {getMerchantName(editingFee.merchantId)} ({getMerchantCode(editingFee.merchantId)})
                </span>
              </div>

              {/* Fee Type Radio Pills */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1.5">
                  {t('fees.colFeeType')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PERCENTAGE', 'FLAT', 'MIXED'] as FeeType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, feeType: type })}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all text-center ${
                        editForm.feeType === type
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rate & Flat Fee inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(editForm.feeType === 'PERCENTAGE' || editForm.feeType === 'MIXED') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      {t('fees.percentageRate')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={editForm.percentageRate}
                        onChange={(e) => setEditForm({ ...editForm, percentageRate: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-sm">%</span>
                    </div>
                  </div>
                )}

                {(editForm.feeType === 'FLAT' || editForm.feeType === 'MIXED') && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                      {t('fees.flatFee')}
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={editForm.flatFee}
                      onChange={(e) => setEditForm({ ...editForm, flatFee: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Min & Max Fee caps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    {t('fees.minimumFee')}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={editForm.minimumFee}
                    onChange={(e) => setEditForm({ ...editForm, minimumFee: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    {t('fees.maximumFee')}
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={editForm.maximumFee}
                    onChange={(e) => setEditForm({ ...editForm, maximumFee: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Effective Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    {t('fees.effectiveFrom')}
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.effectiveFrom}
                    onChange={(e) => setEditForm({ ...editForm, effectiveFrom: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                    {t('fees.effectiveTo')}
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.effectiveTo}
                    onChange={(e) => setEditForm({ ...editForm, effectiveTo: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2"
                >
                  {submittingEdit && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {t('fees.saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* INTERACTIVE FEE CALCULATOR MODAL */}
      {/* ========================================================= */}
      {isCalcModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-indigo-50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                  {t('fees.calculatorTitle')}
                </h3>
              </div>
              <button
                onClick={() => setIsCalcModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {calcError && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{calcError}</span>
                </div>
              )}

              {/* Fee Rule Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  Select Fee Rule
                </label>
                <select
                  value={calcFeeId}
                  onChange={(e) => {
                    setCalcFeeId(e.target.value);
                    setCalcResult(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Choose a Fee Configuration --</option>
                  {feeConfigs.map((f) => (
                    <option key={f.feeId} value={f.feeId}>
                      {getMerchantName(f.merchantId)} ({f.feeType}: {f.feeType === 'PERCENTAGE' ? `${f.percentageRate}%` : f.feeType === 'FLAT' ? `${f.flatFee} MMK` : `${f.percentageRate}% + ${f.flatFee} MMK`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Transaction Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase mb-1">
                  {t('fees.calcTxnAmount')}
                </label>
                <input
                  type="number"
                  step="1000"
                  min="1"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  placeholder="e.g. 100000"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-base font-semibold"
                />

                {/* Quick Add Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[10000, 50000, 100000, 500000, 1000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCalcAmount(String(amt))}
                      className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      +{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculate Button */}
              <button
                type="button"
                onClick={() => handleCalculateFee()}
                disabled={calculating || !calcFeeId}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {calculating ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Calculator className="h-4 w-4" />
                )}
                {t('fees.calculateBtn')}
              </button>

              {/* Calculation Results Card */}
              {calcResult && (
                <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                  <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                    Calculation Summary
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span>Transaction Amount:</span>
                      <span className="font-semibold text-slate-900 dark:text-white font-mono">
                        {formatCurrency(calcResult.amount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                      <span>{t('fees.feeAmount')} (-):</span>
                      <span className="font-bold font-mono">
                        {formatCurrency(calcResult.feeAmount)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-base font-bold text-emerald-600 dark:text-emerald-400">
                      <span>{t('fees.netPayout')} (=):</span>
                      <span className="font-mono text-lg">
                        {formatCurrency(calcResult.netAmount)}
                      </span>
                    </div>

                    {calcResult.amount > 0 && (
                      <div className="text-right text-xs text-slate-400 pt-1">
                        Effective Fee Rate: <span className="font-semibold text-slate-600 dark:text-slate-300">
                          {((calcResult.feeAmount / calcResult.amount) * 100).toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCalcModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
