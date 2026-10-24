import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Calendar,
  RefreshCw,
  Building2,
  ShieldCheck,
  FileSpreadsheet,
  Wallet,
} from 'lucide-react'

import {
  getMerchantDashboardSummary,
  getMerchantProfile,
  getRecentTransactions,
} from '../../features/main-merchant/api/merchantDashboardApi'
import { MetricCard } from '../../features/main-merchant/components/MetricCard'
import { TransactionStatusCard } from '../../features/main-merchant/components/TransactionStatusCard'
import { RecentTransactionsTable } from '../../features/main-merchant/components/RecentTransactionsTable'
import {
  emptyDashboardSummary,
  type DashboardSummary,
  type MerchantProfile,
  type RecentTransaction,
} from '../../features/main-merchant/types'

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MMK',
    maximumFractionDigits: 0,
  }).format(value)
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10)
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [startDate, setStartDate] = useState(getTodayString)
  const [endDate, setEndDate] = useState(getTodayString)
  const [activePreset, setActivePreset] = useState<'today' | 'yesterday' | '7days' | 'month' | 'custom'>('today')

  const [summary, setSummary] = useState<DashboardSummary>(emptyDashboardSummary)
  const [profile, setProfile] = useState<MerchantProfile | null>(null)
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])

  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const hasStatusData = useMemo(
    () => Object.keys(summary.transactionsByStatus).length > 0,
    [summary.transactionsByStatus]
  )

  // Load dashboard metrics
  const loadDashboard = async (from = startDate, to = endDate) => {
    if (from > to) {
      setError('Start date cannot be after end date.')
      return
    }
    setLoadingSummary(true)
    setError('')
    try {
      const data = await getMerchantDashboardSummary(from, to)
      setSummary({ ...emptyDashboardSummary, ...data })
      setLastUpdated(new Date())
    } catch (requestError) {
      if (axios.isAxiosError(requestError) && requestError.response?.status === 403) {
        setError('You do not have permission to access this merchant data.')
      } else {
        setError('Could not load dashboard data. Please verify network and login token.')
      }
    } finally {
      setLoadingSummary(false)
    }
  }

  // Load merchant profile & recent transactions
  const loadProfileAndTransactions = async () => {
    setLoadingTransactions(true)
    try {
      const [prof, txs] = await Promise.allSettled([
        getMerchantProfile(),
        getRecentTransactions(10),
      ])
      if (prof.status === 'fulfilled') setProfile(prof.value)
      if (txs.status === 'fulfilled') setRecentTransactions(txs.value)
    } finally {
      setLoadingTransactions(false)
    }
  }

  // Auto-load on initial mount
  useEffect(() => {
    void loadDashboard()
    void loadProfileAndTransactions()
  }, [])

  // Quick preset handler
  const handlePresetChange = (preset: 'today' | 'yesterday' | '7days' | 'month') => {
    setActivePreset(preset)
    const today = new Date()
    let from = ''
    let to = ''

    if (preset === 'today') {
      from = today.toISOString().slice(0, 10)
      to = from
    } else if (preset === 'yesterday') {
      const y = new Date(today)
      y.setDate(y.getDate() - 1)
      from = y.toISOString().slice(0, 10)
      to = from
    } else if (preset === '7days') {
      const past = new Date(today)
      past.setDate(past.getDate() - 7)
      from = past.toISOString().slice(0, 10)
      to = today.toISOString().slice(0, 10)
    } else if (preset === 'month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1)
      from = first.toISOString().slice(0, 10)
      to = today.toISOString().slice(0, 10)
    }

    setStartDate(from)
    setEndDate(to)
    void loadDashboard(from, to)
  }

  const handleCustomDateChange = (type: 'start' | 'end', val: string) => {
    setActivePreset('custom')
    if (type === 'start') setStartDate(val)
    else setEndDate(val)
  }

  return (
    <div className="space-y-6">
      {/* Merchant Welcome Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-md shadow-indigo-100">
              <Building2 className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">
                  {profile?.businessName || localStorage.getItem('userName') || 'Merchant Portal'}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="size-3 text-emerald-600" />
                  {profile?.status || 'ACTIVE'}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Code: <span className="font-mono font-medium text-slate-700">{profile?.merchantCode || 'MMSPG-MERCHANT'}</span>
                {profile?.settlementAccountNo && (
                  <span className="ml-3">
                    Settlement A/C: <span className="font-mono font-medium text-slate-700">{profile.settlementAccountNo}</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Action Link to Dedicated Reports */}
          <div>
            <button
              type="button"
              onClick={() => navigate('/merchant/reports')}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-2.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition shadow-xs"
            >
              <FileSpreadsheet className="size-4 text-indigo-600" />
              <span>Download Reports →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar with Presets & Date Inputs */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Calendar className="size-3.5" /> Range:
          </span>
          {(['today', 'yesterday', '7days', 'month'] as const).map((p) => {
            const labels = {
              today: 'Today',
              yesterday: 'Yesterday',
              '7days': 'Last 7 Days',
              month: 'This Month',
            }
            const isActive = activePreset === p
            return (
              <button
                key={p}
                onClick={() => handlePresetChange(p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {labels[p]}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            aria-label="Start date"
            type="date"
            value={startDate}
            onChange={(e) => handleCustomDateChange('start', e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            aria-label="End date"
            type="date"
            value={endDate}
            onChange={(e) => handleCustomDateChange('end', e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => void loadDashboard()}
            disabled={loadingSummary}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
          >
            <RefreshCw className={`size-3.5 ${loadingSummary ? 'animate-spin' : ''}`} />
            {loadingSummary ? 'Loading...' : 'Refresh'}
          </button>
          {lastUpdated && (
            <span className="text-[11px] text-slate-400 hidden xl:inline">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Gross Sales"
          value={formatMoney(summary.todayGrossSales)}
          helper="Completed customer payments"
          accent="indigo"
        />
        <MetricCard
          label="Total Transactions"
          value={summary.totalApiTransactionsToday.toLocaleString()}
          helper="In selected date period"
          accent="sky"
        />
        <MetricCard
          label="Available Balance"
          value={formatMoney(summary.availableSettlementBalance)}
          helper="Pending settlement funds"
          accent="emerald"
        />
        <MetricCard
          label="Pending Settlements"
          value={summary.pendingSettlementsCount.toLocaleString()}
          helper="Awaiting bank payout"
          accent="amber"
        />
      </div>

      {/* Analytics & Settlement Health Grid */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <TransactionStatusCard
          statusCounts={hasStatusData ? summary.transactionsByStatus : {}}
        />

        {/* Settlement Card */}
        <section className="rounded-2xl bg-gradient-to-br from-indigo-700 to-indigo-900 p-6 text-white shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
                Settlement Account
              </p>
              <Wallet className="size-5 text-indigo-200" />
            </div>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight">
              {formatMoney(summary.availableSettlementBalance)}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-indigo-100">
              Total net amount pending daily batch settlement. Once verified by core banking,
              funds are transferred to your registered account.
            </p>
          </div>

          <div className="mt-8 border-t border-indigo-500/40 pt-4 flex items-center justify-between text-xs">
            <span className="text-indigo-200">Pending batches</span>
            <span className="font-bold text-white bg-indigo-500/30 px-2.5 py-1 rounded-full">
              {summary.pendingSettlementsCount} batches
            </span>
          </div>
        </section>
      </div>

      {/* Recent Transactions Table */}
      <RecentTransactionsTable
        transactions={recentTransactions}
        loading={loadingTransactions}
      />
    </div>
  )
}
