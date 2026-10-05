import { useMemo, useState } from 'react'
import axios from 'axios'

import { getMerchantDashboardSummary } from '../api/merchantDashboardApi'
import { MetricCard } from '../components/MetricCard'
import { MerchantSidebar } from '../components/MerchantSidebar'
import { TransactionStatusCard } from '../components/TransactionStatusCard'
import { emptyDashboardSummary } from '../types'

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MMK', maximumFractionDigits: 0 }).format(value)
}

export function MerchantDashboardPage() {
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [summary, setSummary] = useState(emptyDashboardSummary)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const hasStatusData = useMemo(() => Object.keys(summary.transactionsByStatus).length > 0, [summary.transactionsByStatus])

  const loadDashboard = async () => {
    if (startDate > endDate) return setError('The start date must not be after the end date.')
    setLoading(true)
    setError('')
    try {
      const data = await getMerchantDashboardSummary(startDate, endDate)
      setSummary({ ...emptyDashboardSummary, ...data })
      setLastUpdated(new Date())
    } catch (requestError) {
      if (axios.isAxiosError(requestError) && requestError.response?.status === 403) setError('You do not have access to this merchant dashboard.')
      else setError('Could not load dashboard data. Check the API and your login token.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <MerchantSidebar />
        <section className="min-w-0 flex-1">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
            <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-600">Merchant portal</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Dashboard</h1></div>
            <div className="flex items-center gap-3"><button className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50">?</button><div className="grid size-10 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">ME</div></div>
          </header>
          <div className="space-y-6 px-5 py-7 sm:px-8" id="dashboard">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div><p className="text-sm text-slate-500">Overview of your payment activity</p><p className="mt-1 text-xs text-slate-400">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Choose a date range to begin'}</p></div>
              <div className="flex flex-col gap-2 sm:flex-row">
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
              <TransactionStatusCard statusCounts={hasStatusData ? summary.transactionsByStatus : {}} />
              <section className="rounded-2xl bg-indigo-600 p-6 text-white shadow-sm" id="settlements"><p className="text-sm font-medium text-indigo-200">Settlement health</p><h2 className="mt-3 text-3xl font-bold">{formatMoney(summary.availableSettlementBalance)}</h2><p className="mt-2 text-sm leading-6 text-indigo-100">Your current pending settlement balance. Funds and settlement timing are subject to processing status.</p><div className="mt-8 flex items-center justify-between border-t border-indigo-400/40 pt-4 text-sm"><span className="text-indigo-200">Pending settlements</span><span className="font-semibold">{summary.pendingSettlementsCount}</span></div></section>
            </div>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" id="reports"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-semibold">Reports</h2><p className="mt-1 text-sm text-slate-400">Download detailed transaction and settlement reports.</p></div><button className="rounded-xl border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">View reports</button></div></section>
          </div>
        </section>
      </div>
    </main>
  )
}
