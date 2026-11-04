import type { RecentTransaction } from '../types'
import { ArrowUpRight, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type Props = {
  transactions: RecentTransaction[]
  loading?: boolean
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MMK',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusBadge({ status, isMy }: { status: string; isMy: boolean }) {
  switch (status?.toUpperCase()) {
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="size-3 text-emerald-600" />
          {isMy ? 'အောင်မြင်သည်' : 'Completed'}
        </span>
      )
    case 'PENDING_AUTHORIZATION':
    case 'INITIATED':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Clock className="size-3 text-amber-600" />
          {isMy ? 'ဆိုင်းငံ့' : 'Pending'}
        </span>
      )
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-900/30 px-2.5 py-1 text-xs font-medium text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <XCircle className="size-3 text-rose-600" />
          {isMy ? 'မအောင်မြင်ပါ' : 'Failed'}
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300">
          {status || 'Unknown'}
        </span>
      )
  }
}

export function RecentTransactionsTable({ transactions, loading }: Props) {
  const { i18n } = useTranslation();
  const isMy = i18n.language === 'my';

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-xs overflow-hidden" id="transactions-table">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {isMy ? 'လတ်တလော ငွေပေးချေမှု မှတ်တမ်းများ' : 'Recent Transactions'}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {isMy ? 'သင်၏ ကုန်သည်အကောင့် နောက်ဆုံး လုပ်ဆောင်ချက်များ' : 'Latest activity on your merchant account'}
          </p>
        </div>
        <span className="rounded-full bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
          {transactions.length} {isMy ? 'ခု' : 'latest'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/75 dark:bg-slate-900 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
            <tr>
              <th className="px-6 py-3">{isMy ? 'အော်ဒါ / လွှဲပြောင်းမှု' : 'Order / Ref'}</th>
              <th className="px-6 py-3">{isMy ? 'ငွေပမာဏ' : 'Amount'}</th>
              <th className="px-6 py-3">{isMy ? 'အခြေအနေ' : 'Status'}</th>
              <th className="px-6 py-3 text-right">{isMy ? 'အချိန်' : 'Initiated At'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-sm text-slate-400">
                  <div className="inline-block size-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-2" />
                  <p>{isMy ? 'ဒေတာများ ရယူနေပါသည်...' : 'Loading transactions...'}</p>
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-sm text-slate-400">
                  <div className="mx-auto mb-2 grid size-10 place-items-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400">
                    <ArrowUpRight className="size-5" />
                  </div>
                  <p className="font-medium text-slate-600 dark:text-slate-300">
                    {isMy ? 'ငွေပေးချေမှု မှတ်တမ်း မရှိသေးပါ' : 'No transactions recorded yet'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isMy ? 'ငွေပေးချေမှုများ ပြုလုပ်ပါက ဤနေရာတွင် ဖော်ပြပေးမည်ဖြစ်ပါသည်။' : 'Transactions will appear here as customers complete payments.'}
                  </p>
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.transactionReference} className="hover:bg-slate-50/60 dark:hover:bg-slate-750 transition">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-white">{tx.orderId || (isMy ? 'တိုက်ရိုက် ငွေချေမှု' : 'Direct Payment')}</div>
                    <div className="text-xs font-mono text-slate-400">{tx.transactionReference}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-900 dark:text-white">{formatMoney(tx.amount)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={tx.status} isMy={isMy} />
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {formatDate(tx.initiatedAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
