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
  CANCELLED: 'CANCELLED',
} as const

export type JobStatus = typeof JobStatus[keyof typeof JobStatus]

export interface Note {
  id: string
  body: string
  createdAt: string
  updatedAt: string
}

export interface Attachment {
  id: string
  dataUrl: string
  createdAt: string
}

export interface Job {
  id: string
  customerId: string
  applianceType: string
  brand?: string
  model?: string
  issue?: string
  status: JobStatus
  scheduledAt: string
  scheduledEndAt?: string
  name?: string
  jobNumber?: string
  completedAt?: string
  signature?: string
  notes?: Note[]
  attachments?: Attachment[]
  createdAt: string
  updatedAt: string
}
