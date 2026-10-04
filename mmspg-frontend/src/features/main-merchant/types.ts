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

