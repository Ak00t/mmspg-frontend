import { api } from '../../../services/api'

export type ReportFormat = 'pdf' | 'xlsx' | 'csv'

function toApiDate(date: string) {
  const [year, month, day] = date.split('-')
  return `${day}-${month}-${year}`
}

async function download(
  path: string,
  startDate: string,
  endDate: string,
  format: ReportFormat,
  status?: string
) {
  const params: Record<string, string> = {
    startDate: toApiDate(startDate),
    endDate: toApiDate(endDate),
    format,
  }

  if (status && status !== 'ALL') {
    params.status = status
  }

  const response = await api.get(path, {
    params,
    responseType: 'blob',
  })

  let filename = `${path.includes('settlements') ? 'settlements' : 'sales-ledger'}.${format}`
  const disposition = response.headers?.['content-disposition']
  if (disposition && typeof disposition === 'string' && disposition.includes('filename=')) {
    const matched = disposition.match(/filename=["']?([^"';]+)["']?/)
    if (matched && matched[1]) {
      filename = matched[1].trim()
    }
  }

  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export const downloadSalesLedger = (
  startDate: string,
  endDate: string,
  format: ReportFormat,
  status?: string
) => download('/api/v1/merchant/reports/sales-ledger/export', startDate, endDate, format, status)

export const downloadSettlements = (
  startDate: string,
  endDate: string,
  format: ReportFormat,
  status?: string
) => download('/api/v1/merchant/reports/settlements/export', startDate, endDate, format, status)
