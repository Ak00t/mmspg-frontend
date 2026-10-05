import { api } from '../../../services/api'
import type { DashboardSummary } from '../types'

export async function getMerchantDashboardSummary(startDate: string, endDate: string) {
  const response = await api.get<DashboardSummary>('/api/v1/merchant/dashboard/summary', {
    params: { startDate, endDate },
  })
  return response.data
}
