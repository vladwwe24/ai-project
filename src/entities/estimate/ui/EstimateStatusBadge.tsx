import { Badge } from '@chakra-ui/react'
import type { EstimateStatus } from '../model/types'

const varMap: Record<EstimateStatus, string> = {
  DRAFT:    'neutral',
  SENT:     'info',
  APPROVED: 'success',
  REJECTED: 'danger',
}

const labelMap: Record<EstimateStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

interface Props {
  status: EstimateStatus
}

export function EstimateStatusBadge({ status }: Props) {
  const k = varMap[status]
  return (
    <Badge variant="subtle" style={{ background: `var(--badge-${k}-bg)`, color: `var(--badge-${k}-fg)` }}>
      {labelMap[status]}
    </Badge>
  )
}
