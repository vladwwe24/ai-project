import { Box, Text } from '@chakra-ui/react'
import type { Job } from '@/entities/job/model/types'
import { formatTime } from '@/shared/lib/index'
import { BLOCK_HEIGHT } from '../lib/timeUtils'

const LABEL_LEFT = 56 // px — space reserved for hour labels

interface Props {
  job: Job
  customerName?: string
  top: number
  onClick: () => void
}

export function JobBlock({ job, customerName, top, onClick }: Props) {
  return (
    <Box
      position="absolute"
      top={`${top}px`}
      left={`${LABEL_LEFT}px`}
      right="8px"
      height={`${BLOCK_HEIGHT}px`}
      bg="blue.100"
      borderLeftWidth="3px"
      borderLeftColor="blue.500"
      borderRadius="md"
      p={1}
      cursor="pointer"
      overflow="hidden"
      zIndex={1}
      onClick={e => { e.stopPropagation(); onClick() }}
      _hover={{ bg: 'blue.200' }}
    >
      <Text fontSize="xs" fontWeight="semibold" lineClamp={1}>
        {job.applianceType}{job.brand ? ` · ${job.brand}` : ''}
      </Text>
      {customerName && (
        <Text fontSize="xs" color="fg.muted" lineClamp={1}>{customerName}</Text>
      )}
      <Text fontSize="xs" color="fg.subtle">{formatTime(job.scheduledAt)}</Text>
    </Box>
  )
}
