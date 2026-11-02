import type { RecentTransaction } from '../types'
import { ArrowUpRight, CheckCircle2, Clock, XCircle } from 'lucide-react'

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

function StatusBadge({ status }: { status: string }) {
  switch (status?.toUpperCase()) {
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="size-3 text-emerald-600" />
          Completed
        </span>
      )
    case 'PENDING_AUTHORIZATION':
    case 'INITIATED':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200">
          <Clock className="size-3 text-amber-600" />
          Pending
        </span>
      )
    case 'FAILED':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 border border-rose-200">
          <XCircle className="size-3 text-rose-600" />
          Failed
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {status || 'Unknown'}
        </span>
      )
  }
}

export function RecentTransactionsTable({ transactions, loading }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden" id="transactions-table">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Recent Transactions</h2>
          <p className="mt-0.5 text-xs text-slate-500">Latest activity on your merchant account</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 border border-indigo-100">
          {transactions.length} latest
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-6 py-3">Order / Ref</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Initiated At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-sm text-slate-400">
                  <div className="inline-block size-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-2" />
                  <p>Loading transactions...</p>
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-sm text-slate-400">
                  <div className="mx-auto mb-2 grid size-10 place-items-center rounded-full bg-slate-100 text-slate-400">
                    <ArrowUpRight className="size-5" />
                  </div>
                  <p className="font-medium text-slate-600">No transactions recorded yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">Transactions will appear here as customers complete payments.</p>
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.transactionReference} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{tx.orderId || 'Direct Payment'}</div>
                    <div className="text-xs font-mono text-slate-400">{tx.transactionReference}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-900">{formatMoney(tx.amount)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-slate-500 whitespace-nowrap">
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
