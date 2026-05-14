import { Box, Text } from '@chakra-ui/react'
import type { MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Job } from '@/entities/job/model/types'
import type { Customer } from '@/entities/customer/model/types'
import { JobBlock } from './JobBlock'
import {
  GRID_START_HOUR,
  GRID_END_HOUR,
  HOUR_HEIGHT,
  TOTAL_HEIGHT,
  hourLabel,
  isoToGridTop,
  snapToHour,
  slotToIso,
} from '../lib/timeUtils'

const LABEL_LEFT = 56 // px — must match JobBlock

interface Props {
  jobs: Job[]
  customers: Customer[]
  selectedDate: Date
  onSlotTap: (iso: string) => void
}

export function TimelineGrid({ jobs, customers, selectedDate, onSlotTap }: Props) {
  const navigate = useNavigate()
  const hours = Array.from(
    { length: GRID_END_HOUR - GRID_START_HOUR },
    (_, i) => GRID_START_HOUR + i,
  )

  function handleClick(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const { hour, minute } = snapToHour(y)
    onSlotTap(slotToIso(selectedDate, hour, minute))
  }

  return (
    <Box
      position="relative"
      height={`${TOTAL_HEIGHT}px`}
      onClick={handleClick}
      cursor="crosshair"
    >
      {/* Hour row lines + labels */}
      {hours.map(hour => (
        <Box
          key={hour}
          position="absolute"
          top={`${(hour - GRID_START_HOUR) * HOUR_HEIGHT}px`}
          left={0}
          right={0}
          height={`${HOUR_HEIGHT}px`}
          borderTopWidth="1px"
          borderColor="border"
          pointerEvents="none"
        >
          <Text
            fontSize="xs"
            color="fg.subtle"
            position="absolute"
            top="4px"
            left="4px"
            lineHeight={1}
            userSelect="none"
            w={`${LABEL_LEFT - 8}px`}
            textAlign="right"
          >
            {hourLabel(hour)}
          </Text>
        </Box>
      ))}

      {/* Job blocks */}
      {jobs.map(job => {
        const top = isoToGridTop(job.scheduledAt)
        if (top === null) return null
        const customer = customers.find(c => c.id === job.customerId)
        return (
          <JobBlock
            key={job.id}
            job={job}
            customerName={customer?.name}
            top={top}
            onClick={() => navigate(`/jobs/${job.id}`)}
          />
        )
      })}
    </Box>
  )
}
