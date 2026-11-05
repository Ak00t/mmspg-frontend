import { api } from './api'

// --- Merchants API ---
export async function getMerchants() {
  const response = await api.get('/api/v1/admin/merchants')
  return response.data
}

export async function registerMerchant(payload: any) {
  const response = await api.post('/api/v1/admin/merchants/register', payload)
  return response.data
}

export async function updateMerchant(id: string, payload: any) {
  const response = await api.put(`/api/v1/admin/merchants/${id}`, payload)
  return response.data
}

export async function updateMerchantStatus(id: string, status: string, reason?: string) {
  const response = await api.put(`/api/v1/admin/merchants/${id}/status`, reason ? { reason } : null, {
    params: { status }
  })
  return response.data
}

export async function approveMerchant(id: string) {
  const response = await api.put(`/api/v1/admin/merchants/${id}/approve`)
  return response.data
}

export async function rejectMerchant(id: string, reason?: string) {
  const response = await api.put(`/api/v1/admin/merchants/${id}/reject`, { reason: reason || 'No reason provided' })
  return response.data
}

// --- Branches API ---
export async function getBranches() {
  const response = await api.get('/api/v1/admin/branches')
  return response.data
}

export async function createBranch(payload: any) {
  const response = await api.post('/api/v1/admin/branches', payload)
  return response.data
}

export async function updateBranch(branchId: string, payload: any) {
  const response = await api.put(`/api/v1/admin/branches/${branchId}`, payload)
  return response.data
}

export async function updateBranchStatus(branchId: string) {
  const response = await api.put(`/api/v1/admin/branches/${branchId}/status`)
  return response.data
}

// --- MCC API ---
export async function getMccs() {
  const response = await api.get('/api/v1/admin/mcc')
  return response.data
}

export async function createMcc(payload: any) {
  const response = await api.post('/api/v1/admin/mcc', payload)
  return response.data
}

export async function updateMcc(id: number | string, payload: any) {
  const response = await api.put(`/api/v1/admin/mcc/${id}`, payload)
  return response.data
}

export async function deleteMcc(id: number | string) {
  const response = await api.delete(`/api/v1/admin/mcc/${id}`)
  return response.data
}

// --- Staff Users API ---
export async function getStaffUsers() {
  const response = await api.get('/api/v1/admin/staff-users')
  return response.data
}

export async function createStaffUser(payload: any) {
  const response = await api.post('/api/v1/admin/staff-users', payload)
  return response.data
}

export async function updateStaffUser(id: string, payload: any) {
  const response = await api.put(`/api/v1/admin/staff-users/${id}`, payload)
  return response.data
}

export async function deleteStaffUser(id: string) {
  const response = await api.delete(`/api/v1/admin/staff-users/${id}`)
  return response.data
}

export async function updateStaffUserStatus(id: string, status?: string) {
  const response = await api.put(`/api/v1/admin/staff-users/${id}/status`, null, status ? { params: { status } } : undefined)
  return response.data
}

export async function getStaffProfile() {
  const response = await api.get('/api/v1/admin/staff-users/profile')
  return response.data
}

export async function getStaffLoginActivity() {
  const response = await api.get('/api/v1/admin/staff-users/profile/login-activity')
  return response.data
}

export async function updateStaffPassword(payload: any) {
  const response = await api.put('/api/v1/admin/staff-users/profile/password', payload)
  return response.data
}

// --- Terminals API ---
export async function getTerminals() {
  const response = await api.get('/api/v1/admin/terminals')
  return response.data
}

export async function provisionTerminal(payload: any) {
  const response = await api.post('/api/v1/admin/terminals/provision', payload)
  return response.data
}

export async function updateTerminal(terminalId: string, payload: any) {
  const response = await api.put(`/api/v1/admin/terminals/${terminalId}`, payload)
  return response.data
}

export async function suspendTerminal(terminalId: string, reason: string) {
  const response = await api.put(`/api/v1/admin/terminals/${terminalId}/suspend`, { reason })
  return response.data
}

export async function reactivateTerminal(terminalId: string) {
  const response = await api.put(`/api/v1/admin/terminals/${terminalId}/reactivate`)
  return response.data
}

// --- Notifications API ---
export async function getNotifications() {
  const response = await api.get('/api/v1/notifications')
  return response.data
}

export async function markNotificationAsRead(id: string | number) {
  const response = await api.put(`/api/v1/notifications/${id}/read`)
  return response.data
}

// --- Fee Configuration API ---
export async function getFeeConfigs() {
  const response = await api.get('/api/v1/admin/fees')
  return response.data
}

export async function createFeeConfig(payload: any) {
  const response = await api.post('/api/v1/admin/fees', payload)
  return response.data
}

export async function updateFeeConfig(feeId: string, payload: any) {
  const response = await api.put(`/api/v1/admin/fees/${feeId}`, payload)
  return response.data
}

export async function calculateFee(feeId: string, amount: number | string) {
  const response = await api.post('/api/v1/admin/fees/calculate', null, {
    params: { feeId, amount }
  })
  return response.data
}
