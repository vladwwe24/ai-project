import { Box, Flex, Text } from '@chakra-ui/react'
import type { Job } from '@/entities/job/model/types'
import { JobStatusBadge } from '@/entities/job/ui/JobStatusBadge'
import { formatDate, formatTime } from '@/shared/lib/index'

interface Props {
  job: Job
  customerName?: string
  onClick?: () => void
}

export function JobCard({ job, customerName, onClick }: Props) {
  return (
    <Box
      borderWidth="1px"
      borderRadius="md"
      p={3}
      cursor="pointer"
      _hover={{ bg: 'gray.50' }}
      onClick={onClick}
    >
      <Flex justify="space-between" align="flex-start" mb={1}>
        <Text fontWeight="medium">
          {job.applianceType}{job.brand ? ` · ${job.brand}` : ''}
        </Text>
        <JobStatusBadge status={job.status} />
      </Flex>
      {customerName && (
        <Text fontSize="sm" color="fg.muted">{customerName}</Text>
      )}
      <Text fontSize="sm" color="fg.muted" noOfLines={1}>{job.issue}</Text>
      <Text fontSize="xs" color="fg.subtle" mt={1}>
        {formatDate(job.scheduledAt)} at {formatTime(job.scheduledAt)}
      </Text>
    </Box>
  )
}
