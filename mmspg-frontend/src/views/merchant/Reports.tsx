import { FileSpreadsheet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MerchantReportExport } from '../../features/main-merchant/components/MerchantReportExport'

export default function Reports() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Page Header Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-md shadow-indigo-100 dark:shadow-none">
            <FileSpreadsheet className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('merchantReports.title') || 'Merchant Reports Export'}
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {t('merchantReports.subtitle') || 'Generate and download official Sales Ledger transactions and Settlement payout records in PDF, Excel (.xlsx), or CSV.'}
            </p>
          </div>
        </div>
      </div>

      {/* Report Generator Component */}
      <MerchantReportExport />
    </div>
  )
}
