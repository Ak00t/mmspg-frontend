import { api } from '../../../services/api'
import type { DashboardSummary } from '../types'

export async function getMerchantDashboardSummary(merchantId: string, startDate: string, endDate: string) {
  const response = await api.get<DashboardSummary>(`/api/v1/merchant/dashboard/${merchantId}/summary`, {
    params: { startDate, endDate },
  })
  return response.data
}

