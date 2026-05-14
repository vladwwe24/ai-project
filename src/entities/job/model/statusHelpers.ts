import { JobStatus } from './types'

const LINEAR_FLOW: JobStatus[] = [
  JobStatus.NEW,
  JobStatus.SCHEDULED,
  JobStatus.IN_PROGRESS,
  JobStatus.APPROVED,
  JobStatus.INVOICED,
  JobStatus.PAID,
]

export function getNextStatus(status: JobStatus): JobStatus | null {
  const idx = LINEAR_FLOW.indexOf(status)
  if (idx === -1 || idx === LINEAR_FLOW.length - 1) return null
  return LINEAR_FLOW[idx + 1]
}

export function isTerminal(status: JobStatus): boolean {
  return status === JobStatus.PAID || status === JobStatus.COMPLETED
}

export function canFinishJob(status: JobStatus): boolean {
  return (
    status === JobStatus.IN_PROGRESS ||
    status === JobStatus.APPROVED ||
    status === JobStatus.INVOICED
  )
}

const ADVANCE_LABELS: Partial<Record<JobStatus, string>> = {
  NEW: 'Schedule',
  SCHEDULED: 'Start Work',
  IN_PROGRESS: 'Mark Approved',
  APPROVED: 'Generate Invoice',
  INVOICED: 'Mark Paid',
}

export function getAdvanceLabel(status: JobStatus): string | null {
  return ADVANCE_LABELS[status] ?? null
}
