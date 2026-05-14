import { nanoid } from 'nanoid'
import { STORAGE_KEYS } from '@/shared/config/storageKeys'
import { JobStatus } from '@/entities/job/model/types'
import type { Customer } from '@/entities/customer/model/types'
import type { Job } from '@/entities/job/model/types'
import type { Invoice } from '@/entities/invoice/model/types'
import { InvoiceStatus } from '@/entities/invoice/model/types'
import type { Estimate } from '@/entities/estimate/model/types'

export function seedIfEmpty(): void {
  if (localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) return

  const now = new Date().toISOString()

  const todayAt9 = new Date()
  todayAt9.setHours(9, 0, 0, 0)

  const tomorrowAt10 = new Date()
  tomorrowAt10.setDate(tomorrowAt10.getDate() + 1)
  tomorrowAt10.setHours(10, 0, 0, 0)

  const c1Id = nanoid()
  const c2Id = nanoid()
  const j1Id = nanoid()
  const j2Id = nanoid()

  const customers: Customer[] = [
    { id: c1Id, name: 'John Smith', phone: '555-1234', email: 'john@example.com', address: '123 Main St', createdAt: now },
    { id: c2Id, name: 'Maria Garcia', phone: '555-5678', email: 'maria@example.com', address: '456 Oak Ave', createdAt: now },
  ]

  const jobs: Job[] = [
    {
      id: j1Id,
      customerId: c1Id,
      applianceType: 'Refrigerator',
      brand: 'Samsung',
      issue: 'Not cooling properly',
      status: JobStatus.SCHEDULED,
      scheduledAt: todayAt9.toISOString(),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: j2Id,
      customerId: c2Id,
      applianceType: 'Washer',
      brand: 'LG',
      issue: 'Drum not spinning',
      status: JobStatus.IN_PROGRESS,
      scheduledAt: tomorrowAt10.toISOString(),
      createdAt: now,
      updatedAt: now,
    },
  ]

  const invoices: Invoice[] = [
    {
      id: nanoid(),
      jobId: j1Id,
      invoiceNumber: 'INV-2026-0001',
      lineItems: [{ id: nanoid(), description: 'Inspection', quantity: 1, unitPrice: 75 }],
      taxRate: 8.5,
      status: InvoiceStatus.UNPAID,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      jobId: j2Id,
      invoiceNumber: 'INV-2026-0002',
      lineItems: [{ id: nanoid(), description: 'Inspection', quantity: 1, unitPrice: 75 }],
      taxRate: 8.5,
      status: InvoiceStatus.UNPAID,
      createdAt: now,
      updatedAt: now,
    },
  ]

  const estimates: Estimate[] = []

  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers))
  localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs))
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices))
  localStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(estimates))
}
