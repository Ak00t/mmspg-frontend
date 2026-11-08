import { api } from './api'

export interface RecentMerchantRequestDto {
  requestId: string
  merchantName: string
  businessType: string
  date: string
  status: string
}

export interface PlatformLiveTransactionDto {
  transactionReference: string
  orderId: string
  merchantName: string
  merchantCode: string
  branchName: string
  branchCode: string
  terminalCode: string
  terminalType: string
  amount: number
  currency: string
  status: string
  createdAt: string
}

export interface DashboardSummaryResponse {
  totalPendingApprovals: number
  totalVolumeToday: number | string
  activeGateways: number
  internalStaff: number
  recentMerchantRequests: RecentMerchantRequestDto[]
  recentTransactions?: PlatformLiveTransactionDto[]
}

export async function getAdminDashboardSummary(): Promise<DashboardSummaryResponse> {
  const response = await api.get<DashboardSummaryResponse>('/api/v1/admin/dashboard/summary')
  return response.data
}
