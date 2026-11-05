import { useTranslation } from 'react-i18next'
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
  Zap,
  ArrowRight,
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
import { formatLocalDate } from '../../utils/formatDate'

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'MMK',
    maximumFractionDigits: 0,
  }).format(value)
}

function getTodayString() {
  return formatLocalDate(new Date())
}

export default function Dashboard() {
  const { i18n } = useTranslation();
  const isMy = i18n.language === 'my';

  const navigate = useNavigate()
  const [startDate, setStartDate] = useState(getTodayString)
  const [endDate, setEndDate] = useState(getTodayString)
  const [activePreset, setActivePreset] = useState<'today' | 'yesterday' | '7days' | '30days' | 'month' | 'custom'>('today')

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
      setError(isMy ? 'စတင်ရက်သည် ပြီးဆုံးရက်ထက် မကျော်လွန်ရပါ' : 'Start date cannot be after end date.')
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
        setError(isMy ? 'ဤဒေတာကို ကြည့်ရှုရန် ခွင့်ပြုချက်မရှိပါ' : 'You do not have permission to access this merchant data.')
      } else {
        setError(isMy ? 'ဒက်ရ်ဘုတ်ဒေတာ ရယူ၍မရပါ။ ကွန်ရက်နှင့် အကောင့်ကို စစ်ဆေးပါ' : 'Could not load dashboard data. Please verify network and login token.')
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
  const handlePresetChange = (preset: 'today' | 'yesterday' | '7days' | '30days' | 'month') => {
    setActivePreset(preset)
    const today = new Date()
    let from = ''
    let to = ''

    if (preset === 'today') {
      from = formatLocalDate(today)
      to = from
    } else if (preset === 'yesterday') {
      const y = new Date(today)
      y.setDate(y.getDate() - 1)
      from = formatLocalDate(y)
      to = from
    } else if (preset === '7days') {
      const past = new Date(today)
      past.setDate(past.getDate() - 7)
      from = formatLocalDate(past)
      to = formatLocalDate(today)
    } else if (preset === '30days') {
      const past = new Date(today)
      past.setDate(past.getDate() - 30)
      from = formatLocalDate(past)
      to = formatLocalDate(today)
    } else if (preset === 'month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1)
      from = formatLocalDate(first)
      to = formatLocalDate(today)
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

  const presetLabels: Record<string, string> = {
    today: isMy ? 'ယနေ့' : 'Today',
    yesterday: isMy ? 'မနေ့က' : 'Yesterday',
    '7days': isMy ? 'လွန်ခဲ့သော ၇ ရက်' : 'Last 7 Days',
    '30days': isMy ? 'လွန်ခဲ့သော ၃၀ ရက်' : 'Last 30 Days',
    month: isMy ? 'ယခုလ' : 'This Month',
  }

  return (
    <div className="space-y-6">
      {/* Merchant Welcome Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-6 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-indigo-600 text-xl font-bold text-white shadow-md shadow-indigo-100 dark:shadow-none">
              <Building2 className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {profile?.businessName || localStorage.getItem('userName') || (isMy ? 'ကုန်သည် ပေါ်တယ်' : 'Merchant Portal')}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="size-3 text-emerald-600" />
                  {profile?.status || (isMy ? 'တက်ကြွ' : 'ACTIVE')}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {isMy ? 'ကုဒ်:' : 'Code:'}{' '}
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                  {profile?.merchantCode || 'MMSPG-MERCHANT'}
                </span>
                {profile?.settlementAccountNo && (
                  <span className="ml-3">
                    {isMy ? 'ငွေစာရင်းအမှတ်:' : 'Settlement A/C:'}{' '}
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                      {profile.settlementAccountNo}
                    </span>
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
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 px-4 py-2.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="size-4 text-indigo-600 dark:text-indigo-400" />
              <span>{isMy ? 'အစီရင်ခံစာများ ရယူရန် →' : 'Download Reports →'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar with Presets in one row without common text */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 p-5 shadow-xs md:flex-row md:items-center">
        <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto py-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0">
            <Calendar className="size-3.5" /> {isMy ? 'အပိုင်းအခြား:' : 'Range:'}
          </span>
          {(['today', 'yesterday', '7days', '30days', 'month'] as const).map((p) => {
            const isActive = activePreset === p
            return (
              <button
                key={p}
                onClick={() => handlePresetChange(p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition shrink-0 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {presetLabels[p]}
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
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-3 py-1.5 text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-xs text-slate-400">{isMy ? 'မှ' : 'to'}</span>
          <input
            aria-label="End date"
            type="date"
            value={endDate}
            onChange={(e) => handleCustomDateChange('end', e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 px-3 py-1.5 text-xs outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => void loadDashboard()}
            disabled={loadingSummary}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${loadingSummary ? 'animate-spin' : ''}`} />
            {loadingSummary ? (isMy ? 'ခေတ္တစောင့်ပါ...' : 'Loading...') : (isMy ? 'ပြန်လည်စစ်ဆေးရန်' : 'Refresh')}
          </button>
          {lastUpdated && (
            <span className="text-[11px] text-slate-400 hidden xl:inline">
              {isMy ? 'နောက်ဆုံး အပ်ဒိတ်' : 'Updated'} {lastUpdated.toLocaleTimeString()}
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
          label={isMy ? 'စုစုပေါင်း အရောင်းပမာဏ' : 'Gross Sales'}
          value={formatMoney(summary.todayGrossSales)}
          helper={isMy ? 'အောင်မြင်သော ငွေပေးချေမှုများ' : 'Completed customer payments'}
          accent="indigo"
        />
        <MetricCard
          label={isMy ? 'လုပ်ဆောင်မှု အရေအတွက်' : 'Total Transactions'}
          value={summary.totalApiTransactionsToday.toLocaleString()}
          helper={isMy ? 'ရွေးချယ်ထားသော ကာလအတွင်း' : 'In selected date period'}
          accent="sky"
        />
        <MetricCard
          label={isMy ? 'အသားတင် စာရင်းရှင်းပြီး ငွေ' : 'Net Settled'}
          value={formatMoney(summary.availableSettlementBalance)}
          helper={isMy ? 'နုတ်ယူခများ နုတ်ပြီး စာရင်းဝင်ငွေ' : 'Credited net earnings (after fees)'}
          accent="emerald"
        />
        <MetricCard
          label={isMy ? 'ငွေချေမှု အကြိမ်ရေ' : 'Settled Payouts'}
          value={summary.pendingSettlementsCount.toLocaleString()}
          helper={isMy ? 'ချက်ချင်း ငွေချေမှုများ' : 'Real-time instant settlements'}
          accent="amber"
        />
      </div>

      {/* Analytics & Settlement Health Grid */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <TransactionStatusCard
          statusCounts={hasStatusData ? summary.transactionsByStatus : {}}
        />

        {/* Instant Settlement Card */}
        <section className="rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-indigo-950 p-6 text-white shadow-md flex flex-col justify-between relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -right-8 -top-8 size-36 rounded-full bg-indigo-500/20 blur-2xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/30 px-3 py-1 text-[11px] font-semibold tracking-wide text-indigo-100 border border-indigo-400/30">
                <Zap className="size-3 text-amber-300 fill-amber-300" />
                {isMy ? 'ချက်ချင်း ငွေစာရင်းရှင်းလင်းမှု' : 'INSTANT SETTLEMENT'}
              </span>
              <Wallet className="size-5 text-indigo-200" />
            </div>

            <div className="mt-5">
              <p className="text-xs font-medium uppercase tracking-wider text-indigo-200">
                {isMy ? 'အသားတင် ရရှိသော ဝင်ငွေ' : 'Net Settled Earnings'}
              </p>
              <h2 className="mt-1 text-3xl font-extrabold tracking-tight">
                {formatMoney(summary.availableSettlementBalance)}
              </h2>
            </div>

            {profile?.settlementAccountNo && (
              <div className="mt-4 rounded-xl bg-white/10 p-3 backdrop-blur-xs border border-white/10 text-xs">
                <div className="text-[11px] text-indigo-200 uppercase tracking-wider font-semibold">
                  {isMy ? 'ငွေလက်ခံမည့် ဘဏ်စာရင်း' : 'Destination Bank Account'}
                </div>
                <div className="mt-0.5 font-mono font-bold tracking-wider text-white text-sm">
                  {profile.settlementAccountNo}
                </div>
              </div>
            )}

            <p className="mt-3 text-xs leading-relaxed text-indigo-100">
              {isMy
                ? 'ငွေပေးချေမှုများကို (MDR နုတ်ပြီး) သင်၏ ဘဏ်စာရင်းထဲသို့ အချိန်နှင့်တပြေးညီ တိုက်ရိုက် လွှဲပြောင်းပေးပါသည်။'
                : 'Payments (minus MDR gateway fees) are settled instantly into your registered bank account in real-time.'}
            </p>
          </div>

          <div className="mt-6 border-t border-indigo-500/40 pt-4 flex items-center justify-between text-xs">
            <span className="text-indigo-200 flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              {summary.pendingSettlementsCount} {isMy ? 'ကြိမ် ချက်ချင်း ငွေချေပြီး' : 'Real-Time Settlements'}
            </span>
            <button
              type="button"
              onClick={() => navigate('/merchant/reports')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-200 hover:text-white transition cursor-pointer"
            >
              <span>{isMy ? 'အစီရင်ခံစာများ ကြည့်ရှုရန်' : 'View Reports'}</span>
              <ArrowRight className="size-3.5" />
            </button>
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
