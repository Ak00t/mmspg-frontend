type TransactionStatusCardProps = {
  statusCounts: Record<string, number>
}

function formatLabel(value: string) {
  return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function TransactionStatusCard({ statusCounts }: TransactionStatusCardProps) {
  const entries = Object.entries(statusCounts)
  const total = entries.reduce((sum, [, count]) => sum + count, 0)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" id="transactions">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-semibold">Transaction activity</h2>
          <p className="mt-1 text-sm text-slate-400">Status breakdown for the selected period</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">{total} total</span>
      </div>
      <div className="mt-7 space-y-5">
        {entries.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No transaction data available.</p>}
        {entries.map(([status, count]) => {
          const percentage = total ? Math.round((count / total) * 100) : 0
          return (
            <div key={status}>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-slate-600">{formatLabel(status)}</span>
                <span className="text-slate-400">{count} · {percentage}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${percentage}%` }} /></div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

