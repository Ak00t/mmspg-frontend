import React, { useEffect, useState } from 'react'
import {
  Webhook,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Send,
  Edit2,
  Trash2,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Radio,
} from 'lucide-react'
import {
  getWebhookConfig,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  testWebhook,
  regenerateWebhookSecret,
} from '../../features/main-merchant/api/merchantWebhookApi'
import type { WebhookConfig, CreateWebhookInput, UpdateWebhookInput } from '../../features/main-merchant/types'

export default function MerchantWebhooks() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [webhook, setWebhook] = useState<WebhookConfig | null>(null)

  // Form states for creation
  const [callbackUrl, setCallbackUrl] = useState('')
  const [returnUrl, setReturnUrl] = useState('')
  const [eventPaymentCompleted, setEventPaymentCompleted] = useState(true)
  const [eventPaymentFailed, setEventPaymentFailed] = useState(true)
  const [maxRetry, setMaxRetry] = useState(3)
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // One-time secret reveal modal
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null)
  const [hasCopiedSecret, setHasCopiedSecret] = useState(false)

  // Testing & actions state
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<UpdateWebhookInput>({
    callbackUrl: '',
    returnUrl: '',
    eventPaymentCompleted: true,
    eventPaymentFailed: true,
    maxRetry: 3,
    description: '',
    status: 'ACTIVE',
  })

  useEffect(() => {
    loadWebhook()
  }, [])

  async function loadWebhook() {
    setLoading(true)
    setError(null)
    try {
      const data = await getWebhookConfig()
      setWebhook(data)
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || 'Failed to load webhook configuration')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!callbackUrl.trim()) return

    setIsSubmitting(true)
    setError(null)
    try {
      const payload: CreateWebhookInput = {
        callbackUrl: callbackUrl.trim(),
        returnUrl: returnUrl.trim() || undefined,
        eventPaymentCompleted,
        eventPaymentFailed,
        maxRetry,
        description: description.trim() || undefined,
      }
      const created = await createWebhook(payload)
      setWebhook(created)
      if (created.rawSecretKey) {
        setRevealedSecret(created.rawSecretKey)
      }
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || 'Failed to create webhook configuration')
    } finally {
      setIsSubmitting(false)
    }
  }

  function openEditModal() {
    if (!webhook) return
    setEditForm({
      callbackUrl: webhook.callbackUrl,
      returnUrl: webhook.returnUrl || '',
      eventPaymentCompleted: webhook.eventPaymentCompleted,
      eventPaymentFailed: webhook.eventPaymentFailed,
      maxRetry: webhook.maxRetry,
      description: webhook.description || '',
      status: webhook.status,
    })
    setIsEditOpen(true)
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!webhook) return

    setIsSubmitting(true)
    setError(null)
    try {
      const updated = await updateWebhook(webhook.webhookId, editForm)
      setWebhook(updated)
      setIsEditOpen(false)
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || 'Failed to update webhook')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleTestPing() {
    if (!webhook) return
    setIsTesting(true)
    setTestResult(null)
    try {
      const res = await testWebhook(webhook.webhookId)
      setTestResult(res || 'Test webhook delivered successfully.')
    } catch (err: any) {
      console.error(err)
      setTestResult(err?.response?.data?.message || 'Failed to send test webhook')
    } finally {
      setIsTesting(false)
    }
  }

  async function handleDeactivate() {
    if (!webhook) return
    if (!window.confirm('Are you sure you want to deactivate this webhook? Event notifications will stop.')) return

    setIsDeleting(true)
    try {
      await deleteWebhook(webhook.webhookId)
      await loadWebhook()
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || 'Failed to deactivate webhook')
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleRegenerateSecret() {
    if (!webhook) return
    if (!window.confirm('Regenerating will immediately invalidate your old secret key. Update your server with the new key right away. Continue?')) {
      return
    }

    setIsRegenerating(true)
    try {
      const res = await regenerateWebhookSecret(webhook.webhookId)
      setWebhook(res)
      if (res.rawSecretKey) {
        setRevealedSecret(res.rawSecretKey)
      }
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || 'Failed to regenerate webhook secret')
    } finally {
      setIsRegenerating(false)
    }
  }

  function copySecretToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setHasCopiedSecret(true)
    setTimeout(() => setHasCopiedSecret(false), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <Webhook className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Webhook Configuration</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Configure HTTP callbacks to receive real-time payment notifications and verify HMAC signatures
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadWebhook}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin mb-3 text-blue-500" />
          <p className="text-sm">Loading webhook configuration...</p>
        </div>
      ) : webhook ? (
        /* Active Webhook View */
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    webhook.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full mr-1.5 ${
                      webhook.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                    }`}
                  />
                  {webhook.status}
                </span>
                <span className="text-xs text-gray-500">ID: {webhook.webhookId}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleTestPing}
                  disabled={isTesting || webhook.status !== 'ACTIVE'}
                  className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isTesting ? 'animate-bounce' : ''}`} />
                  {isTesting ? 'Sending Ping...' : 'Send Test Ping'}
                </button>

                <button
                  onClick={openEditModal}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>

                <button
                  onClick={handleRegenerateSecret}
                  disabled={isRegenerating}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
                  title="Generate a new HMAC webhook secret key"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                  Roll Secret
                </button>

                {webhook.status === 'ACTIVE' && (
                  <button
                    onClick={handleDeactivate}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-red-600 bg-white hover:bg-red-50 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Deactivate
                  </button>
                )}
              </div>
            </div>

            {/* Test result message */}
            {testResult && (
              <div className="p-4 bg-blue-50/70 border-b border-blue-100 flex items-start gap-3 text-sm text-blue-800">
                <Radio className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Test Delivery Response</p>
                  <p className="text-xs text-blue-700 mt-0.5 font-mono">{testResult}</p>
                </div>
                <button
                  onClick={() => setTestResult(null)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Details Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Callback Endpoint (POST)
                  </label>
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-mono text-xs text-gray-800 break-all">
                    <span className="flex-1">{webhook.callbackUrl}</span>
                    <a
                      href={webhook.callbackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-600"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Customer Return URL (Optional)
                  </label>
                  <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-mono text-xs text-gray-700 break-all">
                    {webhook.returnUrl || <span className="text-gray-400 italic">None configured</span>}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Signing Secret Key
                  </label>
                  <div className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg font-mono text-xs text-gray-600">
                    <span>whsec_••••••••••••••••••••••••</span>
                    <span className="text-[11px] text-gray-400">Stored as HMAC Hash</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Secret keys are masked for security. If lost, click <strong>"Roll Secret"</strong> above to generate a new key.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Subscribed Events
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {webhook.eventPaymentCompleted && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Check className="w-3.5 h-3.5" />
                        payment.completed
                      </span>
                    )}
                    {webhook.eventPaymentFailed && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        <Check className="w-3.5 h-3.5" />
                        payment.failed
                      </span>
                    )}
                    {!webhook.eventPaymentCompleted && !webhook.eventPaymentFailed && (
                      <span className="text-xs text-gray-400 italic">No events selected</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Max Retry Limit
                  </label>
                  <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-800">
                    {webhook.maxRetry} attempt{webhook.maxRetry > 1 ? 's' : ''} with exponential backoff
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Description / Note
                  </label>
                  <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700">
                    {webhook.description || <span className="text-gray-400 italic">No description provided</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State / Creation Form */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <div className="max-w-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Create Webhook Endpoint</h2>
            <p className="text-sm text-gray-500 mb-6">
              Enter your backend server endpoint URL to receive payment events. A signing secret key will be generated for HMAC verification.
            </p>

            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Callback URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/api/payment-callbacks"
                  value={callbackUrl}
                  onChange={(e) => setCallbackUrl(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be an accessible HTTP or HTTPS URL capable of accepting POST requests.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Return URL <span className="text-xs text-gray-400">(Optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/checkout/success"
                  value={returnUrl}
                  onChange={(e) => setReturnUrl(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Redirect URL where the customer is sent after completing payment in the browser.
                </p>
              </div>

              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subscribed Events <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventPaymentCompleted}
                      onChange={(e) => setEventPaymentCompleted(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span><strong>payment.completed</strong> — Sent when a transaction is confirmed and paid</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventPaymentFailed}
                      onChange={(e) => setEventPaymentFailed(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span><strong>payment.failed</strong> — Sent when a transaction fails or expires</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Retry Limit <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={maxRetry}
                    onChange={(e) => setMaxRetry(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    {[1, 2, 3, 5, 8, 10].map((num) => (
                      <option key={num} value={num}>
                        {num} retry{num > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-xs text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Production Webhook"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || (!eventPaymentCompleted && !eventPaymentFailed)}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'Creating...' : 'Create Webhook Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* One-Time Secret Key Reveal Modal */}
      {revealedSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-200">
            <div className="flex items-center gap-3 text-emerald-600 mb-4">
              <div className="p-2.5 bg-emerald-50 rounded-full">
                <ShieldAlert className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Save Your Webhook Secret Key</h3>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-4 leading-relaxed">
              <strong>Important Security Notice:</strong> This secret key is shown <strong>only once</strong> and cannot be retrieved later. Copy it now and configure it in your server's environment or <code>application.properties</code> to verify incoming <code>X-Signature</code> headers.
            </div>

            <div className="mb-6">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
                Signing Secret Key
              </label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-300 rounded-xl font-mono text-xs break-all text-gray-900 select-all">
                <span className="flex-1">{revealedSecret}</span>
                <button
                  onClick={() => copySecretToClipboard(revealedSecret)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-white border border-gray-200 rounded-lg shadow-sm"
                >
                  {hasCopiedSecret ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setRevealedSecret(null)}
                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                I Have Saved My Secret Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Webhook Configuration</h3>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Callback URL</label>
                <input
                  type="url"
                  required
                  value={editForm.callbackUrl}
                  onChange={(e) => setEditForm({ ...editForm, callbackUrl: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Return URL</label>
                <input
                  type="url"
                  value={editForm.returnUrl || ''}
                  onChange={(e) => setEditForm({ ...editForm, returnUrl: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Subscribed Events</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.eventPaymentCompleted}
                      onChange={(e) => setEditForm({ ...editForm, eventPaymentCompleted: e.target.checked })}
                      className="rounded text-blue-600 h-4 w-4"
                    />
                    <span>payment.completed</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.eventPaymentFailed}
                      onChange={(e) => setEditForm({ ...editForm, eventPaymentFailed: e.target.checked })}
                      className="rounded text-blue-600 h-4 w-4"
                    />
                    <span>payment.failed</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Retry</label>
                  <select
                    value={editForm.maxRetry}
                    onChange={(e) => setEditForm({ ...editForm, maxRetry: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {[1, 2, 3, 5, 8, 10].map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
