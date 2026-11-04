import { useTranslation } from 'react-i18next'

type TransactionStatusCardProps = {
  statusCounts: Record<string, number>
}

const STATUS_LABELS_MY: Record<string, string> = {
  COMPLETED: 'အောင်မြင်သည်',
  FAILED: 'မအောင်မြင်ပါ',
  PENDING_AUTHORIZATION: 'အတည်ပြုရန် စောင့်ဆိုင်းဆဲ',
  INITIATED: 'စတင်ဆောင်ရွက်ဆဲ',
  PENDING: 'ဆိုင်းငံ့',
}

function formatLabel(value: string, isMy: boolean) {
  if (isMy && STATUS_LABELS_MY[value.toUpperCase()]) {
    return STATUS_LABELS_MY[value.toUpperCase()]
  }
  return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function TransactionStatusCard({ statusCounts }: TransactionStatusCardProps) {
  const { i18n } = useTranslation();
  const isMy = i18n.language === 'my';

  const entries = Object.entries(statusCounts)
  const total = entries.reduce((sum, [, count]) => sum + count, 0)

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-6 shadow-xs" id="transactions">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white">
            {isMy ? 'ငွေလွှဲ လုပ်ဆောင်မှု အခြေအနေ' : 'Transaction activity'}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {isMy ? 'ရွေးချယ်ထားသော ကာလအတွင်း အခြေအနေများ' : 'Status breakdown for the selected period'}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
          {total} {isMy ? 'စုစုပေါင်း' : 'total'}
        </span>
      </div>
      <div className="mt-7 space-y-5">
        {entries.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">
            {isMy ? 'ဒေတာ မရှိသေးပါ' : 'No transaction data available.'}
          </p>
        )}
        {entries.map(([status, count]) => {
          const percentage = total ? Math.round((count / total) * 100) : 0
          return (
            <div key={status}>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-200">{formatLabel(status, isMy)}</span>
                <span className="text-slate-400">{count} · {percentage}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700">
                <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${percentage}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
