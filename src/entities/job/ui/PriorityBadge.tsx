import { Badge } from '@chakra-ui/react'

type Priority = 'NORMAL' | 'URGENT'

interface Props {
  priority: Priority
}

export function PriorityBadge({ priority }: Props) {
  return (
    <Badge colorPalette={priority === 'URGENT' ? 'red' : 'gray'} variant="subtle">
      {priority === 'URGENT' ? 'Urgent' : 'Normal'}
    </Badge>
  )
}
