
import { useMemo, useState } from 'react'

type DashboardSummary = {
  todayGrossSales: number
  totalApiTransactionsToday: number
  availableSettlementBalance: number
  pendingSettlementsCount: number
  transactionsByStatus: Record<string, number>
}

const emptySummary: DashboardSummary = {
  todayGrossSales: 0,
  totalApiTransactionsToday: 0,
  availableSettlementBalance: 0,
  pendingSettlementsCount: 0,
  transactionsByStatus: {},
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8004'

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MMK',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatLabel(value: string) {
  return value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

async function fetchDashboard(merchantId: string, startDate: string, endDate: string) {
  const token = localStorage.getItem('mmspg_token')
  const params = new URLSearchParams({ startDate, endDate })
  const response = await fetch(`${apiBaseUrl}/api/v1/merchant/dashboard/${merchantId}/summary?${params}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!response.ok) {
    throw new Error(response.status === 403 ? 'You do not have access to this merchant dashboard.' : 'Could not load dashboard data.')
  }

  return response.json() as Promise<DashboardSummary>
}

function App() {
  const [merchantId, setMerchantId] = useState(() => localStorage.getItem('mmspg_merchant_id') ?? '')
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const statusEntries = useMemo(() => Object.entries(summary.transactionsByStatus ?? {}), [summary.transactionsByStatus])
  const totalStatusCount = statusEntries.reduce((total, [, count]) => total + count, 0)

  const loadDashboard = async () => {
    if (!merchantId) {
      setError('Enter a merchant ID to load the dashboard.')
      return
    }
    if (startDate > endDate) {
      setError('The start date must not be after the end date.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await fetchDashboard(merchantId, startDate, endDate)
      setSummary({ ...emptySummary, ...result })
      setLastUpdated(new Date())
      localStorage.setItem('mmspg_merchant_id', merchantId)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-5 py-7 lg:block">
          <div className="mb-12 flex items-center gap-3 px-2">
            <div className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-lg font-bold text-white">M</div>
            <div>
              <p className="text-sm font-semibold tracking-tight">MMSPG</p>
              <p className="text-xs text-slate-400">Merchant portal</p>
            </div>
          </div>
          <nav className="space-y-1">
            <a className="flex items-center gap-3 rounded-xl bg-indigo-50 px-3 py-3 text-sm font-semibold text-indigo-700" href="#dashboard">
              <span>▦</span> Dashboard
            </a>
            <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 hover:bg-slate-50" href="#transactions">
              <span>↗</span> Transactions
            </a>
            <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 hover:bg-slate-50" href="#settlements">
              <span>◈</span> Settlements
            </a>
            <a className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 hover:bg-slate-50" href="#reports">
              <span>▤</span> Reports
            </a>
          </nav>
          <div className="mt-auto pt-24">
            <div className="rounded-2xl bg-slate-900 p-4 text-white">
              <p className="text-xs font-medium text-slate-400">Need help?</p>
              <p className="mt-2 text-sm leading-5">Contact your MMSPG support team.</p>
              <button className="mt-4 text-xs font-semibold text-indigo-300">Open support →</button>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-600">Merchant portal</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">Dashboard</h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50">?</button>
              <div className="grid size-10 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">ME</div>
            </div>
          </header>

          <div className="space-y-6 px-5 py-7 sm:px-8" id="dashboard">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm text-slate-500">Overview of your payment activity</p>
                <p className="mt-1 text-xs text-slate-400">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Choose a date range to begin'}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input aria-label="Merchant ID" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring-4 sm:w-72" placeholder="Merchant ID" value={merchantId} onChange={(event) => setMerchantId(event.target.value)} />
                <input aria-label="Start date" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring-4" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                <input aria-label="End date" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-indigo-200 focus:ring-4" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60" onClick={() => void loadDashboard()} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
              </div>
            </div>

            {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Gross sales" value={formatMoney(summary.todayGrossSales)} helper="Completed payments" accent="indigo" />
              <MetricCard label="Transactions" value={summary.totalApiTransactionsToday.toLocaleString()} helper="In selected period" accent="sky" />
              <MetricCard label="Available balance" value={formatMoney(summary.availableSettlementBalance)} helper="Pending settlement balance" accent="emerald" />
              <MetricCard label="Pending settlements" value={summary.pendingSettlementsCount.toLocaleString()} helper="Awaiting processing" accent="amber" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" id="transactions">
                <div className="flex items-start justify-between">
                  <div><h2 className="font-semibold">Transaction activity</h2><p className="mt-1 text-sm text-slate-400">Status breakdown for the selected period</p></div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">{totalStatusCount} total</span>
                </div>
                <div className="mt-7 space-y-5">
                  {statusEntries.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No transaction data available.</p>}
                  {statusEntries.map(([status, count]) => {
                    const percentage = totalStatusCount ? Math.round((count / totalStatusCount) * 100) : 0
                    return <div key={status}><div className="mb-2 flex justify-between text-sm"><span className="font-medium text-slate-600">{formatLabel(status)}</span><span className="text-slate-400">{count} · {percentage}%</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${percentage}%` }} /></div></div>
                  })}
                </div>
              </section>

              <section className="rounded-2xl bg-indigo-600 p-6 text-white shadow-sm" id="settlements">
                <p className="text-sm font-medium text-indigo-200">Settlement health</p>
                <h2 className="mt-3 text-3xl font-bold">{formatMoney(summary.availableSettlementBalance)}</h2>
                <p className="mt-2 text-sm leading-6 text-indigo-100">Your current pending settlement balance. Funds and settlement timing are subject to processing status.</p>
                <div className="mt-8 flex items-center justify-between border-t border-indigo-400/40 pt-4 text-sm"><span className="text-indigo-200">Pending settlements</span><span className="font-semibold">{summary.pendingSettlementsCount}</span></div>
              </section>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" id="reports">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-semibold">Reports</h2><p className="mt-1 text-sm text-slate-400">Download detailed transaction and settlement reports.</p></div><button className="rounded-xl border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">View reports</button></div>
            </section>
          </div>
        </section>
      </div>
    </main>
  )
}

function MetricCard({ label, value, helper, accent }: { label: string; value: string; helper: string; accent: 'indigo' | 'sky' | 'emerald' | 'amber' }) {
  const colors = { indigo: 'bg-indigo-100 text-indigo-600', sky: 'bg-sky-100 text-sky-600', emerald: 'bg-emerald-100 text-emerald-600', amber: 'bg-amber-100 text-amber-600' }
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-slate-500">{label}</span><span className={`grid size-9 place-items-center rounded-xl text-lg ${colors[accent]}`}>↗</span></div><p className="mt-5 text-2xl font-bold tracking-tight">{value}</p><p className="mt-1 text-xs text-slate-400">{helper}</p></article>
}

export default App
