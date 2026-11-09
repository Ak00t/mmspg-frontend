import { api } from '../../../services/api'
import type { DashboardSummary, MerchantProfile, PaginatedTransactions, RecentTransaction } from '../types'

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

export async function getRecentTransactions(page = 0, size = 10): Promise<PaginatedTransactions> {
  const response = await api.get<PaginatedTransactions | RecentTransaction[]>('/api/v1/merchant/dashboard/recent-transactions', {
    params: { page, size },
  })
  if (Array.isArray(response.data)) {
    return {
      content: response.data,
      totalElements: response.data.length,
      totalPages: 1,
      size: response.data.length,
      number: 0,
    }
  }
  return response.data
}
