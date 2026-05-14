import { Badge } from '@chakra-ui/react'
import type { JobStatus } from '../model/types'

const colorMap: Record<JobStatus, string> = {
  NEW: 'gray',
  SCHEDULED: 'blue',
  IN_PROGRESS: 'yellow',
  WAITING_PARTS: 'purple',
  ESTIMATE_SENT: 'cyan',
  APPROVED: 'teal',
  INVOICED: 'orange',
  PAID: 'green',
  COMPLETED: 'gray',
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
}

interface Props {
  status: JobStatus
}

export function JobStatusBadge({ status }: Props) {
  return (
    <Badge colorPalette={colorMap[status]} variant="subtle">
      {labelMap[status]}
    </Badge>
  )
}
