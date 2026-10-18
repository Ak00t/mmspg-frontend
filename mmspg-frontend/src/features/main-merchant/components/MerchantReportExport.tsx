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
import {
  downloadSalesLedger,
  downloadSettlements,
  type ReportFormat,
} from '../api/merchantReportApi'

const SALES_LEDGER_STATUSES = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'PENDING_AUTHORIZATION', label: 'Pending Authorization' },
  { value: 'INITIATED', label: 'Initiated' },
]

const SETTLEMENT_STATUSES = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
]

export function MerchantReportExport() {
  const today = new Date().toISOString().slice(0, 10)
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10)

  const [reportType, setReportType] = useState<'sales-ledger' | 'settlements'>('sales-ledger')
  const [startDate, setStartDate] = useState(firstDayOfMonth)
  const [endDate, setEndDate] = useState(today)
  const [status, setStatus] = useState('ALL')
  const [downloadingFormat, setDownloadingFormat] = useState<ReportFormat | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleReportTypeChange = (type: 'sales-ledger' | 'settlements') => {
    setReportType(type)
    setStatus('ALL') // Reset status filter on report switch
    setMessage(null)
  }

  const handleDownload = async (format: ReportFormat) => {
    if (!startDate || !endDate) {
      setMessage({ type: 'error', text: 'Please select both start and end dates.' })
      return
    }
    if (startDate > endDate) {
      setMessage({ type: 'error', text: 'Start date cannot be after end date.' })
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
        text: `Report (${format.toUpperCase()}) exported successfully!`,
      })
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to export report. Please try again.'
      setMessage({ type: 'error', text: errMsg })
    } finally {
      setDownloadingFormat(null)
    }
  }

  const statusOptions =
    reportType === 'sales-ledger' ? SALES_LEDGER_STATUSES : SETTLEMENT_STATUSES

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Reports & Statements</h2>
          <p className="mt-1 text-sm text-slate-500">
            Export comprehensive sales ledger and settlement reports with status filtering.
          </p>
        </div>
        <div className="inline-flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              reportType === 'sales-ledger'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => handleReportTypeChange('sales-ledger')}
          >
            Sales Ledger
          </button>
          <button
            type="button"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              reportType === 'settlements'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => handleReportTypeChange('settlements')}
          >
            Settlements
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mt-4 flex items-center gap-3 rounded-xl p-3.5 text-sm ${
            message.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border border-rose-200 bg-rose-50 text-rose-800'
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
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Calendar className="h-3.5 w-3.5 text-slate-500" /> Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 outline-none ring-indigo-200 transition focus:border-indigo-400 focus:bg-white focus:ring-4"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Calendar className="h-3.5 w-3.5 text-slate-500" /> End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 outline-none ring-indigo-200 transition focus:border-indigo-400 focus:bg-white focus:ring-4"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Filter className="h-3.5 w-3.5 text-indigo-600" /> Status Filter
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-medium text-slate-800 outline-none ring-indigo-200 transition focus:border-indigo-400 focus:bg-white focus:ring-4"
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
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <div className="text-xs text-slate-500">
          Selected: <span className="font-semibold text-slate-700">{reportType === 'sales-ledger' ? 'Sales Ledger' : 'Settlements'}</span> | Status Filter: <span className="font-semibold text-indigo-600">{status}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export PDF */}
          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownload('pdf')}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloadingFormat === 'pdf' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            <span>Export PDF</span>
          </button>

          {/* Export Excel */}
          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownload('xlsx')}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloadingFormat === 'xlsx' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span>Export Excel</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            disabled={downloadingFormat !== null}
            onClick={() => handleDownload('csv')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloadingFormat === 'csv' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </div>
  )
}
