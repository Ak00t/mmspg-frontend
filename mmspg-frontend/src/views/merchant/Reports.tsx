import { FileSpreadsheet } from 'lucide-react'
import { MerchantReportExport } from '../../features/main-merchant/components/MerchantReportExport'

export default function Reports() {
  return (
    <div className="space-y-6">
      {/* Page Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-md shadow-indigo-100">
            <FileSpreadsheet className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Merchant Reports Export</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Generate and download official Sales Ledger transactions and Settlement payout records in PDF, Excel (.xlsx), or CSV.
            </p>
          </div>
        </div>
      </div>

      {/* Report Generator Component */}
      <MerchantReportExport />
    </div>
  )
}
