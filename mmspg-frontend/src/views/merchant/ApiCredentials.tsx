import React, { useEffect, useState } from 'react'
import {
  Key,
  Plus,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Trash2,
  ShieldAlert,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  Layers,
  Activity,
  Code
} from 'lucide-react'
import {
  getCredentials,
  createCredential,
  regenerateSecret,
  revokeCredential,
} from '../../features/main-merchant/api/merchantCredentialApi'
import type { ApiCredentialItem, CreateCredentialInput } from '../../features/main-merchant/types'

export default function MerchantApiCredentials() {
  const [credentials, setCredentials] = useState<ApiCredentialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateCredentialInput>({
    keyName: '',
    ipAddress: '0.0.0.0/0',
    environment: 'SANDBOX',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // One-time Secret Reveal Modal
  const [revealedCred, setRevealedCred] = useState<{ clientId: string; clientSecret: string } | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const [copiedClientId, setCopiedClientId] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedIdMap, setCopiedIdMap] = useState<Record<string, boolean>>({})

  // Action Modals
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadCredentials()
  }, [])

  async function loadCredentials() {
    setLoading(true)
    setError(null)
    try {
      const data = await getCredentials()
      setCredentials(data)
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || 'Failed to load API credentials')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!createForm.keyName.trim()) return

    setIsSubmitting(true)
    setError(null)
    try {
      const created = await createCredential({
        keyName: createForm.keyName.trim(),
        ipAddress: createForm.ipAddress?.trim() || '0.0.0.0/0',
        environment: createForm.environment,
      })

      setIsCreateOpen(false)
      setCreateForm({ keyName: '', ipAddress: '0.0.0.0/0', environment: 'SANDBOX' })

      if (created.clientSecret) {
        setRevealedCred({
          clientId: created.clientId,
          clientSecret: created.clientSecret,
        })
      }
      await loadCredentials()
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || 'Failed to generate API credential')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleConfirmRegenerate() {
    if (!regeneratingId) return
    setActionLoading(true)
    setError(null)
    try {
      const updated = await regenerateSecret(regeneratingId)
      setRegeneratingId(null)
      if (updated.clientSecret) {
        setRevealedCred({
          clientId: updated.clientId,
          clientSecret: updated.clientSecret,
        })
      }
      await loadCredentials()
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || 'Failed to regenerate client secret')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleConfirmRevoke() {
    if (!revokingId) return
    setActionLoading(true)
    setError(null)
    try {
      await revokeCredential(revokingId)
      setRevokingId(null)
      await loadCredentials()
    } catch (err: any) {
      console.error(err)
      setError(err?.response?.data?.message || 'Failed to revoke API credential')
    } finally {
      setActionLoading(false)
    }
  }

  function copyToClipboard(text: string, type: 'clientId' | 'secret') {
    navigator.clipboard.writeText(text)
    if (type === 'clientId') {
      setCopiedClientId(true)
      setTimeout(() => setCopiedClientId(false), 2000)
    } else {
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    }
  }

  function copyTableClientId(id: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopiedIdMap((prev) => ({ ...prev, [id]: true }))
    setTimeout(() => {
      setCopiedIdMap((prev) => ({ ...prev, [id]: false }))
    }, 2000)
  }

  // Stats calculation
  const totalKeys = credentials.length
  const activeKeys = credentials.filter((c) => c.status === 'ACTIVE').length
  const sandboxKeys = credentials.filter((c) => c.environment === 'SANDBOX').length
  const productionKeys = credentials.filter((c) => c.environment === 'PRODUCTION').length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">API Credentials</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Generate and manage API keys (Client ID & Client Secret) for payment integration
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadCredentials}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Generate New Key
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Credentials</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalKeys}</p>
          </div>
          <div className="p-3 bg-gray-50 text-gray-600 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Keys</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{activeKeys}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sandbox Keys</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{sandboxKeys}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Code className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Production Keys</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{productionKeys}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Integration Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-lg mt-0.5">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-900">How to authenticate API requests</h3>
            <p className="text-xs text-blue-700 mt-1">
              Include your credentials in HTTP request headers when calling MMSPG Payment APIs:
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 bg-white/80 border border-blue-200 text-blue-800 rounded">
                X-Client-ID: mms_test_...
              </span>
              <span className="px-2.5 py-1 bg-white/80 border border-blue-200 text-blue-800 rounded">
                X-Client-Secret: [Your Secret]
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Credentials Table Card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-base font-semibold text-gray-900">Configured API Credentials</h2>
          <span className="text-xs text-gray-500 font-medium">{credentials.length} credentials</span>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-3 text-blue-500" />
            <p className="text-sm">Loading credentials...</p>
          </div>
        ) : credentials.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">No API Credentials Found</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mt-1 mb-5">
              You haven't generated any API keys yet. Generate a key to start integrating MMSPG payments into your eCommerce site.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Generate Your First Key
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 font-medium bg-gray-50/50">
                  <th className="py-3 px-4">Key Name</th>
                  <th className="py-3 px-4">Client ID</th>
                  <th className="py-3 px-4">Environment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Allowed IP</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {credentials.map((cred) => {
                  const isActive = cred.status === 'ACTIVE'
                  const isCopied = copiedIdMap[cred.credentialId]

                  return (
                    <tr key={cred.credentialId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-gray-400" />
                          <span>{cred.keyName || 'Unnamed Key'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-100 px-2 py-1 rounded text-gray-800">
                            {cred.clientId}
                          </span>
                          <button
                            onClick={() => copyTableClientId(cred.credentialId, cred.clientId)}
                            title="Copy Client ID"
                            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            cred.environment === 'PRODUCTION'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {cred.environment}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          {cred.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-gray-500">
                        {cred.ipAddress || '0.0.0.0/0'}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {cred.createdAt ? new Date(cred.createdAt).toLocaleDateString() : '-'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isActive ? (
                            <>
                              <button
                                onClick={() => setRegeneratingId(cred.credentialId)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md transition-colors border border-amber-200"
                                title="Regenerate Client Secret"
                              >
                                <RefreshCw className="w-3 h-3" />
                                Regenerate
                              </button>
                              <button
                                onClick={() => setRevokingId(cred.credentialId)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors border border-red-200"
                                title="Revoke API Key"
                              >
                                <Trash2 className="w-3 h-3" />
                                Revoke
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Revoked</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE CREDENTIAL MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Key className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Generate New API Key</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production eCommerce Store, Sandbox Test"
                  value={createForm.keyName}
                  onChange={(e) => setCreateForm({ ...createForm, keyName: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Environment <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                      createForm.environment === 'SANDBOX'
                        ? 'border-amber-500 bg-amber-50/50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="environment"
                      value="SANDBOX"
                      checked={createForm.environment === 'SANDBOX'}
                      onChange={() => setCreateForm({ ...createForm, environment: 'SANDBOX' })}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">SANDBOX</p>
                      <p className="text-xs text-gray-500">For testing (mms_test_...)</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                      createForm.environment === 'PRODUCTION'
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="environment"
                      value="PRODUCTION"
                      checked={createForm.environment === 'PRODUCTION'}
                      onChange={() => setCreateForm({ ...createForm, environment: 'PRODUCTION' })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">PRODUCTION</p>
                      <p className="text-xs text-gray-500">Live payments (mms_live_...)</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allowed IP Address / Whitelist
                </label>
                <input
                  type="text"
                  placeholder="0.0.0.0/0 or specific server IP"
                  value={createForm.ipAddress}
                  onChange={(e) => setCreateForm({ ...createForm, ipAddress: e.target.value })}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono outline-none transition"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Default is <code>0.0.0.0/0</code> allowing requests from any IP address.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !createForm.keyName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ONE-TIME SECRET REVEAL MODAL */}
      {revealedCred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100 text-emerald-600">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold text-gray-900">API Key Successfully Generated</h3>
            </div>

            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold">Save your Client Secret immediately!</p>
                <p className="mt-0.5">
                  For your security, this secret key will <strong>never be displayed again</strong>. Store it securely in your eCommerce backend environment variables.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Client ID (Header: X-Client-ID)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={revealedCred.clientId}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-mono text-xs text-gray-800 outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(revealedCred.clientId, 'clientId')}
                    className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-gray-200"
                  >
                    {copiedClientId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
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

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                  Client Secret (Header: X-Client-Secret)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative w-full">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      readOnly
                      value={revealedCred.clientSecret}
                      className="w-full px-3.5 py-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg font-mono text-xs text-gray-800 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={() => copyToClipboard(revealedCred.clientSecret, 'secret')}
                    className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    {copiedSecret ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied</span>
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
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setRevealedCred(null)
                  setShowSecret(false)
                }}
                className="px-5 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg shadow-sm"
              >
                I Have Saved My Secret
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGENERATE SECRET CONFIRMATION MODAL */}
      {regeneratingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center gap-3 text-amber-600 pb-3 border-b border-gray-100">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-gray-900">Regenerate Client Secret?</h3>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Are you sure you want to regenerate this secret? The previous secret will immediately become invalid, and any active integrations using it will fail until updated with the new secret.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setRegeneratingId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRegenerate}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center gap-2"
              >
                {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                Yes, Regenerate Secret
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVOKE CONFIRMATION MODAL */}
      {revokingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <div className="flex items-center gap-3 text-red-600 pb-3 border-b border-gray-100">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-lg font-bold text-gray-900">Revoke API Credential?</h3>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Are you sure you want to revoke this API credential? This action is permanent and cannot be undone. All payment requests using this Client ID will be rejected.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setRevokingId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRevoke}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2"
              >
                {actionLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                Yes, Revoke Credential
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
