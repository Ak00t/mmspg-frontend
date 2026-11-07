import { useState } from 'react'
import {
  FileText,
  FileSpreadsheet,
  Download,
  Loader2,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  downloadSalesLedger,
  downloadSettlements,
  type ReportFormat,
} from '../api/merchantReportApi'
import { formatLocalDate } from '../../../utils/formatDate'

export function MerchantReportExport() {
  const { i18n } = useTranslation();
  const isMy = i18n.language === 'my';

  const today = formatLocalDate(new Date())
  const firstDayOfMonth = formatLocalDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))

  const [reportType, setReportType] = useState<'sales-ledger' | 'settlements'>('sales-ledger')
  const [startDate, setStartDate] = useState(firstDayOfMonth)
  const [endDate, setEndDate] = useState(today)
  const [status, setStatus] = useState('ALL')
  const [downloadingFormat, setDownloadingFormat] = useState<ReportFormat | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const SALES_LEDGER_STATUSES = [
    { value: 'ALL', label: isMy ? 'ALL (အခြေအနေ အားလုံး)' : 'ALL' },
    { value: 'INITIATED', label: isMy ? 'INITIATED (စတင်ဆောင်ရွက်ဆဲ)' : 'INITIATED' },
    { value: 'COMPLETED', label: isMy ? 'COMPLETED (အောင်မြင်သည်)' : 'COMPLETED' },
    { value: 'FAILED', label: isMy ? 'FAILED (မအောင်မြင်ပါ)' : 'FAILED' },
  ]

  const SETTLEMENT_STATUSES = [
    { value: 'ALL', label: isMy ? 'ALL (အခြေအနေ အားလုံး)' : 'ALL' },
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
      setMessage({ type: 'error', text: isMy ? 'စတင်ရက်နှင့် ပြီးဆုံးရက်ကို ရွေးချယ်ပါ' : 'Please select both start and end dates.' })
      return
    }
    if (startDate > endDate) {
      setMessage({ type: 'error', text: isMy ? 'စတင်ရက်သည် ပြီးဆုံးရက်ထက် မကျော်လွန်ရပါ' : 'Start date cannot be after end date.' })
      return
    }

    setDownloadingFormat(format)
    setMessage(null)

    try {
      if (reportType === 'sales-ledger') {
        await downloadSalesLedger(startDate, endDate, format, status)
      } else {
        await downloadSettlements(startDate, endDate, format, status)
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
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-6 shadow-xs">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-700 pb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isMy ? 'အစီရင်ခံစာများနှင့် စာရင်းရှင်းတမ်းများ' : 'Reports & Statements'}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isMy
              ? 'အရောင်းစာရင်းနှင့် ငွေချေမှု မှတ်တမ်းများကို လိုအပ်သလို အခြေအနေအလိုက် စစ်ထုတ်၍ ထုတ်ယူပါ'
              : 'Export comprehensive sales ledger and settlement reports with status filtering.'}
          </p>
        </div>
        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-700 p-1">
          <button
            type="button"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
              reportType === 'sales-ledger'
                ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
            onClick={() => handleReportTypeChange('sales-ledger')}
          >
            {isMy ? 'အရောင်းစာရင်း' : 'Sales Ledger'}
          </button>
          <button
            type="button"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
              reportType === 'settlements'
                ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
            onClick={() => handleReportTypeChange('settlements')}
          >
            {isMy ? 'ငွေချေမှုများ' : 'Settlements'}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mt-4 flex items-center gap-3 rounded-xl p-3.5 text-sm ${
            message.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {/* Start Date */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-slate-500" /> {isMy ? 'စတင်ရက်' : 'Start Date'}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none ring-indigo-200 transition focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-4"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Calendar className="h-3.5 w-3.5 text-slate-500" /> {isMy ? 'ပြီးဆုံးရက်' : 'End Date'}
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none ring-indigo-200 transition focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-4"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Filter className="h-3.5 w-3.5 text-indigo-600" /> {isMy ? 'အခြေအနေ စစ်ထုတ်မှု' : 'Status Filter'}
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none ring-indigo-200 transition focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 focus:ring-4"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Export Action Buttons */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-700 pt-5">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {isMy ? 'ရွေးချယ်ထားသော စာရင်း:' : 'Selected:'}{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {reportType === 'sales-ledger' ? (isMy ? 'အရောင်းစာရင်း' : 'Sales Ledger') : (isMy ? 'ငွေချေမှုများ' : 'Settlements')}
          </span>{' '}
          | {isMy ? 'အခြေအနေ:' : 'Status:'}{' '}
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{status}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export PDF */}
          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownload('pdf')}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {downloadingFormat === 'pdf' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            <span>{isMy ? 'PDF ထုတ်ယူမည်' : 'Export PDF'}</span>
          </button>

          {/* Export Excel */}
          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownload('xlsx')}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 text-sm font-semibold text-emerald-800 dark:text-emerald-300 shadow-xs transition hover:bg-emerald-100 dark:hover:bg-emerald-900/60 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {downloadingFormat === 'xlsx' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span>{isMy ? 'Excel ထုတ်ယူမည်' : 'Export Excel'}</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownload('csv')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-xs transition hover:bg-slate-50 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {downloadingFormat === 'csv' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>{isMy ? 'CSV ထုတ်ယူမည်' : 'Export CSV'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
