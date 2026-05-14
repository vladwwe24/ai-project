import type { Invoice } from '@/entities/invoice/model/types'
import type { Job } from '@/entities/job/model/types'
import type { Customer } from '@/entities/customer/model/types'
import { calcSubtotal, calcTax, calcTotal } from '@/entities/estimate/model/calcHelpers'
import { formatCurrency, formatDate } from '@/shared/lib/index'

export interface ExportRow {
  invoiceNumber: string
  customer: string
  appliance: string
  status: string
  subtotal: string
  tax: string
  total: string
  createdAt: string
}

function escapeCell(value: string | undefined | null): string {
  const str = value ?? ''
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function buildRow(
  invoice: Invoice,
  job: Job | undefined,
  customer: Customer | undefined,
): ExportRow {
  const subtotal = calcSubtotal(invoice.lineItems)
  const tax = calcTax(subtotal, invoice.taxRate)
  const total = calcTotal(subtotal, tax)

  return {
    invoiceNumber: invoice.invoiceNumber,
    customer: customer?.name ?? '',
    appliance: job
      ? `${job.applianceType}${job.brand ? ` ${job.brand}` : ''}`
      : '',
    status: invoice.status,
    subtotal: formatCurrency(subtotal),
    tax: formatCurrency(tax),
    total: formatCurrency(total),
    createdAt: formatDate(invoice.createdAt),
  }
}

const HEADERS: Array<keyof ExportRow> = [
  'invoiceNumber',
  'customer',
  'appliance',
  'status',
  'subtotal',
  'tax',
  'total',
  'createdAt',
]

const HEADER_LABELS: Record<keyof ExportRow, string> = {
  invoiceNumber: 'Invoice #',
  customer: 'Customer',
  appliance: 'Appliance',
  status: 'Status',
  subtotal: 'Subtotal',
  tax: 'Tax',
  total: 'Total',
  createdAt: 'Created',
}

export function exportInvoicesToCsv(params: {
  invoices: Invoice[]
  jobs: Job[]
  customers: Customer[]
  from: Date | null
  to: Date | null
}): void {
  const { invoices, jobs, customers, from, to } = params

  const toEnd = to ? new Date(to) : null
  if (toEnd) toEnd.setHours(23, 59, 59, 999)

  const filtered = invoices.filter(inv => {
    const d = new Date(inv.createdAt)
    if (from && d < from) return false
    if (toEnd && d > toEnd) return false
    return true
  })

  const rows = filtered
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(inv => {
      const job = jobs.find(j => j.id === inv.jobId)
      const customer = job ? customers.find(c => c.id === job.customerId) : undefined
      return buildRow(inv, job, customer)
    })

  const headerLine = HEADERS.map(k => HEADER_LABELS[k]).join(',')
  const dataLines = rows.map(row =>
    HEADERS.map(k => escapeCell(row[k])).join(',')
  )

  const csv = [headerLine, ...dataLines].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

export function countExportRows(params: {
  invoices: Invoice[]
  from: Date | null
  to: Date | null
}): number {
  const { invoices, from, to } = params
  const toEnd = to ? new Date(to) : null
  if (toEnd) toEnd.setHours(23, 59, 59, 999)

  return invoices.filter(inv => {
    const d = new Date(inv.createdAt)
    if (from && d < from) return false
    if (toEnd && d > toEnd) return false
    return true
  }).length
}
