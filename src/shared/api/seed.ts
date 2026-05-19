import { nanoid } from 'nanoid'
import { STORAGE_KEYS } from '@/shared/config/storageKeys'
import { JobStatus } from '@/entities/job/model/types'
import type { Customer } from '@/entities/customer/model/types'
import type { Job } from '@/entities/job/model/types'
import type { Invoice } from '@/entities/invoice/model/types'
import { InvoiceStatus } from '@/entities/invoice/model/types'
import type { Estimate } from '@/entities/estimate/model/types'
import { EstimateStatus } from '@/entities/estimate/model/types'

const SEED_VERSION = 'v4'

function dateToday(h: number, m = 0): string {
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

function dateTomorrow(h: number, m = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

function dateYesterday(h: number, m = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export function seedIfEmpty(): void {
  if (localStorage.getItem('seed_version') === SEED_VERSION) return

  // Clear existing data before re-seeding
  localStorage.removeItem(STORAGE_KEYS.CUSTOMERS)
  localStorage.removeItem(STORAGE_KEYS.JOBS)
  localStorage.removeItem(STORAGE_KEYS.INVOICES)
  localStorage.removeItem(STORAGE_KEYS.ESTIMATES)

  const now = new Date().toISOString()

  // ── Customers ────────────────────────────────────────────────────────────
  const c1Id = nanoid()
  const c2Id = nanoid()
  const c3Id = nanoid()
  const c4Id = nanoid()
  const c5Id = nanoid()
  const c6Id = nanoid()

  const customers: Customer[] = [
    {
      id: c1Id,
      name: 'Elizabeth Schindler',
      phone: '206-555-0101',
      email: 'elizabeth.schindler@email.com',
      address: '2156 Northeast Morgan Lane, Issaquah, WA 98029',
      createdAt: now,
    },
    {
      id: c2Id,
      name: 'Mjellma Berisha',
      phone: '425-555-0182',
      email: 'mjellma.berisha@email.com',
      address: '18402 Northeast 27th Way, Redmond, WA 98052',
      createdAt: now,
    },
    {
      id: c3Id,
      name: 'Nancy Jefferson',
      phone: '206-555-0247',
      email: 'nancy.jefferson@email.com',
      address: '606 20th Avenue East, Seattle, WA 98112',
      createdAt: now,
    },
    {
      id: c4Id,
      name: 'Anuj Kumar',
      phone: '425-555-0334',
      email: 'anuj.kumar@email.com',
      address: '13001 Northeast 113th Street, Kirkland, WA 98033',
      createdAt: now,
    },
    {
      id: c5Id,
      name: 'Robert Chen',
      phone: '206-555-0419',
      email: 'robert.chen@email.com',
      address: '789 Pine Street, Seattle, WA 98101',
      createdAt: now,
    },
    {
      id: c6Id,
      name: 'Sarah Mitchell',
      phone: '425-555-0567',
      email: 'sarah.mitchell@email.com',
      address: '234 Bellevue Way NE, Bellevue, WA 98004',
      createdAt: now,
    },
  ]

  // ── Jobs ─────────────────────────────────────────────────────────────────
  const j1Id = nanoid()
  const j2Id = nanoid()
  const j3Id = nanoid()
  const j4Id = nanoid()
  const j5Id = nanoid()
  const j6Id = nanoid()
  const j7Id = nanoid()

  const jobs: Job[] = [
    {
      id: j1Id,
      customerId: c1Id,
      name: 'Job for Elizabeth Schindler',
      jobNumber: '00001',
      applianceType: 'Dishwasher',
      brand: 'GE',
      model: 'GDT695SSJSS',
      issue: 'Leveling needed and spray arm clogged',
      status: JobStatus.COMPLETED,
      scheduledAt: dateToday(8),
      scheduledEndAt: dateToday(10),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: j2Id,
      customerId: c3Id,
      name: 'Job for Nancy Jefferson',
      jobNumber: '00002',
      applianceType: 'Dishwasher',
      brand: 'Bosch',
      model: 'SHPM88Z75N',
      issue: 'Stops working and returns error "f6"',
      status: JobStatus.ESTIMATE_SENT,
      scheduledAt: dateToday(10),
      scheduledEndAt: dateToday(12),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: j3Id,
      customerId: c2Id,
      name: 'Job for Mjellma Berisha',
      jobNumber: '00003',
      applianceType: 'Dishwasher',
      brand: 'Asko',
      model: 'D5556XXL',
      issue: 'Drain system not clearing properly',
      status: JobStatus.PAID,
      scheduledAt: dateToday(12),
      scheduledEndAt: dateToday(14),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: j4Id,
      customerId: c4Id,
      name: 'Job for Anuj Kumar',
      jobNumber: '00004',
      applianceType: 'Microwave',
      brand: 'Bosch',
      model: 'HMB50152UC',
      issue: 'Housecall inspection requested',
      status: JobStatus.INVOICED,
      scheduledAt: dateToday(16),
      scheduledEndAt: dateToday(17),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: j5Id,
      customerId: c5Id,
      name: 'Job for Robert Chen',
      jobNumber: '00005',
      applianceType: 'Refrigerator',
      brand: 'Samsung',
      model: 'RS28A500ASR',
      issue: 'Not cooling properly, ice maker stopped working',
      status: JobStatus.SCHEDULED,
      scheduledAt: dateTomorrow(9),
      scheduledEndAt: dateTomorrow(11),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: j6Id,
      customerId: c6Id,
      name: 'Job for Sarah Mitchell',
      jobNumber: '00006',
      applianceType: 'Washer',
      brand: 'LG',
      model: 'WM3900HBA',
      issue: 'Drum not spinning, leaking water from door seal',
      status: JobStatus.IN_PROGRESS,
      scheduledAt: dateTomorrow(14),
      scheduledEndAt: dateTomorrow(16),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: j7Id,
      customerId: c1Id,
      name: 'Job for Elizabeth Schindler',
      jobNumber: '00007',
      applianceType: 'Oven',
      brand: 'KitchenAid',
      model: 'KOSE500ESS',
      issue: 'Bottom element not heating, temperature inconsistent',
      status: JobStatus.SCHEDULED,
      scheduledAt: dateTomorrow(13),
      scheduledEndAt: dateTomorrow(15),
      createdAt: now,
      updatedAt: now,
    },
  ]

  // ── Invoices ──────────────────────────────────────────────────────────────
  const invoices: Invoice[] = [
    {
      id: nanoid(),
      jobId: j1Id,
      invoiceNumber: 'INV-2026-0001',
      lineItems: [
        { id: nanoid(), description: 'GE Dishwasher Leveling Service', quantity: 1, unitPrice: 95 },
        { id: nanoid(), description: 'Spray Arm Cleaning & Inspection', quantity: 1, unitPrice: 85 },
      ],
      taxRate: 10.35,
      status: InvoiceStatus.PAID,
      paidAt: dateToday(10),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      jobId: j2Id,
      invoiceNumber: 'INV-2026-0002',
      lineItems: [
        { id: nanoid(), description: 'Housecall Inspection Fee', quantity: 1, unitPrice: 95 },
      ],
      taxRate: 10.35,
      status: InvoiceStatus.UNPAID,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      jobId: j3Id,
      invoiceNumber: 'INV-2026-0003',
      lineItems: [
        { id: nanoid(), description: 'Asko Dishwasher Drain System Cleaning', quantity: 1, unitPrice: 269 },
        { id: nanoid(), description: 'Bank Card Fee 3.5%', quantity: 1, unitPrice: 8.83 },
      ],
      taxRate: 10.35,
      status: InvoiceStatus.PAID,
      paidAt: dateToday(14),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      jobId: j4Id,
      invoiceNumber: 'INV-2026-0004',
      lineItems: [
        { id: nanoid(), description: 'Bosch Microwave Housecall Inspection Fee', quantity: 1, unitPrice: 95 },
      ],
      taxRate: 10.35,
      status: InvoiceStatus.UNPAID,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      jobId: j5Id,
      invoiceNumber: 'INV-2026-0005',
      lineItems: [
        { id: nanoid(), description: 'Housecall Inspection Fee', quantity: 1, unitPrice: 95 },
      ],
      taxRate: 10.35,
      status: InvoiceStatus.UNPAID,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      jobId: j6Id,
      invoiceNumber: 'INV-2026-0006',
      lineItems: [
        { id: nanoid(), description: 'Housecall Inspection Fee', quantity: 1, unitPrice: 95 },
      ],
      taxRate: 10.35,
      status: InvoiceStatus.UNPAID,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      jobId: j7Id,
      invoiceNumber: 'INV-2026-0007',
      lineItems: [
        { id: nanoid(), description: 'Housecall Inspection Fee', quantity: 1, unitPrice: 95 },
      ],
      taxRate: 10.35,
      status: InvoiceStatus.UNPAID,
      createdAt: now,
      updatedAt: now,
    },
  ]

  // ── Estimates ─────────────────────────────────────────────────────────────
  const estimates: Estimate[] = [
    {
      id: nanoid(),
      jobId: j2Id,
      estimateNumber: '000001',
      lineItems: [
        { id: nanoid(), description: 'Bosch Dishwasher Control Board Replacement', quantity: 1, unitPrice: 285 },
        { id: nanoid(), description: 'Control Board (Part #11027789)', quantity: 1, unitPrice: 195 },
        { id: nanoid(), description: 'Labor – 1.5 hrs', quantity: 1.5, unitPrice: 95 },
      ],
      taxRate: 10.35,
      status: EstimateStatus.SENT,
      sentAt: dateYesterday(15),
      createdAt: dateYesterday(14),
      updatedAt: dateYesterday(15),
    },
    {
      id: nanoid(),
      jobId: j5Id,
      estimateNumber: '000002',
      lineItems: [
        { id: nanoid(), description: 'Samsung Refrigerator Diagnostic & Labor', quantity: 1, unitPrice: 145 },
        { id: nanoid(), description: 'Evaporator Fan Motor (Part #DA31-00187A)', quantity: 1, unitPrice: 85 },
        { id: nanoid(), description: 'Defrost Heater Assembly', quantity: 1, unitPrice: 65 },
      ],
      taxRate: 10.35,
      status: EstimateStatus.DRAFT,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: nanoid(),
      jobId: j1Id,
      estimateNumber: '000003',
      lineItems: [
        { id: nanoid(), description: 'GE Dishwasher Leveling Service', quantity: 1, unitPrice: 95 },
        { id: nanoid(), description: 'Spray Arm Cleaning & Inspection', quantity: 1, unitPrice: 85 },
      ],
      taxRate: 10.35,
      status: EstimateStatus.APPROVED,
      approvedBy: 'Elizabeth Schindler',
      approvedAt: dateYesterday(9),
      createdAt: dateYesterday(8),
      updatedAt: dateYesterday(9),
    },
  ]

  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers))
  localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs))
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices))
  localStorage.setItem(STORAGE_KEYS.ESTIMATES, JSON.stringify(estimates))
  localStorage.setItem('seed_version', SEED_VERSION)
}
