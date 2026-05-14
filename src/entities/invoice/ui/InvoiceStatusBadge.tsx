import { Badge } from '@chakra-ui/react'
import type { InvoiceStatus } from '@/entities/invoice/model/types'

interface Props {
  status: InvoiceStatus
}

const colorMap: Record<string, string> = {
  UNPAID: 'orange',
  PARTIAL: 'yellow',
  PAID: 'green',
  OVERDUE: 'red',
  CANCELLED: 'gray',
}

const labelMap: Record<string, string> = {
  UNPAID: 'Unpaid',
  PARTIAL: 'Partial',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
}

export function InvoiceStatusBadge({ status }: Props) {
  return (
    <Badge colorPalette={colorMap[status] ?? 'gray'} variant="subtle">
      {labelMap[status] ?? status}
    </Badge>
  )
}
