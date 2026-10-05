import { api } from '../../../services/api'

function toApiDate(date: string) {
  const [year, month, day] = date.split('-')
  return `${day}-${month}-${year}`
}

export async function downloadSalesLedger(startDate: string, endDate: string) {
  const response = await api.get('/api/v1/merchant/reports/sales-ledger/export', {
    params: { startDate: toApiDate(startDate), endDate: toApiDate(endDate) },
    responseType: 'blob',
  })
  return response.data as Blob
}

export async function downloadSettlements(startDate: string, endDate: string) {
  const response = await api.get('/api/v1/merchant/reports/settlements/export', {
    params: { startDate: toApiDate(startDate), endDate: toApiDate(endDate) },
    responseType: 'blob',
  })
  return response.data as Blob
}
