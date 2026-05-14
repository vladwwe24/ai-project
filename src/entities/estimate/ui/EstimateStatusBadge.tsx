import { Badge } from '@chakra-ui/react'
import type { EstimateStatus } from '../model/types'

const colorMap: Record<EstimateStatus, string> = {
  DRAFT: 'gray',
  SENT: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
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
  return (
    <Badge colorPalette={colorMap[status]} variant="subtle">
      {labelMap[status]}
    </Badge>
  )
}
