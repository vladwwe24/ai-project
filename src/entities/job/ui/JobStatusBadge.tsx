import { Badge } from '@chakra-ui/react'
import type { JobStatus } from '../model/types'

const varMap: Record<JobStatus, string> = {
  NEW:           'neutral',
  SCHEDULED:     'info',
  IN_PROGRESS:   'warning',
  WAITING_PARTS: 'purple',
  ESTIMATE_SENT: 'cyan',
  APPROVED:      'teal',
  INVOICED:      'orange',
  PAID:          'success',
  COMPLETED:     'neutral',
  CANCELLED:     'danger',
}

const labelMap: Record<JobStatus, string> = {
  NEW: 'New',
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  WAITING_PARTS: 'Waiting Parts',
  ESTIMATE_SENT: 'Estimate Sent',
  APPROVED: 'Approved',
  INVOICED: 'Invoiced',
  PAID: 'Paid',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

interface Props {
  status: JobStatus
}

export function JobStatusBadge({ status }: Props) {
  const k = varMap[status]
  return (
    <Badge variant="subtle" style={{ background: `var(--badge-${k}-bg)`, color: `var(--badge-${k}-fg)` }}>
      {labelMap[status]}
    </Badge>
  )
}
