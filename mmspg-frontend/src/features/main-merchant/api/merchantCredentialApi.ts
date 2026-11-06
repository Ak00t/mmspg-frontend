import { api } from '../../../services/api'
import type { ApiCredentialItem, CreateCredentialInput } from '../types'

export async function getCredentials(): Promise<ApiCredentialItem[]> {
  const response = await api.get<ApiCredentialItem[]>('/api/v1/credentials')
  return Array.isArray(response.data) ? response.data : []
}

export async function createCredential(data: CreateCredentialInput): Promise<ApiCredentialItem> {
  const response = await api.post<ApiCredentialItem>('/api/v1/credentials', data)
  return response.data
}

export async function regenerateSecret(credentialId: string): Promise<ApiCredentialItem> {
  const response = await api.put<ApiCredentialItem>(`/api/v1/credentials/${credentialId}/regenerate-secret`)
  return response.data
}

export async function revokeCredential(credentialId: string): Promise<string> {
  const response = await api.put<string>(`/api/v1/credentials/${credentialId}/revoke`)
  return response.data
}
