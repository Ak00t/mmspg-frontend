import { api } from '../../../services/api'
import type { CreateWebhookInput, UpdateWebhookInput, WebhookConfig } from '../types'

export async function getWebhookConfig(): Promise<WebhookConfig | null> {
  const response = await api.get<WebhookConfig | ''>('/api/v1/webhooks')
  if (!response.data || typeof response.data !== 'object') {
    return null
  }
  return response.data as WebhookConfig
}

export async function createWebhook(data: CreateWebhookInput): Promise<WebhookConfig> {
  const response = await api.post<WebhookConfig>('/api/v1/webhooks', data)
  return response.data
}

export async function updateWebhook(id: string, data: UpdateWebhookInput): Promise<WebhookConfig> {
  const response = await api.put<WebhookConfig>(`/api/v1/webhooks/${id}`, data)
  return response.data
}

export async function deleteWebhook(id: string): Promise<string> {
  const response = await api.delete<string>(`/api/v1/webhooks/${id}`)
  return response.data
}

export async function testWebhook(id: string): Promise<string> {
  const response = await api.post<string>(`/api/v1/webhooks/${id}/test`)
  return response.data
}

export async function regenerateWebhookSecret(id: string): Promise<WebhookConfig> {
  const response = await api.post<WebhookConfig>(`/api/v1/webhooks/${id}/regenerate-secret`)
  return response.data
}
