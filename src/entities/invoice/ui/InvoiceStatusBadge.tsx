import { Badge } from '@chakra-ui/react'
import type { InvoiceStatus } from '@/entities/invoice/model/types'

interface Props {
  status: InvoiceStatus
}

const varMap: Record<string, string> = {
  UNPAID:    'orange',
  PARTIAL:   'warning',
  PAID:      'success',
  OVERDUE:   'danger',
  CANCELLED: 'neutral',
}

const labelMap: Record<string, string> = {
  UNPAID: 'Unpaid',
  PARTIAL: 'Partial',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
}

export function InvoiceStatusBadge({ status }: Props) {
  const k = varMap[status] ?? 'neutral'
  return (
    <Badge variant="subtle" style={{ background: `var(--badge-${k}-bg)`, color: `var(--badge-${k}-fg)` }}>
      {labelMap[status] ?? status}
    </Badge>
  )
}
