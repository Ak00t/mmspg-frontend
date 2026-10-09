import { api } from '../../../services/api'

function toApiDate(date: string) {
  const [year, month, day] = date.split('-')
  return `${day}-${month}-${year}`
}

async function download(path: string, startDate: string, endDate: string, format: 'csv' | 'pdf' | 'xlsx') {
  const response = await api.get(path, {
    params: { startDate: toApiDate(startDate), endDate: toApiDate(endDate), format },
    responseType: 'blob',
  })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = `${path.includes('settlements') ? 'settlements' : 'sales-ledger'}.${format}`
  link.click()
  URL.revokeObjectURL(url)
}

export const downloadSalesLedger = (startDate: string, endDate: string, format: 'csv' | 'pdf' | 'xlsx') =>
  download('/api/v1/merchant/reports/sales-ledger/export', startDate, endDate, format)

export const downloadSettlements = (startDate: string, endDate: string, format: 'csv' | 'pdf' | 'xlsx') =>
  download('/api/v1/merchant/reports/settlements/export', startDate, endDate, format)
