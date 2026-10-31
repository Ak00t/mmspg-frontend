import { api } from './api'

export interface RecentMerchantRequestDto {
  requestId: string
  merchantName: string
  businessType: string
  date: string
  status: string
}

export interface DashboardSummaryResponse {
  totalPendingApprovals: number
  totalVolumeToday: number | string
  activeGateways: number
  internalStaff: number
  recentMerchantRequests: RecentMerchantRequestDto[]
}

export async function getAdminDashboardSummary(): Promise<DashboardSummaryResponse> {
  const response = await api.get<DashboardSummaryResponse>('/api/v1/admin/dashboard/summary')
  return response.data
}
