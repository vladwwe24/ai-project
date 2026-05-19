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
  isoToBlockHeight,
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

interface JobLayout {
  job: Job
  top: number
  height: number
  columnIndex: number
  totalColumns: number
}

function getJobEndMs(job: Job): number {
  if (job.scheduledEndAt) return new Date(job.scheduledEndAt).getTime()
  return new Date(job.scheduledAt).getTime() + 3_600_000 // default 1 hour
}

function computeLayouts(jobs: Job[]): JobLayout[] {
  const visible = jobs
    .map(job => ({ job, top: isoToGridTop(job.scheduledAt) }))
    .filter((x): x is { job: Job; top: number } => x.top !== null)

  if (visible.length === 0) return []

  // Sort by start time ascending
  visible.sort((a, b) =>
    new Date(a.job.scheduledAt).getTime() - new Date(b.job.scheduledAt).getTime()
  )

  // Greedy column assignment: columns array holds the end-ms of the last job in each column
  const columnEnds: number[] = []
  const assigned: Array<{ job: Job; top: number; columnIndex: number }> = []

  for (const { job, top } of visible) {
    const startMs = new Date(job.scheduledAt).getTime()
    const endMs = getJobEndMs(job)
    let col = columnEnds.findIndex(endTime => endTime <= startMs)
    if (col === -1) col = columnEnds.length
    columnEnds[col] = endMs
    assigned.push({ job, top, columnIndex: col })
  }

  // Determine totalColumns for each job: max column index among all jobs that overlap with it, + 1
  const result: JobLayout[] = assigned.map(({ job, top, columnIndex }) => {
    const startMs = new Date(job.scheduledAt).getTime()
    const endMs = getJobEndMs(job)
    let maxCol = columnIndex
    for (const other of assigned) {
      const otherStart = new Date(other.job.scheduledAt).getTime()
      const otherEnd = getJobEndMs(other.job)
      if (otherStart < endMs && otherEnd > startMs) {
        if (other.columnIndex > maxCol) maxCol = other.columnIndex
      }
    }
    return {
      job,
      top,
      height: isoToBlockHeight(job.scheduledAt, job.scheduledEndAt),
      columnIndex,
      totalColumns: maxCol + 1,
    }
  })

  return result
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

  const layouts = computeLayouts(jobs)

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
      {layouts.map(({ job, top, height, columnIndex, totalColumns }) => {
        const customer = customers.find(c => c.id === job.customerId)
        return (
          <JobBlock
            key={job.id}
            job={job}
            customerName={customer?.name}
            top={top}
            height={height}
            columnIndex={columnIndex}
            totalColumns={totalColumns}
            onClick={() => navigate(`/jobs/${job.id}`)}
          />
        )
      })}
    </Box>
  )
}
