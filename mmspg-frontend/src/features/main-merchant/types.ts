export type DashboardSummary = {
  todayGrossSales: number
  totalApiTransactionsToday: number
  availableSettlementBalance: number
  pendingSettlementsCount: number
  transactionsByStatus: Record<string, number>
}

export const emptyDashboardSummary: DashboardSummary = {
  todayGrossSales: 0,
  totalApiTransactionsToday: 0,
  availableSettlementBalance: 0,
  pendingSettlementsCount: 0,
  transactionsByStatus: {},
}

export type MerchantProfile = {
  merchantId: string
  merchantCode: string
  businessName: string
  businessRegistrationNo?: string
  email: string
  phone?: string
  contactName?: string
  settlementAccountNo: string
  status: string
  mccCode?: string
  mccDescription?: string
}

export type RecentTransaction = {
  transactionReference: string
  orderId: string
  amount: number
  currency: string
  status: string
  initiatedAt: string
}
