import { api } from '../../../services/api'
import type { DashboardSummary, MerchantProfile, RecentTransaction } from '../types'

function toApiDate(date: string) {
  const [year, month, day] = date.split('-')
  return `${day}-${month}-${year}`
}

export async function getMerchantDashboardSummary(startDate: string, endDate: string) {
  const response = await api.get<DashboardSummary>('/api/v1/merchant/dashboard/summary', {
    params: { startDate: toApiDate(startDate), endDate: toApiDate(endDate) },
  })
  return response.data
}

export async function getMerchantProfile() {
  const response = await api.get<MerchantProfile>('/api/v1/merchant/dashboard/profile')
  return response.data
}

export async function getRecentTransactions(limit = 10) {
  const response = await api.get<RecentTransaction[]>('/api/v1/merchant/dashboard/recent-transactions', {
    params: { limit },
  })
  return response.data
}
