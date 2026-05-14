import type { LineItem } from '@/entities/line-item/model/types'

export const EstimateStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const

export type EstimateStatus = typeof EstimateStatus[keyof typeof EstimateStatus]

export interface Estimate {
  id: string
  jobId: string
  estimateNumber: string
  lineItems: LineItem[]
  taxRate: number
  status: EstimateStatus
  approvalToken?: string
  approvedBy?: string
  approvedAt?: string
  sentAt?: string
  createdAt: string
  updatedAt: string
}
