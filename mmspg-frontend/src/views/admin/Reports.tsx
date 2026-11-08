import { useState, useEffect } from 'react'
import {
  FileText,
  FileSpreadsheet,
  Download,
  Loader2,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
  Building2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  downloadAdminSalesLedger,
  downloadAdminSettlements,
  type ReportFormat,
} from '../../services/adminReportApi'
import { getMerchants } from '../../services/adminManagementApi'
import { formatLocalDate } from '../../utils/formatDate'

interface MerchantOption {
  merchantId: string
  merchantCode?: string
  merchantName?: string
  email?: string
}

export default function AdminReports() {
  const { i18n } = useTranslation()
  const isMy = i18n.language === 'my'

  const today = formatLocalDate(new Date())
  const firstDayOfMonth = formatLocalDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

  const [reportType, setReportType] = useState<'sales-ledger' | 'settlements'>('sales-ledger')
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('ALL')
  const [merchants, setMerchants] = useState<MerchantOption[]>([])
  const [loadingMerchants, setLoadingMerchants] = useState(false)

  const [startDate, setStartDate] = useState(firstDayOfMonth)
  const [endDate, setEndDate] = useState(today)
  const [status, setStatus] = useState('ALL')
  const [downloadingFormat, setDownloadingFormat] = useState<ReportFormat | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    async function fetchMerchantList() {
      setLoadingMerchants(true)
      try {
        const data = await getMerchants()
        if (Array.isArray(data)) {
          setMerchants(data)
        }
      } catch (err) {
        console.error('Failed to load merchants list for reporting:', err)
      } finally {
        setLoadingMerchants(false)
      }
    }
    fetchMerchantList()
  }, [])

  const SALES_LEDGER_STATUSES = [
    { value: 'ALL', label: isMy ? 'ALL (အခြေအနေ အားလုံး)' : 'ALL (All Statuses)' },
    { value: 'INITIATED', label: isMy ? 'INITIATED (စတင်ဆောင်ရွက်ဆဲ)' : 'INITIATED' },
    { value: 'COMPLETED', label: isMy ? 'COMPLETED (အောင်မြင်သည်)' : 'COMPLETED' },
    { value: 'FAILED', label: isMy ? 'FAILED (မအောင်မြင်ပါ)' : 'FAILED' },
  ]

  const SETTLEMENT_STATUSES = [
    { value: 'ALL', label: isMy ? 'ALL (အခြေအနေ အားလုံး)' : 'ALL (All Statuses)' },
    { value: 'PENDING', label: isMy ? 'PENDING (ဆိုင်းငံ့)' : 'PENDING' },
    { value: 'PROCESSING', label: isMy ? 'PROCESSING (လုပ်ဆောင်ဆဲ)' : 'PROCESSING' },
    { value: 'COMPLETED', label: isMy ? 'COMPLETED (အောင်မြင်သည်)' : 'COMPLETED' },
    { value: 'FAILED', label: isMy ? 'FAILED (မအောင်မြင်ပါ)' : 'FAILED' },
  ]

  const handleReportTypeChange = (type: 'sales-ledger' | 'settlements') => {
    setReportType(type)
    setStatus('ALL')
    setMessage(null)
  }

  const handleDownload = async (format: ReportFormat) => {
    if (!startDate || !endDate) {
      setMessage({
        type: 'error',
        text: isMy ? 'စတင်ရက်နှင့် ပြီးဆုံးရက်ကို ရွေးချယ်ပါ' : 'Please select both start and end dates.',
      })
      return
    }
    if (startDate > endDate) {
      setMessage({
        type: 'error',
        text: isMy ? 'စတင်ရက်သည် ပြီးဆုံးရက်ထက် မကျော်လွန်ရပါ' : 'Start date cannot be after end date.',
      })
      return
    }

    setDownloadingFormat(format)
    setMessage(null)

    try {
      if (reportType === 'sales-ledger') {
        await downloadAdminSalesLedger(startDate, endDate, format, selectedMerchantId, status)
      } else {
        await downloadAdminSettlements(startDate, endDate, format, selectedMerchantId, status)
      }
      setMessage({
        type: 'success',
        text: isMy
          ? `အစီရင်ခံစာ (${format.toUpperCase()}) အောင်မြင်စွာ ဒေါင်းလုဒ်ဆွဲပြီးပါပြီ!`
          : `Report (${format.toUpperCase()}) exported successfully!`,
      })
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        (isMy ? 'အစီရင်ခံစာ ထုတ်ယူ၍မရပါ။ ထပ်မံကြိုးစားကြည့်ပါ' : 'Failed to export report. Please try again.')
      setMessage({ type: 'error', text: errMsg })
    } finally {
      setDownloadingFormat(null)
    }
  }

  const statusOptions =
    reportType === 'sales-ledger' ? SALES_LEDGER_STATUSES : SETTLEMENT_STATUSES

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {isMy ? 'စနစ်တစ်ခုလုံးဆိုင်ရာ အစီရင်ခံစာများ' : 'System-Wide Reports & Statements'}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {isMy
            ? 'ကုန်သည်အားလုံး (သို့မဟုတ်) သီးသန့် ကုန်သည်အလိုက် Sales Ledger နှင့် Settlement အစီရင်ခံစာများကို PDF, Excel, CSV ဖြင့် ထုတ်ယူနိုင်ပါသည်။'
            : 'Generate and download official Sales Ledger transactions and Settlement payout records for all merchants or specific merchants in PDF, Excel (.xlsx), or CSV.'}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-6 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-700 pb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {isMy ? 'အစီရင်ခံစာများ စစ်ထုတ်ထုတ်ယူရန်' : 'Export Reports & Statements'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isMy
                ? 'Merchant, ကာလအပိုင်းအခြား နှင့် Status အလိုက် လိုအပ်သော အစီရင်ခံစာ ပုံစံကို ရွေးချယ်ပါ'
                : 'Select merchant scope, date range, and status to export comprehensive statements.'}
            </p>
          </div>

          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-700/50 p-1 self-start sm:self-auto">
            <button
              type="button"
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                reportType === 'sales-ledger'
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => handleReportTypeChange('sales-ledger')}
            >
              {isMy ? 'အရောင်းစာရင်း (Sales Ledger)' : 'Sales Ledger'}
            </button>
            <button
              type="button"
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                reportType === 'settlements'
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => handleReportTypeChange('settlements')}
            >
              {isMy ? 'စာရင်းရှင်းတမ်း (Settlements)' : 'Settlements'}
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mt-5 flex items-center gap-3 rounded-xl p-4 text-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Merchant Filter */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              {isMy ? 'ကုန်သည် (Merchant Scope)' : 'Merchant Scope'}
            </label>
            <select
              value={selectedMerchantId}
              onChange={(e) => setSelectedMerchantId(e.target.value)}
              disabled={loadingMerchants}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/50 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">⭐ ALL MERCHANTS</option>
              {merchants.map((m) => (
                <option key={m.merchantId} value={m.merchantId}>
                  {m.merchantCode ? `[${m.merchantCode}] ` : ''}
                  {m.merchantName || m.email}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {isMy ? 'စတင်ရက် (Start Date)' : 'Start Date'}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/50 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {isMy ? 'ပြီးဆုံးရက် (End Date)' : 'End Date'}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/50 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              {isMy ? 'အခြေအနေ (Status)' : 'Status'}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700/50 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-100 dark:border-slate-700 pt-5">
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 mr-2">
            {isMy ? 'ဒေါင်းလုဒ် ပုံစံ ရွေးချယ်ရန်:' : 'Export Formats:'}
          </span>

          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownload('pdf')}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-indigo-700 active:scale-95 disabled:pointer-events-none disabled:opacity-60 shadow-xs"
          >
            {downloadingFormat === 'pdf' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            <span>PDF {isMy ? 'ထုတ်ယူရန်' : 'Export'}</span>
          </button>

          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownload('xlsx')}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-emerald-700 active:scale-95 disabled:pointer-events-none disabled:opacity-60 shadow-xs"
          >
            {downloadingFormat === 'xlsx' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span>Excel (.xlsx) {isMy ? 'ထုတ်ယူရန်' : 'Export'}</span>
          </button>

          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownload('csv')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-50 dark:hover:bg-slate-600 active:scale-95 disabled:pointer-events-none disabled:opacity-60 shadow-xs"
          >
            {downloadingFormat === 'csv' ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
            ) : (
              <Download className="h-4 w-4 text-slate-500" />
            )}
            <span>CSV {isMy ? 'ထုတ်ယူရန်' : 'Export'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
