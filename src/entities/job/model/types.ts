export const JobStatus = {
  NEW: 'NEW',
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_PARTS: 'WAITING_PARTS',
  ESTIMATE_SENT: 'ESTIMATE_SENT',
  APPROVED: 'APPROVED',
  INVOICED: 'INVOICED',
  PAID: 'PAID',
  COMPLETED: 'COMPLETED',
} as const

export type JobStatus = typeof JobStatus[keyof typeof JobStatus]

export interface Job {
  id: string
  customerId: string
  applianceType: string
  brand?: string
  model?: string
  issue: string
  status: JobStatus
  scheduledAt: string
  completedAt?: string
  signature?: string
  notes?: string
  createdAt: string
  updatedAt: string
}
