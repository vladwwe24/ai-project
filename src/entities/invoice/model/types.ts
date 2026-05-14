import type { LineItem } from '@/entities/line-item/model/types'

export const InvoiceStatus = {
  UNPAID: 'UNPAID',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
} as const

export type InvoiceStatus = typeof InvoiceStatus[keyof typeof InvoiceStatus]

export interface Invoice {
  id: string
  jobId: string
  invoiceNumber: string
  lineItems: LineItem[]
  taxRate: number
  status: InvoiceStatus
  paidAt?: string
  paidAmount?: number
  paymentMethod?: string
  createdAt: string
  updatedAt: string
}
