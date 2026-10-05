import { api } from '../../../services/api'
import type { DashboardSummary } from '../types'

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
