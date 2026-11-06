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
  profileImageUrl?: string | null
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

export type WebhookConfig = {
  webhookId: string
  merchantId: string
  callbackUrl: string
  returnUrl?: string
  rawSecretKey?: string
  eventPaymentCompleted: boolean
  eventPaymentFailed: boolean
  maxRetry: number
  description?: string
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
}

export type CreateWebhookInput = {
  callbackUrl: string
  returnUrl?: string
  eventPaymentCompleted: boolean
  eventPaymentFailed: boolean
  maxRetry?: number
  description?: string
}

export type UpdateWebhookInput = {
  callbackUrl?: string
  returnUrl?: string
  eventPaymentCompleted?: boolean
  eventPaymentFailed?: boolean
  maxRetry?: number
  description?: string
  status?: 'ACTIVE' | 'INACTIVE'
}

export type ApiCredentialItem = {
  credentialId: string
  clientId: string
  clientSecret?: string | null
  keyName: string
  environment: 'SANDBOX' | 'PRODUCTION'
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED'
  ipAddress: string
  rateLimit?: number
  lastUsedAt?: string | null
  revokedAt?: string | null
  expiresAt?: string | null
  createdAt: string
}

export type CreateCredentialInput = {
  keyName: string
  ipAddress?: string
  environment: 'SANDBOX' | 'PRODUCTION'
}
