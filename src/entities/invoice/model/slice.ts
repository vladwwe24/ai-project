import type { Invoice } from './types'
import { InvoiceStatus } from './types'

export type InvoiceAction =
  | { type: 'invoice/ADD'; payload: Invoice }
  | { type: 'invoice/UPDATE'; payload: Invoice }

export function invoiceReducer(invoices: Invoice[], action: InvoiceAction): Invoice[] {
  switch (action.type) {
    case 'invoice/ADD':
      return [...invoices, action.payload]
    case 'invoice/UPDATE': {
      const updated = { ...action.payload, updatedAt: new Date().toISOString() }
      return invoices.map(inv => inv.id === updated.id ? updated : inv)
    }
    default:
      return invoices
  }
}

export const selectInvoiceByJob = (invoices: Invoice[], jobId: string): Invoice | undefined =>
  invoices.find(inv => inv.jobId === jobId)

export const selectInvoicesByStatus = (invoices: Invoice[], status: InvoiceStatus): Invoice[] =>
  invoices.filter(inv => inv.status === status)
